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
    router.push(`/aluno?servicoId=${id}`);
  };

  return (
    <div className="min-h-screen bg-surface flex flex-col font-sans">
      <Head>
        <title>Selecione o Serviço | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="bg-white px-4 sm:px-6 py-3 sm:py-4 shadow-sm flex items-center justify-between sticky top-0 z-10">
        <h1 className="text-sm sm:text-lg font-bold text-brand uppercase tracking-wide"><a href="https://www.stonemark.pt">Kioske Digital</a></h1>
        <button onClick={() => router.push('/')} className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-2 -mr-2">
          Início
        </button>
      </header>

      <main className="flex-1 px-4 sm:px-6 py-4 sm:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-800 mb-2">Selecione o Serviço</h2>
          <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
            Toque na opção desejada para iniciar o seu atendimento
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 max-w-5xl mx-auto w-full">
          {servicos.length > 0 ? (
            servicos.map((servico) => (
              <button
                key={servico.id}
                onClick={() => handleSelectServico(servico.id)}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-4 sm:flex-col sm:text-center text-left active:scale-[0.98] transition-transform hover:shadow-md"
              >
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-lg sm:text-2xl font-bold shrink-0">
                  {servico.nome.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">{servico.nome}</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    ~{servico.tempo_medio_atendimento} min
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 sm:hidden shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            ))
          ) : loading ? (
            <div className="col-span-full text-center py-8 text-gray-500">
              <div className="w-8 h-8 border-4 border-brand/30 border-t-brand rounded-full animate-spin mx-auto mb-3" />
              <p className="text-sm font-medium">A carregar serviços...</p>
            </div>
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500">
              <p className="text-base font-bold">Nenhum serviço disponível no momento.</p>
            </div>
          )}
        </div>
      </main>

      <footer className="bg-white px-4 sm:px-6 py-3 text-xs text-gray-400 border-t border-gray-100 text-center">
        Tenha os seus documentos em mãos
      </footer>
    </div>
  );
}