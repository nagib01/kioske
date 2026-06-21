export default function Spinner({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <div
      className={`border-4 border-brand/30 border-t-brand rounded-full animate-spin ${className}`}
      role="status"
      aria-label="A carregar"
    />
  );
}
