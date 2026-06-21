export const ESTADOS_FORMACAO: Record<string, string> = {
  inscrito: 'Inscrito',
  em_formacao: 'Em Formação',
  teorico_concluido: 'Teórico Concluído',
  pratico_concluido: 'Prático Concluído',
  aprovado: 'Aprovado',
  reprovado: 'Reprovado',
  suspenso: 'Suspenso',
};

const CATEGORIAS = ['A', 'B', 'C', 'D', 'BE', 'CE', 'DE'];

interface AlunosFiltersProps {
  search: string;
  categoria: string;
  estado: string;
  onSearchChange: (v: string) => void;
  onCategoriaChange: (v: string) => void;
  onEstadoChange: (v: string) => void;
  onClear: () => void;
}

export default function AlunosFilters({
  search,
  categoria,
  estado,
  onSearchChange,
  onCategoriaChange,
  onEstadoChange,
  onClear,
}: AlunosFiltersProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          placeholder="Buscar por nome, email, nº estudante..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand/50"
        />
        <select value={categoria} onChange={(e) => onCategoriaChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Todas Categorias</option>
          {CATEGORIAS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={estado} onChange={(e) => onEstadoChange(e.target.value)}
          className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-brand/50">
          <option value="">Todos Estados</option>
          {Object.entries(ESTADOS_FORMACAO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button
          onClick={onClear}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-colors"
        >
          Limpar Filtros
        </button>
      </div>
    </div>
  );
}
