interface CurrentUserProps {
  nome: string;
  subtitle: string;
  avatar?: string | null;
  /** When provided, renders a "Terminar Sessão" (logout) button. */
  onLogout?: () => void;
  /** Classes for the root wrapper. */
  className?: string;
}

/**
 * The logged-in user's avatar + name + role label (and optional logout),
 * shared across the backoffice, instructor, and receptionist UIs.
 */
export default function CurrentUser({ nome, subtitle, avatar, onLogout, className = '' }: CurrentUserProps) {
  return (
    <div className={className}>
      <div className={`flex items-center gap-3 ${onLogout ? 'mb-3' : ''}`}>
        {avatar ? (
          <img src={avatar} alt={nome} className="w-10 h-10 rounded-full object-cover" />
        ) : (
          <div className="w-10 h-10 bg-brand rounded-full flex items-center justify-center text-white font-bold uppercase">
            {nome.split(' ').map((n) => n[0]).slice(0, 2).join('')}
          </div>
        )}
        <div>
          <p className="text-sm font-bold text-gray-800">{nome}</p>
          <p className="text-xs text-gray-500">{subtitle}</p>
        </div>
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          className="w-full text-left text-sm text-red-600 hover:text-red-800 font-medium px-4 py-2 rounded-lg hover:bg-red-50 transition-colors"
        >
          Terminar Sessão
        </button>
      )}
    </div>
  );
}
