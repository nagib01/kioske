import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col font-sans">
      <Head>
        <title>Kioske Digital Universal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg sm:text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Kioske Digital Universal
        </h1>
      </header>

      <main className="flex-1 flex flex-col px-4 sm:px-6 pb-6">
        <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-8">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            Bem-vindo
          </h2>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Selecione uma opção para iniciar
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto w-full">
          <Link
            href="/servicos"
            className="bg-slate-800/50 backdrop-blur p-5 sm:p-6 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:text-center">
              <div className="text-3xl sm:text-4xl shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M7 11V7a2 2 0 0 1 4 0v4" />
                  <path d="M11 9h2a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-1" />
                  <path d="M14 14V9a2 2 0 0 1 4 0v5" />
                  <path d="M18 14h1a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-7" />
                  <path d="M9 14v1" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-slate-200 group-hover:text-blue-400 transition-colors">Kioske de Triagem</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">Retire a sua senha para os serviços disponíveis</p>
              </div>
            </div>
          </Link>

          <Link
            href="/chamadas"
            className="bg-slate-800/50 backdrop-blur p-5 sm:p-6 rounded-2xl border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all duration-300 group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:text-center">
              <div className="text-3xl sm:text-4xl shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">Monitor (TV)</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">Acompanhe as senhas chamadas ao vivo</p>
              </div>
            </div>
          </Link>

          <Link
            href="/aluno"
            className="bg-slate-800/50 backdrop-blur p-5 sm:p-6 rounded-2xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 transition-all duration-300 group active:scale-[0.98]"
          >
            <div className="flex items-center gap-3 sm:flex-col sm:text-center">
              <div className="text-3xl sm:text-4xl shrink-0">
                <svg className="w-8 h-8 sm:w-10 sm:h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" />
                </svg>
              </div>
              <div>
                <h3 className="text-base sm:text-xl font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">Acompanhamento</h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-0.5 sm:mt-1 line-clamp-2">Veja a sua posição na fila pelo telemóvel</p>
              </div>
            </div>
          </Link>
        </div>
      </main>

      <footer className="px-4 py-3 sm:px-6 sm:py-4 text-center text-xs text-slate-500 border-t border-slate-800">
        Kioske Digital Universal &mdash; Plataforma de gestão de filas
      </footer>
    </div>
  );
}