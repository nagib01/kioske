import React from 'react';
import Logo from '../Logo';

interface KioskHeaderProps {
  /** Right-aligned action(s) for the header. */
  children?: React.ReactNode;
}

export default function KioskHeader({ children }: KioskHeaderProps) {
  return (
    <header className="bg-white px-4 py-3 shadow-sm flex items-center justify-between sticky top-0 z-10">
      <Logo className="text-sm" />
      {children}
    </header>
  );
}
