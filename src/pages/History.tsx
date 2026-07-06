import { useState } from 'react';
import { useHistory, type QARecord } from '../context/HistoryContext';
import { Download, Trash2, Calendar, FileText, Activity } from 'lucide-react';
import html2pdf from 'html2pdf.js';

const History = () => {
  const { history, clearHistory } = useHistory();
  const [exportingId, setExportingId] = useState<string | null>(null);

  const exportPDF = (record: QARecord) => {
    setExportingId(record.id);
    const element = document.getElementById(`report-${record.id}`);
    
    if (element) {
      const opt = {
        margin:       10,
        filename:     `RAG_Report_${record.documentName}_${new Date(record.timestamp).getTime()}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setExportingId(null);
      });
    } else {
        setExportingId(null);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Audit History</h1>
        {history.length > 0 && (
          <button 
            onClick={clearHistory}
            className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-lg transition-colors border border-red-500/20"
          >
            <Trash2 size={16} /> Clear History
          </button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-12 text-center text-slate-400 shadow-sm">
          <Activity size={48} className="mx-auto mb-4 opacity-50" />
          <p>No history found. Run a test in the Dashboard to generate records.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {history.map(record => (
            <div key={record.id} className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-medium text-slate-100 mb-1">{record.question}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400">
                    <span className="flex items-center gap-1"><FileText size={14} /> {record.documentName}</span>
                    <span className="flex items-center gap-1"><Calendar size={14} /> {new Date(record.timestamp).toLocaleString()}</span>
                    <span className="bg-blue-500/10 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-500/20">
                      {record.provider} / {record.model}
                    </span>
                  </div>
                </div>
                
                <div className="flex flex-col items-end gap-2">
                  <div className="text-2xl font-bold text-blue-400">
                    {record.scores.overall.toFixed(0)}<span className="text-sm text-slate-500">/100</span>
                  </div>
                  <button 
                    onClick={() => exportPDF(record)}
                    disabled={exportingId === record.id}
                    className="flex items-center gap-1 text-xs bg-[#101726] hover:bg-[#1a233a] px-3 py-1.5 rounded transition-colors border border-[#1a233a] text-slate-200"
                  >
                    <Download size={14} /> 
                    {exportingId === record.id ? 'Exporting...' : 'Export PDF'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="bg-[#101726] p-3 rounded border border-[#1a233a]">
                  <div className="text-xs text-slate-400 mb-1">Retrieval</div>
                  <div className="font-semibold text-slate-200">{record.scores.retrievalAccuracy}%</div>
                </div>
                <div className="bg-[#101726] p-3 rounded border border-[#1a233a]">
                  <div className="text-xs text-slate-400 mb-1">Generation</div>
                  <div className="font-semibold text-slate-200">{record.scores.generationQuality}%</div>
                </div>
                <div className="bg-[#101726] p-3 rounded border border-[#1a233a]">
                  <div className="text-xs text-slate-400 mb-1">Groundedness</div>
                  <div className="font-semibold text-slate-200">{record.scores.groundedness}%</div>
                </div>
                <div className="bg-[#101726] p-3 rounded border border-[#1a233a]">
                  <div className="text-xs text-slate-400 mb-1">No Hallucination</div>
                  <div className="font-semibold text-slate-200">{record.scores.hallucinationRisk}%</div>
                </div>
              </div>

              <div style={{ display: 'none' }}>
                <div id={`report-${record.id}`} style={{ padding: '40px', backgroundColor: '#ffffff', color: '#000000', fontFamily: 'sans-serif' }}>
                  <h1 style={{ fontSize: '24px', borderBottom: '2px solid #000', paddingBottom: '10px', marginBottom: '20px' }}>RAG QA Report</h1>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <p><strong>Document:</strong> {record.documentName}</p>
                    <p><strong>Date:</strong> {new Date(record.timestamp).toLocaleString()}</p>
                    <p><strong>Provider/Model:</strong> {record.provider} / {record.model}</p>
                  </div>
                  
                  <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
                    <h3 style={{ marginTop: 0, fontSize: '14px', color: '#666' }}>Question:</h3>
                    <p style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>{record.question}</p>
                  </div>
                  
                  <div style={{ marginBottom: '20px' }}>
                    <h3>AI Answer:</h3>
                    <p style={{ padding: '15px', border: '1px solid #ccc', borderRadius: '5px', whiteSpace: 'pre-wrap', lineHeight: '1.5' }}>{record.answer}</p>
                  </div>

                  <div style={{ marginBottom: '30px' }}>
                    <h3>RAG Scores</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <tbody>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}><strong>Overall Score</strong></td>
                          <td style={{ textAlign: 'right' }}><strong>{record.scores.overall}%</strong></td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}>Retrieval Accuracy</td>
                          <td style={{ textAlign: 'right' }}>{record.scores.retrievalAccuracy}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}>Generation Quality</td>
                          <td style={{ textAlign: 'right' }}>{record.scores.generationQuality}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}>Groundedness</td>
                          <td style={{ textAlign: 'right' }}>{record.scores.groundedness}%</td>
                        </tr>
                        <tr style={{ borderBottom: '1px solid #eee' }}>
                          <td style={{ padding: '10px 0' }}>Hallucination Risk (100 = Safe)</td>
                          <td style={{ textAlign: 'right' }}>{record.scores.hallucinationRisk}%</td>
                        </tr>
                        <tr>
                          <td style={{ padding: '10px 0' }}>Relevance</td>
                          <td style={{ textAlign: 'right' }}>{record.scores.relevance}%</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  <div>
                    <h3>Retrieved Context (Top 3 Chunks)</h3>
                    {record.retrievedChunks.map((c, i) => (
                      <div key={i} style={{ marginBottom: '15px', padding: '15px', backgroundColor: '#fafafa', border: '1px solid #eee', fontSize: '12px', lineHeight: '1.4' }}>
                        <div style={{ fontWeight: 'bold', marginBottom: '5px', color: '#666' }}>Chunk {i+1}</div>
                        <div>{c}</div>
                      </div>
                    ))}
                  </div>

                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default History;
