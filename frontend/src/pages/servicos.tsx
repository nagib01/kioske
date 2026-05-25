import { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

interface Servico {
  id: string;
  nome: string;
  tempo_medio_atendimento: number;
  prefixo?: string;
}

export default function ServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Buscar serviços da API
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/servicos`)
      .then((res) => res.json())
      .then((data) => {
        setServicos(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Erro ao buscar serviços', err);
        setLoading(false);
      });
  }, []);

  const handleSelectServico = (id: string) => {
    // Redireciona para aluno com o id do serviço pre-selecionado
    router.push(`/aluno?servicoId=${id}`);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Head>
        <title>Selecione o Serviço | Kioske Digital</title>
      </Head>

      {/* Header */}
      <header className="bg-white px-8 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-xl font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
      </header>

      {/* Conteúdo Principal */}
      <main className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-800 mb-4">Selecione o Serviço</h2>
          <p className="text-gray-500 max-w-xl mx-auto text-lg">
            Toque na opção desejada para iniciar o seu atendimento. O terminal irá gerar a sua senha em seguida.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full">
          {servicos.length > 0 ? (
            servicos.map((servico) => (
              <div
                key={servico.id}
                className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 flex flex-col items-center text-center transition-transform hover:scale-105"
              >
                <div className="w-20 h-20 bg-green-50 text-green-700 rounded-full flex items-center justify-center mb-6 text-3xl shadow-sm">
                  {/* Ícone dinâmico baseado no nome */}
                  <span className="text-green-700 text-lg font-bold">{servico.nome.charAt(0).toUpperCase()}</span>
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">{servico.nome}</h3>
                <p className="text-gray-500 mb-8 flex-1">
                  Tempo médio: ~{servico.tempo_medio_atendimento} min
                </p>
                <button
                  onClick={() => handleSelectServico(servico.id)}
                  className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md"
                >
                  Selecionar
                </button>
              </div>
            ))
          ) : (
            // Fallback (Loading) ou simulação se a DB falhar
            loading ? (
              <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-500">
                <p className="text-xl font-bold">A carregar serviços...</p>
              </div>
            ) : (
              <div className="col-span-1 md:col-span-3 text-center py-12 text-gray-500">
                <p className="text-xl font-bold">Nenhum serviço disponível no momento.</p>
              </div>
            )
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white p-4 flex justify-between items-center text-sm text-gray-400 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span>Espera média geral: {servicos.length > 0 ? `~${Math.round(servicos.reduce((acc, s) => acc + (s.tempo_medio_atendimento || 0), 0) / servicos.length)} min` : ''}</span>
        </div>
        <div>Tenha os seus documentos em mãos</div>
      </footer>
    </div>
  );
}