import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';

function getCurrentSession(): { nome: string; role: string } | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('backoffice_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return { nome: payload.nome || 'Utilizador', role: payload.role };
  } catch {
    return null;
  }
}

export default function Login() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();
  const [session] = useState(getCurrentSession);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });

      if (res.ok) {
        const data = await res.json();
        // Save logged in user data to local storage
        localStorage.setItem('backoffice_token', data.token);
        if (data.escola_id) localStorage.setItem('backoffice_escola', data.escola_id);
        if (data.nome) localStorage.setItem('backoffice_nome', data.nome);
        if (data.avatar_url) localStorage.setItem('backoffice_avatar', data.avatar_url);
        if (data.role) localStorage.setItem('backoffice_role', data.role);

        if (data.role === 'instructor') {
          router.push('/instrutor/dashboard');
        } else {
          router.push('/');
        }
      } else {
        addToast('Credenciais inválidas', 'error');
      }
    } catch (e) {
      addToast('Erro de conexão com o servidor', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('backoffice_token');
    localStorage.removeItem('backoffice_nome');
    localStorage.removeItem('backoffice_escola');
    localStorage.removeItem('backoffice_avatar');
    localStorage.removeItem('backoffice_mesa');
    localStorage.removeItem('backoffice_role');
    setEmail('');
    setSenha('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Head>
        <title>Login | Kioske Digital</title>
      </Head>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-2 text-[#047857] text-center">Acesso ao Sistema</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Insira os seus dados de acesso</p>

        {session && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-sm text-blue-800 font-medium">Sessão atual: <strong>{session.nome}</strong></p>
            <p className="text-xs text-blue-600 mb-2">Role: {session.role}</p>
            <button onClick={handleLogout} className="text-xs text-red-600 hover:text-red-800 font-bold underline">
              Terminar sessão e trocar de conta
            </button>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#047857]/50 transition-shadow"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#047857]/50 transition-shadow"
            required
          />
          <button type="submit" className="w-full bg-[#047857] hover:bg-[#065f46] text-white font-bold py-3 rounded-lg shadow-md transition-colors mt-2">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
