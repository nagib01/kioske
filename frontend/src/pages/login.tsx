import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useToast } from '../components/Toast';
import { getBackofficeToken } from '../lib/auth';

export default function Login() {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  // Already logged in? Skip the login screen and go to the right home.
  useEffect(() => {
    const token = getBackofficeToken();
    if (!token) return;
    let role: string | undefined;
    try {
      role = JSON.parse(atob(token.split('.')[1])).role;
    } catch {}
    router.replace(role === 'instructor' ? '/instrutor/dashboard' : '/');
  }, [router]);

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

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <Head>
        <title>Login | Kioske Digital</title>
      </Head>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-2 text-brand text-center">Acesso ao Sistema</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Insira os seus dados de acesso</p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
            required
          />
          <input
            type="password"
            placeholder="Senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            className="w-full border border-gray-200 rounded-lg p-3 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand/50 transition-shadow"
            required
          />
          <button type="submit" className="w-full bg-brand hover:bg-brand-dark text-white font-bold py-3 rounded-lg shadow-md transition-colors mt-2">
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
