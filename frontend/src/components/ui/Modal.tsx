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
  id?: string;
  'data-testid'?: string;
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'lg',
  id = 'modal-overlay',
  'data-testid': testId = 'modal-overlay',
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
    <div
      id={id}
      data-testid={testId}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? 'modal-description' : undefined}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 modal-overlay"
    >
      {/* Backdrop */}
      <div 
        id="modal-backdrop"
        data-testid="modal-backdrop"
        className="fixed inset-0 bg-[#0B1426]/75 backdrop-blur-md transition-opacity animate-in fade-in duration-200 modal-backdrop"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div 
        id="modal-content"
        data-testid="modal-content"
        className={cn(
          'relative w-full bg-white text-slate-900 border border-slate-200/90 rounded-3xl shadow-2xl p-6 sm:p-8 z-10 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200 modal-container modal-dialog',
          maxWidths[maxWidth]
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-200 modal-header">
          <div>
            <h3 id="modal-title" data-testid="modal-title" className="text-xl sm:text-2xl font-extrabold text-[#0B1426] font-display">
              {title}
            </h3>
            {description && (
              <p id="modal-description" data-testid="modal-description" className="mt-1 text-xs sm:text-sm text-slate-600 font-medium">
                {description}
              </p>
            )}
          </div>
          <button
            id="modal-close-btn"
            data-testid="modal-close-btn"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 p-2 rounded-xl hover:bg-slate-100 transition-colors ml-4 shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div data-testid="modal-body" className="overflow-y-auto mt-4 pr-1 text-slate-800 modal-body">
          {children}
        </div>
      </div>
    </div>
  );
}

