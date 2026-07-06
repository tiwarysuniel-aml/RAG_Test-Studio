import type { Chunk } from '../context/DocumentContext';

export const chunkText = (text: string, chunkSize: number = 500, overlap: number = 50): Chunk[] => {
  const chunks: Chunk[] = [];
  let i = 0;
  let chunkId = 1;

  while (i < text.length) {
    const chunkText = text.substring(i, i + chunkSize);
    chunks.push({
      id: `chunk-${chunkId++}`,
      text: chunkText,
    });
    // Ensure we advance at least 1 character to prevent infinite loop
    i += Math.max(1, chunkSize - overlap);
  }
  
  return chunks;
};
