'use client';
import React, { createContext, useContext, useState } from 'react';

interface WizardContextType {
  completedSteps: string[];
  markStepComplete: (stepId: string) => void;
}

const WizardContext = createContext<WizardContextType>({
  completedSteps: [],
  markStepComplete: () => {},
});

export function WizardProvider({
  children,
  initialCompletedSteps,
}: {
  children: React.ReactNode;
  initialCompletedSteps: string[];
}) {
  const [completedSteps, setCompletedSteps] = useState<string[]>(initialCompletedSteps);

  const markStepComplete = (stepId: string) => {
    setCompletedSteps(prev => (prev.includes(stepId) ? prev : [...prev, stepId]));
  };

  return (
    <WizardContext.Provider value={{ completedSteps, markStepComplete }}>
      {children}
    </WizardContext.Provider>
  );
}

export const useWizard = () => useContext(WizardContext);
