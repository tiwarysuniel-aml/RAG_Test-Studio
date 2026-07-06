import { createContext, useContext, useState, type ReactNode } from 'react';

export interface Chunk {
  id: string;
  text: string;
}

export interface DocumentState {
  name: string;
  size: number; // in bytes
  pageCount?: number;
  text: string;
  chunks: Chunk[];
}

interface DocumentContextType {
  document: DocumentState | null;
  setDocument: (doc: DocumentState | null) => void;
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined);

export const DocumentProvider = ({ children }: { children: ReactNode }) => {
  const [document, setDocument] = useState<DocumentState | null>(null);

  return (
    <DocumentContext.Provider value={{ document, setDocument }}>
      {children}
    </DocumentContext.Provider>
  );
};

export const useDocument = () => {
  const context = useContext(DocumentContext);
  if (context === undefined) {
    throw new Error('useDocument must be used within a DocumentProvider');
  }
  return context;
};
