import React from 'react';

type Tone = 'green' | 'gray' | 'red' | 'amber' | 'blue';

const tones: Record<Tone, string> = {
  green: 'bg-green-100 text-green-800',
  gray: 'bg-gray-100 text-gray-700',
  red: 'bg-red-100 text-red-700',
  amber: 'bg-amber-100 text-amber-800',
  blue: 'bg-blue-100 text-blue-800',
};

interface BadgeProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ tone = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`text-xs font-bold px-3 py-1 rounded-full ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
