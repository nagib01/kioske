import { useEffect, useState } from 'react';
import { apiUrl } from '../../lib/api';
import type { Servico } from '../../hooks/useKioskTriage';

interface ServicosGridProps {
  onSelecionarServico: (s: Servico) => void;
  setServicos: (s: Servico[]) => void;
}

export default function ServicosGrid({ onSelecionarServico, setServicos: setParentServicos }: ServicosGridProps) {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const fetchServicos = async () => {
      setCarregando(true);
      setErro(null);
      try {
        const savedEscolaId = localStorage.getItem('kioske_escolaId') || '1';
        const url = apiUrl(`/api/servicos?escolaId=${encodeURIComponent(savedEscolaId)}`);

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();

        const servicosArray = Array.isArray(data) ? data : Array.isArray(data.servicos) ? data.servicos : [];
        setServicos(servicosArray);
        setParentServicos(servicosArray);

        if (servicosArray.length === 0) {
          setErro('Nenhum serviço disponível. Contacte o administrador.');
        }
      } catch (err) {
        const mensagem = err instanceof Error ? err.message : String(err);
        console.error('Erro ao carregar serviços:', mensagem);
        setErro(`Erro ao carregar serviços. ${mensagem}`);
        setServicos([]);
      } finally {
        setCarregando(false);
      }
    };

    fetchServicos();
  }, [setParentServicos]);

  if (carregando) {
    return (
      <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto w-full">
        {[1, 2].map((i) => (
          <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 opacity-60">
            <div className="w-12 h-12 bg-gray-200 rounded-full animate-pulse shrink-0"></div>
            <div className="flex-1 space-y-2">
              <div className="w-32 h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="w-20 h-3 bg-gray-200 rounded animate-pulse"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (erro) {
    return (
      <div className="max-w-md mx-auto w-full bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-red-800 mb-2">Erro ao Carregar Serviços</h3>
        <p className="text-sm text-red-600 mb-4">{erro}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg text-sm transition-colors"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (servicos.length === 0) {
    return (
      <div className="max-w-md mx-auto w-full bg-orange-50 border border-orange-200 rounded-2xl p-6 text-center">
        <h3 className="text-lg font-bold text-orange-800 mb-1">Nenhum Serviço Disponível</h3>
        <p className="text-sm text-orange-600">Contacte o administrador para ativar serviços.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 max-w-lg mx-auto w-full">
      {servicos.map((servico) => (
        <button
          key={servico.id}
          onClick={() => onSelecionarServico(servico)}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4 text-left active:scale-[0.98] transition-transform hover:shadow-md"
        >
          <div className="w-12 h-12 bg-green-50 text-green-700 rounded-full flex items-center justify-center text-lg font-bold shrink-0">
            {servico.nome.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-bold text-gray-800 truncate">{servico.nome}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Tempo médio: ~{servico.tempo_medio_atendimento} min</p>
          </div>
          <svg className="w-5 h-5 text-gray-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      ))}
    </div>
  );
}
