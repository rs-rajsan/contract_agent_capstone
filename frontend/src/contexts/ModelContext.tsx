import React, { createContext, useContext, useState, ReactNode } from 'react';

export type AIModel = 'gemini-2.5-flash' | 'gemini-1.5-pro' | 'gpt-4o' | 'sonnet-3.5';

interface ModelContextType {
  selectedModel: AIModel;
  setSelectedModel: (model: AIModel) => void;
  availableModels: { id: AIModel; label: string }[];
}

const ModelContext = createContext<ModelContextType | undefined>(undefined);

export const ModelProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState<AIModel>('gemini-2.5-flash');

  const availableModels: { id: AIModel; label: string }[] = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash' },
    { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
    { id: 'gpt-4o', label: 'GPT-4o' },
    { id: 'sonnet-3.5', label: 'Claude Sonnet 3.5' },
  ];

  return (
    <ModelContext.Provider value={{ selectedModel, setSelectedModel, availableModels }}>
      {children}
    </ModelContext.Provider>
  );
};

export const useModel = () => {
  const context = useContext(ModelContext);
  if (context === undefined) {
    throw new Error('useModel must be used within a ModelProvider');
  }
  return context;
};
