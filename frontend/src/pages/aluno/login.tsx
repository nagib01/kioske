import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useStudentAuth } from '../../contexts/StudentAuthContext';
import { useToast } from '../../components/Toast';

export default function StudentLoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useStudentAuth();
  const { addToast } = useToast();

  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push('/aluno/conta');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);
    if (!email || !senha) { setErro('Preencha email e senha'); return; }
    setCarregando(true);
    try {
      await login(email, senha);
      router.push('/aluno/conta');
    } catch (err: any) {
      const msg = err.message || 'Credenciais inválidas';
      setErro(msg);
      addToast(msg, 'error');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
      <Head>
        <title>Login Aluno | Kioske Digital</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="bg-white px-6 py-4 shadow-sm flex items-center justify-between">
        <h1 className="text-lg font-bold text-[#047857] uppercase tracking-wide">Kioske Digital Universal</h1>
        <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
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
            <form onSubmit={handleLoginEmail} className="p-6 space-y-5">
              {erro && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3" role="alert">
                  <span className="text-red-500 font-bold mt-0.5">!</span>
                  <p className="text-red-700 text-sm">{erro}</p>
                </div>
              )}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="seu@email.com" autoComplete="email" inputMode="email"
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors" />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-1.5">Senha</label>
                <input type="password" value={senha} onChange={e => setSenha(e.target.value)}
                  placeholder="A sua senha" autoComplete="current-password"
                  className="w-full border-2 border-gray-200 rounded-xl p-4 text-lg focus:outline-none focus:border-[#047857] focus:ring-2 focus:ring-[#047857]/20 transition-colors" />
              </div>
              <button type="submit" disabled={carregando}
                className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-4 px-6 rounded-xl text-lg transition-colors disabled:opacity-50 shadow-lg flex items-center justify-center gap-2">
                {carregando ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> A entrar...</> : 'Entrar'}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
