import React from 'react';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

const variants: Record<Variant, string> = {
  primary: 'bg-brand hover:bg-brand-dark text-white',
  secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
  danger: 'bg-red-50 hover:bg-red-100 text-red-600',
  ghost: 'text-gray-600 hover:bg-gray-50',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
}

export default function Button({ variant = 'primary', className = '', ...rest }: ButtonProps) {
  return (
    <button
      className={`font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 ${variants[variant]} ${className}`}
      {...rest}
    />
  );
}
