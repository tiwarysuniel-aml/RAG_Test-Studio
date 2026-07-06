import type { ChangeEvent } from 'react';
import { useState } from 'react';
import { CloudUpload, Loader2, AlertCircle, CheckCircle2, FileText, File, Hash } from 'lucide-react';
import { useDocument } from '../context/DocumentContext';
import { parseTxt, parsePdf, parseDocx } from '../utils/documentParser';
import { chunkText } from '../utils/chunker';

const Document = () => {
  const { document, setDocument } = useDocument();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setLoading(true);
    setError('');
    
    try {
      let text = '';
      let pageCount = 0;
      
      if (file.name.endsWith('.pdf')) {
        const res = await parsePdf(file);
        text = res.text;
        pageCount = res.pageCount;
      } else if (file.name.endsWith('.docx')) {
        text = await parseDocx(file);
      } else if (file.name.endsWith('.txt')) {
        text = await parseTxt(file);
      } else {
        throw new Error("Unsupported file type");
      }
      
      const chunks = chunkText(text, 500, 50);
      setDocument({
        name: file.name,
        size: file.size,
        pageCount: pageCount || undefined,
        text,
        chunks
      });
      
    } catch (err: any) {
      setError(`Error parsing file: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    else return (bytes / 1048576).toFixed(2) + ' MB';
  };

  return (
    <div className="flex flex-col h-full w-full max-w-5xl mx-auto p-12">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Document Management</h1>
        <p className="text-slate-400 text-sm">Upload PDF, DOCX, or TXT files to process and chunk for RAG.</p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-400 border border-red-500/20 p-4 rounded-lg flex items-center gap-2 mb-6">
          <AlertCircle size={20} /> {error}
        </div>
      )}

      <label className={`flex flex-col items-center justify-center w-full ${document ? 'h-[200px] mb-8' : 'h-[320px]'} border border-[#1a233a] border-dashed rounded-xl cursor-pointer hover:bg-[#0a0f1c] transition-all relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex flex-col items-center justify-center text-center">
          <div className="w-16 h-16 rounded-full bg-[#101726] border border-[#1a233a] flex items-center justify-center mb-6 shadow-md">
            {loading ? <Loader2 className="w-8 h-8 text-blue-400 animate-spin" /> : <CloudUpload className="w-8 h-8 text-slate-300" />}
          </div>
          <h2 className="text-xl font-bold text-white mb-3">Click or drag document here</h2>
          <p className="text-sm text-slate-400">Supports PDF, DOCX, and TXT (Extracted locally)</p>
        </div>
        <input type="file" className="hidden" accept=".pdf,.docx,.txt" onChange={handleFileUpload} disabled={loading} />
      </label>

      {document && (
        <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm flex flex-col gap-6">
          <div className="flex items-center gap-2 text-emerald-500 font-semibold text-lg">
            <CheckCircle2 size={24} /> Active Document Ready
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#101726] border border-[#1a233a] rounded-lg p-4 flex gap-4 items-center">
              <div className="text-blue-500"><FileText size={24} /></div>
              <div className="overflow-hidden">
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">FILE NAME</div>
                <div className="text-sm text-slate-200 font-medium truncate w-full" title={document.name}>{document.name}</div>
              </div>
            </div>
            
            <div className="bg-[#101726] border border-[#1a233a] rounded-lg p-4 flex gap-4 items-center">
              <div className="text-blue-500"><File size={24} /></div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">SIZE & PAGES</div>
                <div className="text-sm text-slate-200 font-medium">{formatSize(document.size)}{document.pageCount ? ` • ${document.pageCount} Page${document.pageCount > 1 ? 's' : ''}` : ''}</div>
              </div>
            </div>

            <div className="bg-[#101726] border border-[#1a233a] rounded-lg p-4 flex gap-4 items-center">
              <div className="text-orange-500"><Hash size={24} /></div>
              <div>
                <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">TOTAL CHUNKS</div>
                <div className="text-sm text-slate-200 font-medium">{document.chunks.length} chunks</div>
              </div>
            </div>
          </div>

          <div>
            <div className="text-sm text-slate-300 mb-3">
              <span className="font-semibold text-white">Chunking Strategy:</span> Fixed-size (500 chars) with 50 chars overlap.
            </div>
            <div className="bg-[#101726] border border-[#1a233a] rounded-lg p-4 h-64 overflow-y-auto text-sm text-slate-400 font-mono whitespace-pre-wrap leading-relaxed">
              {document.text}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Document;
