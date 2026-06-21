import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getBackofficeToken, getBackofficeEscola } from '../../lib/auth';
import { apiUrl } from '../../lib/api';
import BackofficeLayout from '../../components/BackofficeLayout';
import Spinner from '../../components/ui/Spinner';

interface AuditEntry {
  id: string;
  acao: string;
  utilizador_id: string | null;
  utilizador_nome: string | null;
  ticket_id: string | null;
  detalhes: Record<string, unknown> | null;
  created_at: string;
}

const verbMap: Record<string, string> = {
  POST: 'Criar', PUT: 'Editar', DELETE: 'Excluir', PATCH: 'Alterar',
};

function acaoLabel(acao: string): string {
  if (!acao.includes(':')) return acao;
  const [method, ...pathParts] = acao.split(':');
  const path = pathParts.join(':');
  const verb = verbMap[method] || method;
  const segments = path.split('/').filter(Boolean);
  const resource = segments.filter(s => !s.startsWith(':')).pop() || segments.pop() || '';
  const name = resource.replace(/[_-]/g, ' ');
  return name ? `${verb} ${name.charAt(0).toUpperCase() + name.slice(1)}` : acao;
}

export default function AdminAuditLogsPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterAcao, setFilterAcao] = useState('');
  const limit = 30;

  useEffect(() => {
    const token = getBackofficeToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const fetchLogs = async () => {
      setLoading(true);
      try {
        const escolaId = getBackofficeEscola();
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (filterAcao) params.set('acao', filterAcao);
        if (escolaId) params.set('escolaId', escolaId);

        const res = await fetch(apiUrl(`/admin/audit-logs?${params}`), {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (res.status === 403) {
          router.push('/');
          return;
        }

        if (res.ok) {
          const data = await res.json();
          setLogs(data.logs);
          setTotalPages(data.pagination.totalPages);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [page, filterAcao, router]);

  const acoes = [...new Set(logs.map(l => l.acao))];

  return (
    <BackofficeLayout activeRoute="/audit_logs" title="Auditoria | Kioske Digital">

      <div className="p-6">
        <h1 className="text-xl font-bold text-gray-900 mb-4">Registo de Auditoria</h1>

        <div className="flex items-center gap-2 mb-4 overflow-x-auto">
          <button
            onClick={() => { setFilterAcao(''); setPage(1); }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
              !filterAcao ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            Todas
          </button>
          {acoes.map((acao) => (
            <button
              key={acao}
              onClick={() => { setFilterAcao(acao); setPage(1); }}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap ${
                filterAcao === acao ? 'bg-brand text-white border-brand' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {acaoLabel(acao)}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 text-sm">Nenhum registo de auditoria encontrado.</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Data</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Ação</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Utilizador</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Ticket</th>
                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Detalhes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('pt-PT')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded">
                          {acaoLabel(log.acao)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{log.utilizador_nome || '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{log.ticket_id || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs max-w-[200px] truncate">
                        {log.detalhes ? JSON.stringify(log.detalhes) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-4">
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-500">Página {page} de {totalPages}</span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                >
                  Seguinte
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </BackofficeLayout>
  );
}
