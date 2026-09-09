'use client';

import React, { createContext, useContext, useState } from 'react';
import { ConsultationModal } from '@/components/forms/ConsultationModal';

interface ConsultationContextType {
  openConsultation: (defaultService?: string) => void;
  closeConsultation: () => void;
}

const ConsultationContext = createContext<ConsultationContextType>({
  openConsultation: () => {},
  closeConsultation: () => {},
});

export function ConsultationProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [defaultService, setDefaultService] = useState<string | undefined>(undefined);

  const openConsultation = (service?: string) => {
    setDefaultService(service);
    setIsOpen(true);
  };

  const closeConsultation = () => {
    setIsOpen(false);
  };

  return (
    <ConsultationContext.Provider value={{ openConsultation, closeConsultation }}>
      {children}
      <ConsultationModal
        isOpen={isOpen}
        onClose={closeConsultation}
        defaultService={defaultService}
      />
    </ConsultationContext.Provider>
  );
}

export function useConsultation() {
  return useContext(ConsultationContext);
}
