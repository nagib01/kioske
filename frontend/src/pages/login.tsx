import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect if already logged in
    const token = localStorage.getItem('backoffice_token');
    if (token) {
      router.push('/backoffice');
    }
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

        router.push('/backoffice');
      } else {
        alert('Credenciais inválidas');
      }
    } catch (e) {
      alert('Erro de conexão com o servidor');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <Head>
        <title>Login | Kioske Digital</title>
      </Head>
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-gray-100">
        <h2 className="text-2xl font-bold mb-2 text-[#047857] text-center">Acesso ao Sistema</h2>
        <p className="text-gray-500 text-center mb-8 text-sm">Insira os seus dados de acesso</p>
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
