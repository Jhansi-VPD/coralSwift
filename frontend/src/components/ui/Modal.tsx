import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg'
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '4xl': 'max-w-4xl'
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-[#0B1426]/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={cn(
        'relative w-full bg-white text-slate-900 border border-slate-200/90 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200',
        maxWidths[maxWidth]
      )}>
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-xl sm:text-2xl font-extrabold text-[#0B1426] font-display">{title}</h3>
            {description && (
              <p className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">{description}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors ml-4 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto mt-4 pr-1 text-slate-800">
          {children}
        </div>
      </div>
    </div>
  );
}
