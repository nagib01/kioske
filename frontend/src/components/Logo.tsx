interface LogoProps {
  /** Extra classes for sizing, e.g. "text-sm sm:text-lg". */
  className?: string;
  text?: string;
  /** Where the logo links. Defaults to the public landing site. */
  href?: string;
}

export default function Logo({
  className = '',
  text = 'Kioske Digital',
  href = 'https://www.stonemark.pt',
}: LogoProps) {
  return (
    <h1 className={`font-bold text-brand uppercase tracking-wide ${className}`}>
      <a href={href}>{text}</a>
    </h1>
  );
}
