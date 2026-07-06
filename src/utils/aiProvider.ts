import type { Settings } from '../context/SettingsContext';
import type { Chunk } from '../context/DocumentContext';

export interface EvalScores {
  retrievalAccuracy: number;
  generationQuality: number;
  groundedness: number;
  hallucinationRisk: number;
  relevance: number;
  overall: number;
}

export interface AIResponse {
  answer: string;
  scores: EvalScores;
}

// ──────────────────────────────────────────────────
// CLIENT-SIDE SCORING (fast, no extra API call)
// ──────────────────────────────────────────────────
const tokenize = (text: string): Set<string> => {
  return new Set(
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2)
  );
};

const jaccardSimilarity = (a: Set<string>, b: Set<string>): number => {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  a.forEach(t => { if (b.has(t)) intersection++; });
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
};

export const computeScores = (
  question: string,
  answer: string,
  chunks: Chunk[]
): EvalScores => {
  const qTokens = tokenize(question);
  const aTokens = tokenize(answer);
  const chunkText = chunks.map(c => c.text).join(' ');
  const cTokens = tokenize(chunkText);

  // Retrieval Accuracy: how well do retrieved chunks match the question?
  const retrievalAccuracy = Math.round(jaccardSimilarity(qTokens, cTokens) * 300);

  // Relevance: how well does the answer match the question?
  const relevance = Math.round(jaccardSimilarity(qTokens, aTokens) * 300);

  // Groundedness: how well does the answer overlap with retrieved chunks?
  const groundedness = Math.round(jaccardSimilarity(aTokens, cTokens) * 250);

  // Hallucination: inverse of groundedness — high overlap = low hallucination risk
  const groundednessRaw = jaccardSimilarity(aTokens, cTokens);
  const hallucinationRisk = Math.round(groundednessRaw * 200);

  // Generation quality: length & completeness heuristic
  const wordCount = answer.split(/\s+/).length;
  const generationQuality = Math.min(100, Math.round(wordCount * 2));

  const clamp = (n: number) => Math.min(100, Math.max(0, n));

  const ra = clamp(retrievalAccuracy);
  const gq = clamp(generationQuality);
  const gr = clamp(groundedness);
  const hr = clamp(hallucinationRisk);
  const re = clamp(relevance);
  const overall = Math.round((ra + gq + gr + hr + re) / 5);

  return {
    retrievalAccuracy: ra,
    generationQuality: gq,
    groundedness: gr,
    hallucinationRisk: hr,
    relevance: re,
    overall
  };
};

// ──────────────────────────────────────────────────
// SIMPLE ANSWER-ONLY PROMPT (minimizes tokens)
// ──────────────────────────────────────────────────
const buildAnswerPrompt = (question: string, chunks: Chunk[]): string => {
  // Trim each chunk to 400 chars to keep context small
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.text.substring(0, 400)}`)
    .join('\n\n');

  return `You are a document assistant. Answer the question using ONLY the provided context.
If the answer is not in the context, say "I cannot answer this based on the provided document."
Do NOT include any explanation or extra commentary. Just give a clear, concise answer.

CONTEXT:
${context}

QUESTION: ${question}

ANSWER:`;
};

// ──────────────────────────────────────────────────
// GEMINI: Ask for JSON (answer + scores in one call)
// ──────────────────────────────────────────────────
const buildGeminiPrompt = (question: string, chunks: Chunk[]): string => {
  const context = chunks.map(c => `--- Chunk ---\n${c.text}`).join('\n\n');

  return `You are a RAG evaluator and document assistant.

CONTEXT:
${context}

QUESTION: ${question}

TASK:
1. Answer the QUESTION based ONLY on the CONTEXT. If not found, say "I cannot answer this based on the provided document."
2. Evaluate the quality using these 0-100 scores:
   - retrievalAccuracy: how well the chunks contain the answer
   - generationQuality: how clear the answer is
   - groundedness: how well the answer is supported by context
   - hallucinationRisk: 100 = no hallucination, 0 = major hallucination
   - relevance: how relevant the answer is to the question
   - overall: average of the above

Return ONLY valid JSON, no markdown:
{"answer":"...","scores":{"retrievalAccuracy":0,"generationQuality":0,"groundedness":0,"hallucinationRisk":0,"relevance":0,"overall":0}}`;
};

// ──────────────────────────────────────────────────
// MAIN EXPORT
// ──────────────────────────────────────────────────
export const generateAnswer = async (
  question: string,
  chunks: Chunk[],
  settings: Settings
): Promise<AIResponse> => {

  if (settings.provider === 'gemini') {
    if (!settings.geminiKey) throw new Error("Gemini API key is missing. Go to Settings and add your key.");

    const prompt = buildGeminiPrompt(question, chunks);
    const model = settings.geminiModel || 'gemini-2.5-flash';

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${settings.geminiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: "application/json" }
        })
      }
    );

    if (!res.ok) {
      let errMsg = res.statusText;
      try {
        const errData = await res.json();
        if (errData.error?.message) errMsg = errData.error.message;
      } catch (e) {}
      throw new Error(`Gemini API Error: ${errMsg}`);
    }

    const data = await res.json();
    const text = data.candidates[0].content.parts[0].text;
    const clean = text.replace(/```json/gi, '').replace(/```/g, '').trim();

    let parsed: AIResponse;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      throw new Error(`Gemini returned invalid JSON. Raw: ${clean.substring(0, 200)}`);
    }
    return parsed;

  } else {
    // ── OLLAMA: simple answer prompt + client-side scoring ──
    if (!settings.ollamaBaseUrl) throw new Error("Ollama Base URL is missing. Check Settings.");
    if (!settings.ollamaModel) throw new Error("Ollama Model name is missing. Check Settings.");

    const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, '');
    const prompt = buildAnswerPrompt(question, chunks);

    // 5-minute timeout for slow local models
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          model: settings.ollamaModel,
          prompt: prompt,
          stream: false,
          options: {
            temperature: 0.1,
            num_predict: 512
          }
        })
      });
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(
          `Ollama timed out after 5 minutes. The model is too slow or not responding.\n` +
          `Try a lighter model like "mistral" or "llama3.2:3b".`
        );
      }
      throw new Error(
        `Cannot connect to Ollama at "${baseUrl}".\n` +
        `Make sure Ollama is running and set OLLAMA_ORIGINS="*".\n` +
        `Run: ollama serve`
      );
    }
    clearTimeout(timeoutId);

    if (!res.ok) {
      let errMsg = res.statusText;
      try {
        const errData = await res.json();
        if (errData.error) errMsg = errData.error;
      } catch (e) {}
      throw new Error(`Ollama API Error (${res.status}): ${errMsg}`);
    }

    const data = await res.json();

    if (!data.response || data.response.trim() === '') {
      throw new Error(
        `Ollama returned an empty response for model "${settings.ollamaModel}".\n` +
        `Make sure the model is pulled: run "ollama pull ${settings.ollamaModel}"`
      );
    }

    const answer = data.response.trim();

    // Compute RAG scores locally — fast, no extra API call
    const scores = computeScores(question, answer, chunks);

    return { answer, scores };
  }
};
