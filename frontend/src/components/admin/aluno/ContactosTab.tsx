import { useState } from 'react';
import type { NewContact } from '../../../hooks/useStudentProfile';

interface ContactosTabProps {
  contacts: any[];
  onAdd: (contact: NewContact) => Promise<boolean>;
  onDelete: (contactId: string) => void;
}

const emptyContact = (): NewContact => ({ nome: '', parentesco: '', telefone: '', email: '' });

export default function ContactosTab({ contacts, onAdd, onDelete }: ContactosTabProps) {
  const [newContact, setNewContact] = useState<NewContact>(emptyContact);

  const handleAdd = async () => {
    const ok = await onAdd(newContact);
    if (ok) setNewContact(emptyContact());
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
      {/* Add contact form */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <h4 className="font-bold text-sm text-gray-700 mb-3">Adicionar Contacto de Emergência</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <input type="text" placeholder="Nome *" value={newContact.nome}
            onChange={(e) => setNewContact({ ...newContact, nome: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <input type="text" placeholder="Parentesco" value={newContact.parentesco}
            onChange={(e) => setNewContact({ ...newContact, parentesco: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <input type="text" placeholder="Telefone" value={newContact.telefone}
            onChange={(e) => setNewContact({ ...newContact, telefone: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <input type="email" placeholder="Email" value={newContact.email}
            onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
            className="border border-gray-300 rounded-lg p-2.5 text-sm" />
          <button onClick={handleAdd}
            className="bg-brand hover:bg-brand-dark text-white font-bold py-2.5 px-4 rounded-lg text-sm transition-colors">
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
                  <button onClick={() => onDelete(c.id)} className="text-red-600 hover:text-red-800 text-xs font-medium">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
