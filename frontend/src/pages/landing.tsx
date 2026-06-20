import Head from 'next/head';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white font-sans flex flex-col">
      <Head>
        <title>Stonemark | Escola de Condução</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="description" content="Stonemark — A sua escola de condução de referência. Formação de qualidade para condutores do futuro." />
      </Head>

      <header className="px-6 py-5 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">S</div>
          <span className="text-lg font-bold tracking-tight">Stonemark</span>
        </div>
        <nav className="flex items-center gap-4 text-sm text-slate-300">
          <a href="#sobre" className="hover:text-white transition-colors">Sobre</a>
          <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
          <a href="#contacto" className="hover:text-white transition-colors">Contacto</a>
        </nav>
      </header>

      <main className="flex-1">
        <section className="px-6 py-20 text-center">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 via-white to-indigo-300 bg-clip-text text-transparent">
            Conduzir o Futuro
          </h1>
          <p className="text-slate-400 text-lg max-w-xl mx-auto mb-8">
            Há mais de 15 anos a formar condutores responsáveis e preparados para o futuro. A Stonemark é a sua escola de condução de confiança.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://kioske.stonemark.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 11V7a2 2 0 0 1 4 0v4" />
                <path d="M11 9h2a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-1" />
                <path d="M14 14V9a2 2 0 0 1 4 0v5" />
                <path d="M18 14h1a2 2 0 0 1 2 2v2a3 3 0 0 1-3 3h-7" />
                <path d="M9 14v1" />
              </svg>
              Kioske Digital
            </a>
            <a
              href="https://aluno.stonemark.pt"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-6 rounded-xl transition-all hover:scale-105"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="5" y="2" width="14" height="20" rx="2" />
                <line x1="12" y1="18" x2="12.01" y2="18" />
              </svg>
              Área do Aluno
            </a>
          </div>
        </section>

        <section id="sobre" className="px-6 py-16 bg-white/5 backdrop-blur">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Porquê a Stonemark?</h2>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                { titulo: 'Formadores Experientes', desc: 'Instrutores certificados com anos de experiência no ensino da condução.', icone: 'S' },
                { titulo: 'Viaturas Modernas', desc: 'Frota renovada com viaturas equipadas com os mais recentes sistemas de segurança.', icone: 'V' },
                { titulo: 'Taxas de Aprovação', desc: 'Mais de 90% dos nossos alunos passam à primeira tentativa.', icone: 'T' },
              ].map((item) => (
                <div key={item.titulo} className="bg-white/10 rounded-2xl p-6 text-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-lg font-bold mx-auto mb-4">{item.icone}</div>
                  <h3 className="font-bold text-lg mb-2">{item.titulo}</h3>
                  <p className="text-slate-400 text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="servicos" className="px-6 py-16">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center">Os Nossos Serviços</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                'Carta de Condução (Ligeiros)',
                'Carta de Condução (Pesados)',
                'Formação Avançada',
                'Simulador de Condução',
                'Aulas Teóricas Online',
                'Renovação de Carta',
              ].map((s) => (
                <div key={s} className="bg-white/5 rounded-xl px-5 py-4 flex items-center gap-3 border border-white/10">
                  <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  <span className="text-sm sm:text-base">{s}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="contacto" className="px-6 py-16 bg-white/5 backdrop-blur">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Contacte-nos</h2>
            <p className="text-slate-400 mb-6">Estamos aqui para ajudar. Visite-nos ou ligue-nos.</p>
            <div className="flex flex-col sm:flex-row justify-center gap-6 text-sm text-slate-300">
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                Rua Principal, nº 100, Lisboa
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
                +351 210 000 000
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>
                geral@stonemark.pt
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="px-6 py-4 border-t border-white/10 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} Stonemark &mdash; Escola de Condução. Todos os direitos reservados.
      </footer>
    </div>
  );
}
