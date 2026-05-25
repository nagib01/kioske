import Head from 'next/head';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-4 font-sans">
      <Head>
        <title>Kioske Digital Universal</title>
      </Head>

      <main className="text-center max-w-4xl w-full">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-500">
          Kioske Digital Universal
        </h1>
        <p className="text-lg md:text-xl mb-12 text-slate-400">
          Plataforma de gestão de filas e chamadas. Selecione o módulo para iniciar:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/servicos" className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all duration-300 group shadow-lg text-left">
            <div className="text-4xl mb-4">
              <svg className="w-10 h-10 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11V7a2 2 0 0 1 4 0v4" />
                <path d="M11 9h2a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-1" />
                <path d="M14 14V9a2 2 0 0 1 4 0v5" />
                <path d="M18 14h1a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-7" />
                <path d="M9 14v1" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-slate-200 group-hover:text-blue-400 transition-colors">Kioske de Triagem</h2>
            <p className="text-slate-400">Ecrã principal onde os clientes chegam e retiram a sua senha para os diferentes serviços.</p>
          </Link>
          
          <Link href="/chamadas" className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-slate-700 hover:border-indigo-500 hover:bg-slate-800 transition-all duration-300 group shadow-lg text-left">
            <div className="text-4xl mb-4">
              <svg className="w-10 h-10 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-slate-200 group-hover:text-indigo-400 transition-colors">Monitor (TV)</h2>
            <p className="text-slate-400">Ecrã público (para colocar numa televisão) que anuncia as senhas chamadas com aviso sonoro.</p>
          </Link>

          <Link href="/backoffice" className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-slate-700 hover:border-purple-500 hover:bg-slate-800 transition-all duration-300 group shadow-lg text-left">
            <div className="text-4xl mb-4">
              <svg className="w-10 h-10 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
                <rect x="2" y="15" width="20" height="2" rx="1" />
                <line x1="9" y1="10" x2="9.01" y2="10" />
                <line x1="15" y1="10" x2="15.01" y2="10" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-slate-200 group-hover:text-purple-400 transition-colors">Painel Receção</h2>
            <p className="text-slate-400">Backoffice para os funcionários gerirem a fila, chamarem a próxima senha e verem estatísticas.</p>
          </Link>

          <Link href="/aluno" className="bg-slate-800/50 backdrop-blur p-8 rounded-2xl border border-slate-700 hover:border-emerald-500 hover:bg-slate-800 transition-all duration-300 group shadow-lg text-left">
            <div className="text-4xl mb-4">
              <svg className="w-10 h-10 inline-block" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-2 text-slate-200 group-hover:text-emerald-400 transition-colors">Acompanhamento BYOD</h2>
            <p className="text-slate-400">Interface para o cliente (no seu próprio telemóvel) acompanhar o tempo de espera e a posição na fila.</p>
          </Link>
        </div>
      </main>
    </div>
  );
}