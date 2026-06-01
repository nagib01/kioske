import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { useToast } from '../../components/Toast';

type LoginMode = 'email' | 'nif' | 'qr' | 'quick';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login, loginNif, loginQr, quickKiosk, isAuthenticated, isLoading } = useStudentAuth();
  const { addToast } = useToast();

  const [mode, setMode] = useState<LoginMode>('email');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [numeroEstudante, setNumeroEstudante] = useState('');
  const [dataNascimento, setDataNascimento] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [quickNome, setQuickNome] = useState('');
  const [quickTelefone, setQuickTelefone] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (router.query.qr as string) {
      setMode('qr');
      setQrToken(router.query.qr as string);
    }
  }, [router.query]);

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/aluno/conta');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    setCarregando(true);
    try {
      if (mode === 'email') {
        if (!email || !senha) throw new Error('Preencha email e senha');
        await login(email, senha);
      } else if (mode === 'nif') {
        if (!numeroEstudante || !dataNascimento) throw new Error('Preencha nº de estudante e data de nascimento');
        await loginNif(numeroEstudante, dataNascimento);
      } else if (mode === 'qr') {
        if (!qrToken) throw new Error('QR token inválido');
        await loginQr(qrToken);
      } else if (mode === 'quick') {
        if (!quickNome) throw new Error('Insira o seu nome');
        await quickKiosk(quickNome, quickTelefone || undefined);
      }
      router.push('/aluno/conta');
    } catch (err: any) {
      const msg = err.message || 'Erro ao fazer login';
      setErro(msg);
      addToast(msg, 'error');
    } finally {
      setCarregando(false);
    }
  };

  const modes: { key: LoginMode; label: string; icon: string }[] = [
    { key: 'email', label: 'Email + Senha', icon: '✉' },
    { key: 'nif', label: 'Nº de Estudante', icon: '🎓' },
    { key: 'qr', label: 'QR Code', icon: '📱' },
    { key: 'quick', label: 'Acesso Rápido', icon: '⚡' },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Head>
        <title>Login Aluno | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        <button
          onClick={() => router.push('/')}
          className="text-sm text-gray-500 hover:text-gray-700 font-medium"
        >
          Início
        </button>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-[#047857] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-4">
              A
            </div>
            <h2 className="text-2xl font-extrabold text-gray-800">Área do Aluno</h2>
            <p className="text-gray-500 mt-1">Aceda à sua conta para acompanhar o seu progresso</p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="grid grid-cols-2 divide-x divide-gray-100">
              {modes.map(m => (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setErro(null); }}
                  className={`py-4 text-center text-sm font-bold transition-colors ${
                    mode === m.key
                      ? 'bg-[#047857] text-white'
                      : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="block text-lg mb-1">{m.icon}</span>
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleLogin} className="p-6 space-y-5">
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3" role="alert">
                  <span className="text-red-500 font-bold mt-0.5">!</span>
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}

              {mode === 'email' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="seu@email.com"
                      autoComplete="email"
                      inputMode="email"
                      enterKeyHint="next"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
                    <input
                      type="password"
                      value={senha}
                      onChange={e => setSenha(e.target.value)}
                      placeholder="A sua senha"
                      autoComplete="current-password"
                      enterKeyHint="done"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                </>
              )}

              {mode === 'nif' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Nº de Estudante</label>
                    <input
                      type="text"
                      value={numeroEstudante}
                      onChange={e => setNumeroEstudante(e.target.value)}
                      placeholder="Ex: 2024001"
                      inputMode="text"
                      enterKeyHint="next"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Data de Nascimento</label>
                    <input
                      type="date"
                      value={dataNascimento}
                      onChange={e => setDataNascimento(e.target.value)}
                      enterKeyHint="done"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                </>
              )}

              {mode === 'qr' && (
                <div className="text-center py-6">
                  <div className="w-48 h-48 bg-gray-100 rounded-xl mx-auto mb-4 flex items-center justify-center border-2 border-dashed border-gray-300">
                    <span className="text-6xl text-gray-400">📱</span>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    Aponte a câmara para o QR Code ou cole o token abaixo
                  </p>
                  <input
                    type="text"
                    value={qrToken}
                    onChange={e => setQrToken(e.target.value)}
                    placeholder="Token do QR Code"
                    enterKeyHint="done"
                    className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg text-center focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                  />
                </div>
              )}

              {mode === 'quick' && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">O seu Nome</label>
                    <input
                      type="text"
                      value={quickNome}
                      onChange={e => setQuickNome(e.target.value)}
                      placeholder="Como prefere ser chamado"
                      enterKeyHint="next"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Telefone (opcional)</label>
                    <input
                      type="tel"
                      value={quickTelefone}
                      onChange={e => setQuickTelefone(e.target.value)}
                      placeholder="Número de telemóvel"
                      inputMode="tel"
                      enterKeyHint="done"
                      className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-gray-400 text-center">
                    Acesso rápido sem registo. Os seus dados ficarão associados a esta sessão.
                  </p>
                </>
              )}

              <button
                type="submit"
                disabled={carregando}
                className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2"
              >
                {carregando ? (
                  <>
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    A entrar...
                  </>
                ) : (
                  'Entrar'
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <button
              onClick={() => router.push('/aluno')}
              className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            >
              Continuar sem sessão &rarr;
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
