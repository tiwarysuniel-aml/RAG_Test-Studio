import type { Chunk } from '../context/DocumentContext';

export const retrieveTopChunks = (query: string, chunks: Chunk[], topK: number = 3): Chunk[] => {
  const normalize = (str: string) => str.toLowerCase().replace(/[^\w\s]/g, '');
  
  const queryWords = normalize(query).split(/\s+/).filter(w => w.length > 2);
  
  if (queryWords.length === 0) return chunks.slice(0, topK);
  
  const scoredChunks = chunks.map(chunk => {
    const chunkText = normalize(chunk.text);
    
    let score = 0;
    // basic term frequency (TF) scoring
    for (const qw of queryWords) {
      const regex = new RegExp(`\\b${qw}\\b`, 'gi');
      const matches = chunkText.match(regex);
      if (matches) {
        score += matches.length;
      }
    }
    
    return { chunk, score };
  });
  
  scoredChunks.sort((a, b) => b.score - a.score);
  
  return scoredChunks.slice(0, topK).map(sc => sc.chunk);
};
