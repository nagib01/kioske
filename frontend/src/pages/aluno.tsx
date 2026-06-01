import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useRealtimeQueue } from '../hooks/useRealtimeQueue';
import TriageForm, { PerguntaTriagem, RespostaTriagem } from '../components/TriageForm';
import Link from 'next/link';

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
  const [loggedStudentId, setLoggedStudentId] = useState<string | null>(null);

  const router = useRouter();
  const { queueData, isConnected } = useRealtimeQueue(token);

  useEffect(() => {
    const savedEscolaId = localStorage.getItem('kioske_escolaId');
    const savedToken = localStorage.getItem('kioske_token');
    const savedStudent = localStorage.getItem('kioske_student');

    if (savedEscolaId) {
      setEscolaId(savedEscolaId);
    } else {
      const defaultEscolaId = '1';
      setEscolaId(defaultEscolaId);
      localStorage.setItem('kioske_escolaId', defaultEscolaId);
    }

    if (savedStudent) {
      try {
        const parsed = JSON.parse(savedStudent);
        if (parsed.id) setLoggedStudentId(parsed.id);
      } catch {}
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
          studentId: loggedStudentId,
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
          <title>Selecione o Serviço | Kioske Digital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-sm font-bold text-[#047857] uppercase tracking-wide">Kioske Digital</h1>
          <Link
            href="/aluno/login"
            className="text-xs text-[#047857] font-bold border-2 border-[#047857]/30 hover:border-[#047857] rounded-xl px-3 py-1.5 transition-colors"
          >
            Entrar
          </Link>
        </header>

        <main className="flex-1 px-4 py-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Selecione o Serviço</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Toque na opção desejada para iniciar
            </p>
          </div>

          <ServicosGrid onSelecionarServico={handleSelecionarServico} setServicos={setServicos} />
        </main>
      </div>
    );
  }

  if (fase === 'triagem' && servicoSelecionado) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Head>
          <title>Triagem | Kioske Digital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-sm font-bold text-[#047857] uppercase tracking-wide">Kioske Digital</h1>
          <Link href="/aluno/login" className="text-xs text-[#047857] font-bold border-2 border-[#047857]/30 hover:border-[#047857] rounded-xl px-3 py-1.5 transition-colors">
            Entrar
          </Link>
        </header>

        <main className="flex-1 px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg mx-auto p-5 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{servicoSelecionado.nome}</h2>
            <p className="text-sm text-gray-500 mb-5">Responda às perguntas para continuar:</p>

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
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              voltar
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
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-sm font-bold text-[#047857] uppercase tracking-wide">Kioske Digital</h1>
          <div className="flex items-center gap-2">
            {loggedStudentId ? (
              <Link href="/aluno/conta" className="text-xs text-[#047857] font-bold hover:underline px-2 py-1">
                Minha Conta
              </Link>
            ) : (
              <Link href="/aluno/login" className="text-xs text-[#047857] font-bold border border-[#047857] rounded-lg px-3 py-1.5 hover:bg-[#047857] hover:text-white transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 px-4 py-6">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-extrabold text-gray-800">Sua Senha Digital</h2>
          </div>

          <div className="bg-white rounded-2xl shadow-sm w-full max-w-sm mx-auto overflow-hidden border border-gray-100">
            <div className={`py-2 px-4 flex justify-between items-center text-white text-xs font-bold tracking-wider ${ticketData.estado === 'called' ? 'bg-red-600' : 'bg-[#047857]'}`}>
              <span>ESTADO: {ticketData.estado === 'called' ? 'CHAMADA' : 'EM ESPERA'}</span>
              <span className="flex items-center gap-1.5">
                {isConnected && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                LIVE
              </span>
            </div>

            <div className="p-5 flex flex-col items-center">
              <div className="w-full border-2 border-dashed border-green-200 rounded-xl p-5 mb-5 text-center bg-green-50/30">
                <span className="text-[10px] font-bold text-green-700 uppercase tracking-widest block mb-1">Senha Atual</span>
                <span className={`text-4xl font-black ${ticketData.estado === 'called' ? 'text-red-600' : 'text-[#047857]'}`}>
                  {ticketData.token || ticketData.codigo_senha}
                </span>
              </div>

              <div className="flex gap-3 w-full mb-5">
                <div className="flex-1 bg-blue-50/50 p-3 rounded-xl text-center border border-blue-100">
                  <span className="text-[10px] text-gray-500 font-bold mb-0.5 block">SUA VEZ EM:</span>
                  <span className="text-xl font-bold text-gray-800">{ticketData.tempo_estimado_min} min</span>
                </div>
                <div className="flex-1 bg-blue-50/50 p-3 rounded-xl text-center border border-blue-100">
                  <span className="text-[10px] text-gray-500 font-bold mb-0.5 block">PESSOAS A FRENTE:</span>
                  <span className="text-xl font-bold text-gray-800">{ticketData.posicao_fila}</span>
                </div>
              </div>

              {ticketData.alertas && ticketData.alertas.length > 0 && (
                <div className="w-full bg-orange-50 border border-orange-100 p-3 rounded-xl flex items-start gap-2 mb-4">
                  <span className="text-orange-500 font-bold shrink-0">!</span>
                  <div>
                    <p className="font-bold text-orange-800 text-xs mb-0.5">Alertas:</p>
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
                <div className="w-full mb-4 flex flex-col items-center">
                  <h4 className="font-bold text-gray-800 text-xs mb-2">Acompanhe no Telemóvel</h4>
                  <img src={ticketData.qrCode} alt="QR Code da senha" className="w-32 h-32" />
                  <p className="text-[10px] text-gray-500 mt-1 text-center">
                    Aponte a câmara para o QR Code
                  </p>
                </div>
              )}
            </div>

            <div className="bg-gray-50 p-3 flex gap-3 border-t border-gray-100">
              <button
                onClick={handleReimprimir}
                className="flex-1 py-3 font-bold text-[#047857] hover:bg-green-50 rounded-lg text-sm transition-colors"
              >
                Reimprimir
              </button>
              <button onClick={handleCancelar} className="flex-1 py-3 font-bold text-red-600 hover:bg-red-50 rounded-lg text-sm transition-colors">
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

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

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
      <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto w-full">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-md mx-auto w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">Erro ao Carregar Serviços</h3>
        <p className="text-sm text-red-600 mb-4">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (servicos.length === 0) {
    return (
      <div className="max-w-md mx-auto w-full bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-orange-800 mb-1">Nenhum Serviço Disponível</h3>
        <p className="text-sm text-orange-600">Contacte o administrador para ativar serviços.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto w-full">
      {servicos.map((servico) => (
        <button
          key={servico.id}
          onClick={() => onSelecionarServico(servico)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform hover:shadow-md"
        >
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
            {servico.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 truncate">{servico.nome}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tempo médio: ~{servico.tempo_medio_atendimento} min</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ))}
    </div>
  );
}