import { useMemo, useState } from 'react';

type OpcaoTriagem = {
  id: string;
  label: string;
  value: string;
};

export type PerguntaTriagem = {
  id: string;
  texto: string;
  tipo: 'yes_no' | 'single_choice';
  obrigatoria: boolean;
  opcoes: OpcaoTriagem[];
};

export type RespostaTriagem = {
  perguntaId: string;
  resposta: string | boolean;
  respostaLabel?: string;
};

interface Props {
  perguntas: PerguntaTriagem[];
  onSubmit: (respostas: RespostaTriagem[]) => void;
  loading: boolean;
}

export default function TriageForm({ perguntas, onSubmit, loading }: Props) {
  const [passoAtual, setPassoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, RespostaTriagem>>({});
  const perguntaAtual = perguntas[passoAtual];

  const respostasArray = useMemo(() => Object.values(respostas), [respostas]);

  const setRespostaAtual = (resposta: string | boolean, respostaLabel?: string) => {
    if (!perguntaAtual) return;
    setRespostas((prev) => ({
      ...prev,
      [perguntaAtual.id]: {
        perguntaId: perguntaAtual.id,
        resposta,
        respostaLabel
      }
    }));
  };

  const respostaSelecionada = perguntaAtual ? respostas[perguntaAtual.id] : undefined;
  const podeAvancar = !!respostaSelecionada || !perguntaAtual?.obrigatoria;

  const avancar = () => {
    if (!perguntaAtual) return;
    if (!podeAvancar) return;
    if (passoAtual < perguntas.length - 1) {
      setPassoAtual((prev) => prev + 1);
      return;
    }
    onSubmit(respostasArray);
  };

  const voltar = () => {
    if (passoAtual > 0) setPassoAtual((prev) => prev - 1);
  };

  if (!perguntas.length) {
    return <p className="text-sm text-gray-500">Sem perguntas para este servico. Pode avancar para a fila.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between text-xs text-gray-500 font-bold uppercase tracking-wider">
        <span>Pergunta {passoAtual + 1} de {perguntas.length}</span>
        <span>{Math.round(((passoAtual + 1) / perguntas.length) * 100)}%</span>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div className="bg-brand h-2 rounded-full transition-all duration-300" style={{ width: `${((passoAtual + 1) / perguntas.length) * 100}%` }} />
      </div>

      <div className="bg-gray-50 border border-gray-100 p-5 rounded-xl">
        <p className="font-semibold text-gray-800 mb-4">{perguntaAtual?.texto}</p>

        {perguntaAtual?.tipo === 'yes_no' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setRespostaAtual(true, 'Sim')}
              className={`rounded-lg px-4 py-3 font-bold border transition-colors ${respostaSelecionada?.resposta === true ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:border-brand'}`}
            >
              Sim
            </button>
            <button
              type="button"
              onClick={() => setRespostaAtual(false, 'Nao')}
              className={`rounded-lg px-4 py-3 font-bold border transition-colors ${respostaSelecionada?.resposta === false ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:border-brand'}`}
            >
              Nao
            </button>
          </div>
        )}

        {perguntaAtual?.tipo === 'single_choice' && (
          <div className="space-y-3">
            {perguntaAtual.opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => setRespostaAtual(opcao.value, opcao.label)}
                className={`w-full text-left rounded-lg px-4 py-3 font-medium border transition-colors ${respostaSelecionada?.resposta === opcao.value ? 'bg-brand text-white border-brand' : 'bg-white text-gray-700 border-gray-200 hover:border-brand'}`}
              >
                {opcao.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={voltar}
          disabled={passoAtual === 0 || loading}
          className="flex-1 py-3 rounded-lg border border-gray-200 text-gray-600 font-bold disabled:opacity-50 transition-colors hover:bg-gray-50"
        >
          Voltar
        </button>
        <button
          type="button"
          onClick={avancar}
          disabled={!podeAvancar || loading}
          className="flex-1 py-3 rounded-lg bg-brand text-white font-bold disabled:opacity-50 transition-colors hover:bg-brand-dark"
        >
          {loading ? 'A processar...' : passoAtual === perguntas.length - 1 ? 'Entrar na fila' : 'Proxima'}
        </button>
      </div>
    </div>
  );
}