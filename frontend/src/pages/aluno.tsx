import Head from 'next/head';
import Link from 'next/link';
import TriageForm from '../components/TriageForm';
import KioskHeader from '../components/aluno/KioskHeader';
import ServicosGrid from '../components/aluno/ServicosGrid';
import TicketCard from '../components/aluno/TicketCard';
import { useKioskTriage } from '../hooks/useKioskTriage';

export default function AlunoPage() {
  const {
    fase,
    servicoSelecionado,
    perguntas,
    carregandoTriagem,
    ticketData,
    isConnected,
    loggedStudentId,
    setServicos,
    handleSelecionarServico,
    handleSubmitTriagem,
    handleReimprimir,
    handleCancelar,
    voltarParaServico,
  } = useKioskTriage();

  const entrarLink = (
    <Link
      href="/aluno/login"
      className="text-xs text-brand font-bold border-2 border-brand/30 hover:border-brand rounded-xl px-3 py-1.5 transition-colors"
    >
      Entrar
    </Link>
  );

  if (fase === 'servico') {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <Head>
          <title>Selecione o Serviço | Kioske Digital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <KioskHeader>{entrarLink}</KioskHeader>

        <main className="flex-1 px-4 py-4">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-extrabold text-gray-800 mb-1">Selecione o Serviço</h2>
            <p className="text-sm text-gray-500 max-w-xs mx-auto">
              Toque na opção desejada para iniciar
            </p>
          </div>

          <ServicosGrid onSelecionarServico={handleSelecionarServico} setServicos={setServicos} />
        </main>
      </div>
    );
  }

  if (fase === 'triagem' && servicoSelecionado) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <Head>
          <title>Triagem | Kioske Digital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <KioskHeader>{entrarLink}</KioskHeader>

        <main className="flex-1 px-4 py-4">
          <div className="bg-white rounded-2xl shadow-sm w-full max-w-lg mx-auto p-5 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 mb-1">{servicoSelecionado.nome}</h2>
            <p className="text-sm text-gray-500 mb-5">Responda às perguntas para continuar:</p>

            <TriageForm perguntas={perguntas} onSubmit={handleSubmitTriagem} loading={carregandoTriagem} />

            <button
              onClick={voltarParaServico}
              className="mt-4 w-full text-center text-sm text-gray-500 hover:text-gray-700 font-medium py-2"
            >
              voltar
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (fase === 'senha' && ticketData) {
    return (
      <div className="min-h-screen bg-surface flex flex-col font-sans">
        <Head>
          <title>Sua Senha | Kioske Digital</title>
          <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        </Head>

        <KioskHeader>
          <div className="flex items-center gap-2">
            {loggedStudentId ? (
              <Link href="/aluno/conta" className="text-xs text-brand font-bold hover:underline px-2 py-1">
                Minha Conta
              </Link>
            ) : (
              <Link href="/aluno/login" className="text-xs text-brand font-bold border border-brand rounded-lg px-3 py-1.5 hover:bg-brand hover:text-white transition-colors">
                Entrar
              </Link>
            )}
          </div>
        </KioskHeader>

        <main className="flex-1 px-4 py-6">
          <div className="text-center mb-5">
            <h2 className="text-2xl font-extrabold text-gray-800">Sua Senha Digital</h2>
          </div>

          <TicketCard
            ticketData={ticketData}
            isConnected={isConnected}
            onReimprimir={handleReimprimir}
            onCancelar={handleCancelar}
          />
        </main>
      </div>
    );
  }

  return null;
}
