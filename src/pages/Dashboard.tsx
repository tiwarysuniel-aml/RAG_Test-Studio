import { useState } from 'react';
import { Send, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { useSettings } from '../context/SettingsContext';
import { useHistory } from '../context/HistoryContext';
import { retrieveTopChunks } from '../utils/retriever';
import { generateAnswer, type AIResponse } from '../utils/aiProvider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const { document } = useDocument();
  const { settings } = useSettings();
  const { addRecord } = useHistory();
  
  const [loading, setLoading] = useState(false);
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState<AIResponse | null>(null);
  const [retrieved, setRetrieved] = useState<any[]>([]);
  const [error, setError] = useState('');

  const demoQuestions = [
    "Summarize the document",
    "What are the key requirements?",
    "What risks are mentioned?",
    "What assumptions exist?"
  ];

  const handleAsk = async (q: string = question) => {
    if (!document) {
      setError("Please upload a document first.");
      return;
    }
    if (!q.trim()) return;
    
    setQuestion(q);
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const topChunks = retrieveTopChunks(q, document.chunks, 3);
      setRetrieved(topChunks);
      
      const res = await generateAnswer(q, topChunks, settings);
      setResult(res);
      
      addRecord({
        documentName: document.name,
        question: q,
        provider: settings.provider,
        model: settings.provider === 'gemini' ? settings.geminiModel : settings.ollamaModel,
        answer: res.answer,
        retrievedChunks: topChunks.map(c => c.text),
        scores: res.scores
      });
      
    } catch (err: any) {
      setError(`Error generating answer: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Retrieval', score: result.scores.retrievalAccuracy },
    { name: 'Generation', score: result.scores.generationQuality },
    { name: 'Grounded', score: result.scores.groundedness },
    { name: 'Relevance', score: result.scores.relevance },
    { name: 'No Halluc', score: result.scores.hallucinationRisk },
  ] : [];

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-center px-4">
        <FileText className="w-16 h-16 text-[#1a233a] mb-4" />
        <h2 className="text-2xl font-bold text-slate-300 mb-2">No Document Loaded</h2>
        <p className="text-slate-400 mb-6 max-w-md">You need to upload a document before you can ask questions and generate a RAG score.</p>
        <Link to="/document" className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors shadow-lg">
          Go to Document Upload
        </Link>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto flex flex-col gap-8">
      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-lg flex items-start gap-3">
          <AlertCircle size={20} className="mt-0.5 shrink-0" /> 
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{error}</div>
        </div>
      )}

      {/* QA Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="flex flex-col gap-6">
          <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4 text-slate-100">Ask Question</h2>
            <div className="flex gap-2">
              <input 
                type="text"
                value={question}
                onChange={e => setQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAsk()}
                placeholder="What is this document about?"
                className="flex-1 bg-[#101726] border border-[#1a233a] rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                disabled={loading}
              />
              <button 
                onClick={() => handleAsk()}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors shadow-md"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {demoQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleAsk(q)}
                  className="text-xs bg-[#101726] hover:bg-[#151d30] text-slate-300 px-3 py-1.5 rounded-full transition-colors border border-[#1a233a]"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {retrieved.length > 0 && (
            <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm flex-1">
              <h2 className="text-xl font-semibold mb-4 text-slate-100 flex justify-between items-center">
                <span>Retrieved Chunks</span>
                <span className="text-xs font-normal text-slate-400 bg-[#101726] px-2 py-1 rounded">Top {retrieved.length}</span>
              </h2>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {retrieved.map((c, i) => (
                  <div key={i} className="bg-[#101726] border border-[#1a233a] p-4 rounded-lg">
                    <div className="text-xs text-blue-400 font-mono mb-2">Chunk {i+1}</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{c.text}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-6">
          {result && (
            <>
              <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold mb-4 text-slate-100">AI Answer</h2>
                <div className="bg-[#101726] border border-[#1a233a] p-5 rounded-lg text-slate-200 leading-relaxed">
                  {result.answer}
                </div>
              </div>

              <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-slate-100">RAG Scores</h2>
                  <div className="text-3xl font-bold text-blue-400">{result.scores.overall.toFixed(0)}<span className="text-lg text-slate-500">/100</span></div>
                </div>
                
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 5, right: 0, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a233a" />
                      <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} />
                      <YAxis stroke="#94a3b8" domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0a0f1c', borderColor: '#1a233a', color: '#f1f5f9' }}
                        itemStyle={{ color: '#3b82f6' }}
                      />
                      <Bar dataKey="score" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
