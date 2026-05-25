import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Link from 'next/link';
import BackofficeLayout from '../../../../components/BackofficeLayout';

const ESTADOS_FORMACAO: Record<string, string> = {
  inscrito: 'Inscrito', em_formacao: 'Em Formação', teorico_concluido: 'Teórico Concluído',
  pratico_concluido: 'Prático Concluído', aprovado: 'Aprovado', reprovado: 'Reprovado', suspenso: 'Suspenso',
};

const estadoBadge = (estado: string) => {
  const colors: Record<string, string> = {
    inscrito: 'bg-blue-100 text-blue-800', em_formacao: 'bg-yellow-100 text-yellow-800',
    teorico_concluido: 'bg-purple-100 text-purple-800', pratico_concluido: 'bg-indigo-100 text-indigo-800',
    aprovado: 'bg-green-100 text-green-800', reprovado: 'bg-red-100 text-red-800', suspenso: 'bg-gray-100 text-gray-800',
  };
  return colors[estado] || 'bg-gray-100 text-gray-800';
};

type Tab = 'perfil' | 'tickets' | 'aulas' | 'contactos';

export default function AlunoProfilePage() {
  const router = useRouter();
  const { id } = router.query;
  const [student, setStudent] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('perfil');

  const getHeaders = () => {
    const token = localStorage.getItem('backoffice_token');
    const escolaId = localStorage.getItem('backoffice_escola');
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (escolaId) headers['x-escola-id'] = escolaId;
    return headers;
  };

  const fetchStudent = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}`, { headers: getHeaders() });
      if (res.ok) setStudent(await res.json());
    } catch {}
  }, [id]);

  const fetchTickets = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/tickets`, { headers: getHeaders() });
      if (res.ok) setTickets(await res.json());
    } catch {}
  }, [id]);

  const fetchLessons = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/lessons`, { headers: getHeaders() });
      if (res.ok) setLessons(await res.json());
    } catch {}
  }, [id]);

  const fetchContacts = useCallback(async () => {
    if (!id) return;
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/contacts`, { headers: getHeaders() });
      if (res.ok) setContacts(await res.json());
    } catch {}
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([fetchStudent(), fetchTickets(), fetchLessons(), fetchContacts()]).finally(() => setLoading(false));
  }, [id]);

  const [newContact, setNewContact] = useState({ nome: '', parentesco: '', telefone: '', email: '' });
  const [newLesson, setNewLesson] = useState({ tipo: 'pratica', data: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fim: '', instrutor: '', descricao: '', realizada: true });
  const [associateTicketId, setAssociateTicketId] = useState('');

  const addContact = async () => {
    if (!newContact.nome) return alert('Nome é obrigatório');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/contacts`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(newContact),
      });
      if (!res.ok) throw new Error('Falha ao adicionar contacto');
      setNewContact({ nome: '', parentesco: '', telefone: '', email: '' });
      await fetchContacts();
    } catch (err: any) { alert(err.message); }
  };

  const deleteContact = async (contactId: string) => {
    if (!window.confirm('Remover este contacto?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/contacts/${contactId}`, { method: 'DELETE', headers: getHeaders() });
      await fetchContacts();
    } catch {}
  };

  const addLesson = async () => {
    if (!newLesson.data) return alert('Data é obrigatória');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/lessons`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify(newLesson),
      });
      if (!res.ok) throw new Error('Falha ao adicionar aula');
      setNewLesson({ tipo: 'pratica', data: new Date().toISOString().split('T')[0], hora_inicio: '', hora_fim: '', instrutor: '', descricao: '', realizada: true });
      await fetchLessons();
    } catch (err: any) { alert(err.message); }
  };

  const deleteLesson = async (lessonId: string) => {
    if (!window.confirm('Remover esta aula?')) return;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/lessons/${lessonId}`, { method: 'DELETE', headers: getHeaders() });
      await fetchLessons();
    } catch {}
  };

  const associateTicket = async () => {
    if (!associateTicketId) return alert('ID do ticket é obrigatório');
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/students/${id}/tickets`, {
        method: 'POST', headers: getHeaders(), body: JSON.stringify({ ticketId: associateTicketId }),
      });
      if (!res.ok) throw new Error('Falha ao associar ticket');
      setAssociateTicketId('');
      await fetchTickets();
    } catch (err: any) { alert(err.message); }
  };

  if (loading) {
    return (
      <BackofficeLayout activeRoute="/admin/alunos" title="Aluno | Kioske Digital">
        <div className="p-8 text-center text-gray-500">Carregando...</div>
      </BackofficeLayout>
    );
  }

  if (!student) {
    return (
      <BackofficeLayout activeRoute="/admin/alunos" title="Aluno | Kioske Digital">
        <div className="p-8 text-center text-gray-500">Aluno não encontrado</div>
      </BackofficeLayout>
    );
  }

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: 'perfil', label: 'Perfil' },
    { key: 'tickets', label: 'Histórico de Senhas', count: tickets.length },
    { key: 'aulas', label: 'Aulas', count: lessons.length },
    { key: 'contactos', label: 'Contactos', count: contacts.length },
  ];

  return (
    <BackofficeLayout activeRoute="/admin/alunos" title={`${student.nome} | Kioske Digital`}>
      <div className="p-8 max-w-6xl mx-auto w-full">

        {/* Profile Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-[#047857] flex items-center justify-center text-white text-2xl font-bold">
                {student.nome.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{student.nome}</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-sm text-gray-500">#{student.numero_estudante}</span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${estadoBadge(student.estado_formacao)}`}>
                    {ESTADOS_FORMACAO[student.estado_formacao] || student.estado_formacao}
                  </span>
                  <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                    Categoria {student.categoria}
                  </span>
                  {!student.ativo && (
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800">
                      Inativo
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link href={`/admin/alunos/${id}/editar`}
              className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm">
              Editar
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-100">
            <div><p className="text-xs text-gray-500 font-medium">Email</p><p className="text-sm text-gray-800">{student.email || '-'}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Telefone</p><p className="text-sm text-gray-800">{student.telefone || '-'}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Data Nascimento</p><p className="text-sm text-gray-800">{student.data_nascimento ? new Date(student.data_nascimento).toLocaleDateString('pt-PT') : '-'}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Documento</p><p className="text-sm text-gray-800">{student.documento_identificacao || '-'}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Data Matrícula</p><p className="text-sm text-gray-800">{student.data_matricula ? new Date(student.data_matricula).toLocaleDateString('pt-PT') : '-'}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Total Tickets</p><p className="text-sm text-gray-800">{student.total_tickets || 0}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Tickets Concluídos</p><p className="text-sm text-gray-800">{student.tickets_concluidos || 0}</p></div>
            <div><p className="text-xs text-gray-500 font-medium">Aulas Realizadas</p><p className="text-sm text-gray-800">{student.aulas_realizadas || 0}</p></div>
          </div>

          {student.endereco && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Endereço</p>
              <p className="text-sm text-gray-800">{student.endereco}</p>
            </div>
          )}
          {student.observacoes && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-500 font-medium">Observações</p>
              <p className="text-sm text-gray-800">{student.observacoes}</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 text-sm font-bold border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#047857] text-[#047857]'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              {tab.label}
              {tab.count !== undefined && <span className="ml-2 text-xs bg-gray-100 px-2 py-0.5 rounded-full">{tab.count}</span>}
            </button>
          ))}
        </div>

        {/* Perfil Tab */}
        {activeTab === 'perfil' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-bold text-gray-700 mb-4">Resumo do Aluno</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{student.total_tickets || 0}</p>
                <p className="text-sm text-gray-600">Total Senhas</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-green-600">{student.tickets_concluidos || 0}</p>
                <p className="text-sm text-gray-600">Senhas Concluídas</p>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">{student.aulas_realizadas || 0}</p>
                <p className="text-sm text-gray-600">Aulas Realizadas</p>
              </div>
            </div>
          </div>
        )}

        {/* Tickets Tab */}
        {activeTab === 'tickets' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Associate ticket */}
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-3">
              <input type="text" placeholder="ID do ticket para associar..." value={associateTicketId}
                onChange={e => setAssociateTicketId(e.target.value)}
                className="flex-1 border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#047857]/50" />
              <button onClick={associateTicket}
                className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
                Associar
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Senha</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Serviço</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Mesa</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-6 text-gray-500 text-sm">Nenhum ticket associado</td></tr>
                  ) : tickets.map((t: any) => (
                    <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm font-mono font-bold text-gray-700">{t.codigo_senha}</td>
                      <td className="p-3 text-sm text-gray-600">{t.servico_nome}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${
                          t.status === 'finished' ? 'bg-green-100 text-green-800' :
                          t.status === 'called' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {t.status === 'finished' ? 'Concluído' : t.status === 'called' ? 'Em Atendimento' : 'Em Espera'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-600">{t.mesa_atendimento || '-'}</td>
                      <td className="p-3 text-sm text-gray-500">{new Date(t.created_at).toLocaleDateString('pt-PT')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Aulas Tab */}
        {activeTab === 'aulas' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Add lesson form */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="font-bold text-sm text-gray-700 mb-3">Registar Nova Aula</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <select value={newLesson.tipo} onChange={e => setNewLesson({...newLesson, tipo: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm">
                  <option value="pratica">Prática</option>
                  <option value="teorica">Teórica</option>
                </select>
                <input type="date" value={newLesson.data} onChange={e => setNewLesson({...newLesson, data: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="time" placeholder="Início" value={newLesson.hora_inicio}
                  onChange={e => setNewLesson({...newLesson, hora_inicio: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="time" placeholder="Fim" value={newLesson.hora_fim}
                  onChange={e => setNewLesson({...newLesson, hora_fim: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="text" placeholder="Instrutor" value={newLesson.instrutor}
                  onChange={e => setNewLesson({...newLesson, instrutor: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="text" placeholder="Descrição" value={newLesson.descricao}
                  onChange={e => setNewLesson({...newLesson, descricao: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm col-span-2" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={newLesson.realizada}
                    onChange={e => setNewLesson({...newLesson, realizada: e.target.checked})} />
                  Realizada
                </label>
                <button onClick={addLesson}
                  className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
                  Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Tipo</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Data</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Horário</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Instrutor</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Descrição</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Estado</th>
                    <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {lessons.length === 0 ? (
                    <tr><td colSpan={7} className="text-center p-6 text-gray-500 text-sm">Nenhuma aula registada</td></tr>
                  ) : lessons.map((l: any) => (
                    <tr key={l.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm">
                        <span className={`font-bold ${l.tipo === 'pratica' ? 'text-blue-600' : 'text-purple-600'}`}>
                          {l.tipo === 'pratica' ? 'Prática' : 'Teórica'}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-700">{new Date(l.data).toLocaleDateString('pt-PT')}</td>
                      <td className="p-3 text-sm text-gray-600">
                        {l.hora_inicio ? l.hora_inicio.substring(0, 5) : '-'}{l.hora_fim ? ` - ${l.hora_fim.substring(0, 5)}` : ''}
                      </td>
                      <td className="p-3 text-sm text-gray-600">{l.instrutor || '-'}</td>
                      <td className="p-3 text-sm text-gray-600 max-w-xs truncate">{l.descricao || '-'}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold ${l.realizada ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {l.realizada ? 'Realizada' : 'Pendente'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteLesson(l.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Contactos Tab */}
        {activeTab === 'contactos' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            {/* Add contact form */}
            <div className="p-4 border-b border-gray-100 bg-gray-50">
              <h4 className="font-bold text-sm text-gray-700 mb-3">Adicionar Contacto de Emergência</h4>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <input type="text" placeholder="Nome *" value={newContact.nome}
                  onChange={e => setNewContact({...newContact, nome: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="text" placeholder="Parentesco" value={newContact.parentesco}
                  onChange={e => setNewContact({...newContact, parentesco: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="text" placeholder="Telefone" value={newContact.telefone}
                  onChange={e => setNewContact({...newContact, telefone: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <input type="email" placeholder="Email" value={newContact.email}
                  onChange={e => setNewContact({...newContact, email: e.target.value})}
                  className="border border-gray-300 rounded-lg p-2.5 text-sm" />
                <button onClick={addContact}
                  className="bg-[#047857] hover:bg-[#065f46] text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
                  Adicionar
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Nome</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Parentesco</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Telefone</th>
                    <th className="text-left p-3 text-xs font-bold text-gray-600">Email</th>
                    <th className="text-right p-3 text-xs font-bold text-gray-600">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {contacts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center p-6 text-gray-500 text-sm">Nenhum contacto registado</td></tr>
                  ) : contacts.map((c: any) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="p-3 text-sm font-medium text-gray-800">{c.nome}</td>
                      <td className="p-3 text-sm text-gray-600">{c.parentesco || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{c.telefone || '-'}</td>
                      <td className="p-3 text-sm text-gray-600">{c.email || '-'}</td>
                      <td className="p-3 text-right">
                        <button onClick={() => deleteContact(c.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </BackofficeLayout>
  );
}
