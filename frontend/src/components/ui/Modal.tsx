import React from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export default function Modal({ open, onClose, title, children, className = 'max-w-sm' }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-2xl shadow-xl w-full ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="px-5 pt-5">
            <h3 className="font-bold text-gray-800 text-base">{title}</h3>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
