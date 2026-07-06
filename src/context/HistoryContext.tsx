import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export interface QARecord {
  id: string;
  timestamp: number;
  documentName: string;
  question: string;
  provider: string;
  model: string;
  answer: string;
  retrievedChunks: string[];
  scores: {
    retrievalAccuracy: number;
    generationQuality: number;
    groundedness: number;
    hallucinationRisk: number;
    relevance: number;
    overall: number;
  };
}

interface HistoryContextType {
  history: QARecord[];
  addRecord: (record: Omit<QARecord, 'id' | 'timestamp'>) => void;
  clearHistory: () => void;
}

const HistoryContext = createContext<HistoryContextType | undefined>(undefined);

export const HistoryProvider = ({ children }: { children: ReactNode }) => {
  const [history, setHistory] = useState<QARecord[]>(() => {
    const saved = localStorage.getItem('rag-studio-history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('rag-studio-history', JSON.stringify(history));
  }, [history]);

  const addRecord = (record: Omit<QARecord, 'id' | 'timestamp'>) => {
    const newRecord: QARecord = {
      ...record,
      id: Math.random().toString(36).substring(2, 9),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newRecord, ...prev]);
  };

  const clearHistory = () => setHistory([]);

  return (
    <HistoryContext.Provider value={{ history, addRecord, clearHistory }}>
      {children}
    </HistoryContext.Provider>
  );
};

export const useHistory = () => {
  const context = useContext(HistoryContext);
  if (context === undefined) {
    throw new Error('useHistory must be used within a HistoryProvider');
  }
  return context;
};
