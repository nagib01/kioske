import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRealtimeQueue } from '../hooks/useRealtimeQueue';
import TriageForm, { PerguntaTriagem, RespostaTriagem } from '../components/TriageForm';

interface Servico {
  id: string;
  nome: string;
  tempo_medio_atendimento: number;
}

interface TicketData {
  id:string;
  token: string;
  codigo_senha: string;
  posicao_fila: number;
  prioridade: boolean;
  prioridade_nivel: string;
  estado: string;
  alertas: string[];
  criado_em: string;
  tempo_estimado_min: number;
  servico_id: string;
  servico?: { nome: string };
  aluno_token: string;
  qrCode?: string;
}

export default function AlunoPage() {
  const [fase, setFase] = useState<'servico' | 'triagem' | 'senha'>('servico');
  const [servicoSelecionado, setServicoSelecionado] = useState<Servico | null>(null);
  const [perguntas, setPerguntas] = useState<PerguntaTriagem[]>([]);
  const [carregandoPerguntas, setCarregandoPerguntas] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [ticketData, setTicketData] = useState<TicketData | null>(null);
  const [carregandoTriagem, setCarregandoTriagem] = useState(false);
  const [escolaId, setEscolaId] = useState<string>('');
  const [servicos, setServicos] = useState<Servico[]>([]);


  const router = useRouter();
  const { queueData, isConnected } = useRealtimeQueue(token);

  useEffect(() => {
    const savedEscolaId = localStorage.getItem('kioske_escolaId');
    const savedToken = localStorage.getItem('kioske_token');
    
    if (savedEscolaId) {
      setEscolaId(savedEscolaId);
    } else {
      const defaultEscolaId = '1';
      setEscolaId(defaultEscolaId);
      localStorage.setItem('kioske_escolaId', defaultEscolaId);
    }

    if (savedToken) {
      setToken(savedToken);
      fetchTicketData(savedToken);
    }
  }, []);

  useEffect(() => {
    if (router.isReady && servicos.length > 0) {
      const { servicoId } = router.query;
      if (servicoId) {
        const servico = servicos.find(s => s.id === servicoId);
        if (servico) {
          handleSelecionarServico(servico);
        }
      }
    }
  }, [router.isReady, servicos, router.query]);

  useEffect(() => {
    if (queueData && ticketData) {
      setTicketData((prev) => ({
        ...prev!,
        token: queueData.token || prev!.token,
        posicao_fila: queueData.posicao_fila !== undefined ? queueData.posicao_fila : prev!.posicao_fila,
        estado: queueData.estado || prev!.estado,
        tempo_estimado_min: Math.max((queueData.posicao_fila || 0 - 1) * (servicoSelecionado?.tempo_medio_atendimento || 10), 0)
      }));
    }
  }, [queueData, servicoSelecionado]);

  const fetchTicketData = async (alunoToken: string) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${alunoToken}`);
      if (res.ok) {
        const data = await res.json();
        setTicketData(data);
        setFase('senha');
      } else {
        localStorage.removeItem('kioske_token');
        setFase('servico');
      }
    } catch (e) {
      console.error('Erro ao buscar ticket', e);
    }
  };

  const handleSelecionarServico = async (servico: Servico) => {
    setServicoSelecionado(servico);
    setCarregandoPerguntas(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/triagem/perguntas/${servico.id}`);
      const data = await res.json();
      setPerguntas(data.perguntas || []);
      localStorage.setItem('kioske_servicoId', servico.id);
      setFase('triagem');
    } catch (e) {
      console.error('Erro ao carregar perguntas', e);
    } finally {
      setCarregandoPerguntas(false);
    }
  };

  const handleSubmitTriagem = async (respostas: RespostaTriagem[]) => {
    if (!servicoSelecionado) return;
    setCarregandoTriagem(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/triagem/finalizar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          servicoId: servicoSelecionado.id,
          respostas,
          escolaId,
        })
      });
      const data = await res.json();
      if (data.ticket) {
        localStorage.setItem('kioske_token', data.ticket.aluno_token);
        setToken(data.ticket.aluno_token);
        setTicketData(data.ticket);
        setFase('senha');
      }
    } catch (e) {
      console.error('Erro ao criar ticket', e);
    } finally {
      setCarregandoTriagem(false);
    }
  };

  const handleReimprimir = async () => {
    if (!ticketData?.id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tickets/${ticketData.id}/reprint`);
      if (res.ok) {
        const data = await res.json();
        if (data.ticket?.qrCode) {
          setTicketData(prev => prev ? { ...prev, qrCode: data.ticket.qrCode } : prev);
        }
      }
    } catch (e) {
      console.error('Erro ao reimprimir', e);
    }
  };

  const handleCancelar = () => {
    localStorage.removeItem('kioske_token');
    setToken(null);
    setFase('servico');
    setServicoSelecionado(null);
    setTicketData(null);
  };

  if (fase === 'servico') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Head>
          <title>Selecione o Servico | Kioske Digital</title>
        </Head>

        <header className="bg-white px-8 py-4 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Selecione o Servico</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-lg">
              Toque na opcao desejada para iniciar o seu atendimento.
            </p>
          </div>

          <ServicosGrid onSelecionarServico={handleSelecionarServico} setServicos={setServicos} />
        </main>

        <footer className="bg-white p-4 flex justify-between items-center text-sm text-gray-400 border-t border-gray-100">
        </footer>
      </div>
    );
  }

  if (fase === 'triagem' && servicoSelecionado) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Head>
          <title>Triagem | Kioske Digital</title>
        </Head>

        <header className="bg-white px-8 py-4 shadow-sm flex items-center justify-between">
          <h1 className="text-xl font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{servicoSelecionado.nome}</h2>
            <p className="text-gray-500 mb-8">Responda as seguintes perguntas para continuar:</p>

            <TriageForm
              perguntas={perguntas}
              onSubmit={handleSubmitTriagem}
              loading={carregandoTriagem}
            />

            <button
              onClick={() => {
                setFase('servico');
                setServicoSelecionado(null);
                setPerguntas([]);
              }}
              className="mt-6 w-full text-gray-600 hover:text-gray-800 font-medium text-sm"
            >
              voltar para servicos
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (fase === 'senha' && ticketData) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Head>
          <title>Sua Senha | Kioske Digital</title>
        </Head>

        <header className="bg-[#E2E8F0] px-8 py-3 shadow-sm flex items-center justify-between">
          <h1 className="text-lg font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        </header>

        <main className="flex-1 flex flex-col items-center py-10 px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-extrabold text-gray-800">Sua Senha Digital</h2>
            <p className="text-gray-500">Driving School Admin Terminal</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-gray-100 relative">
            <div className={`py-2 px-4 flex justify-between items-center text-white text-sm font-bold tracking-wider ${ticketData.estado === 'called' ? 'bg-red-600' : 'bg-[#047857]'}`}>
              <span>ESTADO: {ticketData.estado === 'called' ? 'CHAMADA' : 'EM ESPERA'}</span>
              <span className="flex items-center gap-2">
                {isConnected && <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>}
                LIVE
              </span>
            </div>

            <div className="p-8 flex flex-col items-center">
              <div className="w-full border-2 border-dashed border-green-200 rounded-xl p-8 mb-8 text-center bg-green-50/30">
                <span className="text-xs font-bold text-green-700 uppercase tracking-widest block mb-2">Senha Atual</span>
                <span className={`text-7xl font-black ${ticketData.estado === 'called' ? 'text-red-600' : 'text-[#047857]'}`}>
                  {ticketData.token || ticketData.codigo_senha}
                </span>
              </div>

              <div className="flex gap-4 w-full mb-8">
                <div className="flex-1 bg-blue-50/50 p-4 rounded-xl text-center border border-blue-100">
                  <span className="text-xs text-gray-500 font-bold mb-1 block">SUA VEZ EM:</span>
                  <span className="text-2xl font-bold text-gray-800">{ticketData.tempo_estimado_min} min</span>
                </div>
                <div className="flex-1 bg-blue-50/50 p-4 rounded-xl text-center border border-blue-100">
                  <span className="text-xs text-gray-500 font-bold mb-1 block">PESSOAS A FRENTE:</span>
                  <span className="text-2xl font-bold text-gray-800">{ticketData.posicao_fila}</span>
                </div>
              </div>

              {ticketData.alertas && ticketData.alertas.length > 0 && (
                <div className="w-full bg-orange-50 border border-orange-100 p-4 rounded-xl flex items-start gap-3 mb-8">
                  <span className="text-orange-500 text-xl">!</span>
                  <div>
                    <p className="font-bold text-orange-800 text-sm mb-1">Alertas:</p>
                    {ticketData.alertas.map((alerta, i) => (
                      <p key={i} className="text-orange-700 text-xs">
                        {alerta === 'urgencia_menos_10min' && 'Tem atividade em menos de 10 minutos'}
                        {alerta === 'hora_marcada' && 'Tem hora marcada para esta atividade'}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {ticketData.qrCode && (
                <div className="w-full mb-6 flex flex-col items-center">
                  <h4 className="font-bold text-gray-800 text-sm mb-3">Acompanhe no Telemovel</h4>
                  <img src={ticketData.qrCode} alt="QR Code da senha" className="w-40 h-40" />
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    Aponte a camara para o QR Code e receba notificacoes em tempo real.
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-4 flex gap-4 border-t border-gray-100">
              <button
                onClick={handleReimprimir}
                className="flex-1 py-3 font-bold text-[#047857] hover:bg-green-50 rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                Reimprimir
              </button>
              <button onClick={handleCancelar} className="flex-1 py-3 font-bold text-red-600 hover:bg-red-50 rounded-lg flex items-center justify-center gap-2 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return null;
}

function ServicosGrid({ onSelecionarServico, setServicos: setParentServicos }: { onSelecionarServico: (s: Servico) => void, setServicos: (s: Servico[]) => void }) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [escolaId, setEscolaId] = useState('');

  useEffect(() => {
    const fetchServicos = async () => {
      setCarregando(true);
      setErro(null);
      try {
        const savedEscolaId = localStorage.getItem('kioske_escolaId') || '1';
        setEscolaId(savedEscolaId);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
        const url = `${apiUrl}/api/servicos?escolaId=${encodeURIComponent(savedEscolaId)}`;
        
        console.log('Carregando serviços de:', url);
        
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log('Serviços carregados:', data);
        
        const servicosArray = Array.isArray(data) ? data : (Array.isArray(data.servicos) ? data.servicos : []);
        setServicos(servicosArray);
        setParentServicos(servicosArray);
        
        if (servicosArray.length === 0) {
          setErro('Nenhum serviço disponível. Contacte o administrador.');
        }
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : String(err);
        console.error('Erro ao carregar serviços:', mensagem);
        setErro(`Erro ao carregar serviços. ${mensagem}`);
        setServicos([]);
      } finally {
        setCarregando(false);
      }
    };

    fetchServicos();
  }, [setParentServicos]);

  if (carregando) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center opacity-60">
            <div className="w-20 h-20 bg-gray-200 rounded-full mb-6 animate-pulse"></div>
            <div className="w-32 h-6 bg-gray-200 rounded mb-3 animate-pulse"></div>
            <div className="w-24 h-4 bg-gray-200 rounded mb-8 animate-pulse"></div>
            <div className="w-full h-10 bg-gray-200 rounded animate-pulse"></div>
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-2xl w-full bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <svg className="w-12 h-12 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-red-800 mb-3">Erro ao Carregar Serviços</h3>
        <p className="text-red-600 mb-6">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-lg transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (servicos.length === 0) {
    return (
      <div className="max-w-2xl w-full bg-orange-50 border border-orange-200 rounded-2xl p-8 text-center">
        <div className="flex justify-center mb-4">
          <svg className="w-12 h-12 text-orange-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-orange-800 mb-3">Nenhum Serviço Disponível</h3>
        <p className="text-orange-600">Contacte o administrador para ativar serviços.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
      {servicos.map((servico) => (
        <div
          key={servico.id}
          className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center transition-transform hover:scale-105"
        >
          <div className="w-20 h-20 bg-green-50 text-green-700 rounded-full flex items-center justify-center mb-6 text-3xl shadow-sm">
            <span className="text-green-700 text-lg font-bold">{servico.nome.charAt(0).toUpperCase()}</span>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-3">{servico.nome}</h3>
          <p className="text-gray-500 mb-8 flex-1">Tempo médio: ~{servico.tempo_medio_atendimento} min</p>
          <button
            onClick={() => onSelecionarServico(servico)}
            className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
          >
            Selecionar
          </button>
        </div>
      ))}
    </div>
  );
}