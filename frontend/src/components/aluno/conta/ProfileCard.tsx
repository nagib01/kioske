interface ProfileCardProps {
  student: any;
  onChangePassword: () => void;
  onLogoutAll: () => void;
}

export default function ProfileCard({ student, onChangePassword, onLogoutAll }: ProfileCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-brand flex items-center justify-center text-white text-lg font-bold shrink-0">
          {student.nome.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-gray-800 truncate">{student.nome}</h2>
          <p className="text-xs text-gray-500">{student.email || ''}</p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3">
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-500 font-medium">Email</p>
          <p className="text-xs text-gray-800 truncate">{student.email || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-500 font-medium">Telefone</p>
          <p className="text-xs text-gray-800">{student.telefone || '-'}</p>
        </div>
        <div className="bg-gray-50 rounded-xl p-2.5">
          <p className="text-[10px] text-gray-500 font-medium">Nº Estudante</p>
          <p className="text-xs text-gray-800">{student.numero_estudante || '-'}</p>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          onClick={onChangePassword}
          className="text-[10px] bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Alterar senha
        </button>
        <button
          onClick={onLogoutAll}
          className="text-[10px] bg-red-50 hover:bg-red-100 text-red-600 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
        >
          Terminar sessões
        </button>
      </div>
    </div>
  );
}
