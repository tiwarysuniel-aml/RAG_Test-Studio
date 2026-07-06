import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { Save, CheckCircle2, XCircle, RefreshCw } from 'lucide-react';

const Settings = () => {
  const { settings, updateSettings } = useSettings();
  const [localSettings, setLocalSettings] = useState(settings);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'loading' | null; msg: string }>({ type: null, msg: '' });

  const handleSave = () => {
    updateSettings(localSettings);
    setStatus({ type: 'success', msg: 'Settings saved successfully' });
    setTimeout(() => setStatus({ type: null, msg: '' }), 3000);
  };

  const testConnection = async () => {
    setStatus({ type: 'loading', msg: 'Testing connection...' });
    try {
      if (localSettings.provider === 'gemini') {
        if (!localSettings.geminiKey) throw new Error("API Key is required");
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${localSettings.geminiModel}:generateContent?key=${localSettings.geminiKey}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: "Hello" }] }]
          })
        });
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      } else {
        if (!localSettings.ollamaBaseUrl) throw new Error("Base URL is required");
        const res = await fetch(`${localSettings.ollamaBaseUrl.replace(/\/$/, '')}/api/tags`);
        if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      }
      setStatus({ type: 'success', msg: 'Connection successful!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Connection failed: ${err.message}` });
    }
  };

  const autoDiscoverOllama = async () => {
    setStatus({ type: 'loading', msg: 'Discovering models...' });
    try {
      const res = await fetch(`${localSettings.ollamaBaseUrl.replace(/\/$/, '')}/api/tags`);
      if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);
      const data = await res.json();
      if (data.models && data.models.length > 0) {
        const modelName = data.models[0].name;
        setLocalSettings(prev => ({ ...prev, ollamaModel: modelName }));
        setStatus({ type: 'success', msg: `Found and selected ${modelName}` });
      } else {
         throw new Error("No models found");
      }
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Discovery failed: ${err.message}` });
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
        <button
          onClick={handleSave}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors shadow-md"
        >
          <Save size={18} /> Save Settings
        </button>
      </div>

      {status.type && (
        <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
          status.type === 'success' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 
          status.type === 'error' ? 'bg-red-500/20 text-red-400 border border-red-500/50' :
          'bg-slate-500/20 text-slate-400 border border-slate-500/50'
        }`}>
          {status.type === 'success' && <CheckCircle2 size={20} />}
          {status.type === 'error' && <XCircle size={20} />}
          {status.type === 'loading' && <RefreshCw size={20} className="animate-spin" />}
          <span>{status.msg}</span>
        </div>
      )}

      <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-4 text-slate-100">AI Provider</h2>
        <div className="flex gap-4">
          <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
            localSettings.provider === 'gemini' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1a233a] hover:border-blue-500/50 bg-[#101726]'
          }`}>
            <input 
              type="radio" 
              name="provider" 
              className="hidden"
              checked={localSettings.provider === 'gemini'}
              onChange={() => setLocalSettings({...localSettings, provider: 'gemini'})} 
            />
            <div className="font-medium text-lg">Google Gemini</div>
            <div className="text-slate-400 text-sm mt-1">Cloud-based, high performance</div>
          </label>
          <label className={`flex-1 p-4 rounded-xl border cursor-pointer transition-all ${
            localSettings.provider === 'ollama' ? 'border-blue-500 bg-blue-500/10' : 'border-[#1a233a] hover:border-blue-500/50 bg-[#101726]'
          }`}>
            <input 
              type="radio" 
              name="provider" 
              className="hidden"
              checked={localSettings.provider === 'ollama'}
              onChange={() => setLocalSettings({...localSettings, provider: 'ollama'})} 
            />
            <div className="font-medium text-lg">Ollama (Local)</div>
            <div className="text-slate-400 text-sm mt-1">Local models, private</div>
          </label>
        </div>
      </div>

      {localSettings.provider === 'gemini' && (
        <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Gemini Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
              <input 
                type="password" 
                value={localSettings.geminiKey}
                onChange={e => setLocalSettings({...localSettings, geminiKey: e.target.value})}
                className="w-full bg-[#101726] border border-[#1a233a] rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="AIzaSy..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model</label>
              <select 
                value={localSettings.geminiModel}
                onChange={e => setLocalSettings({...localSettings, geminiModel: e.target.value})}
                className="w-full bg-[#101726] border border-[#1a233a] rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
              </select>
            </div>
          </div>
          <button 
            onClick={testConnection}
            className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Test Connection
          </button>
        </div>
      )}

      {localSettings.provider === 'ollama' && (
        <div className="bg-[#0a0f1c] border border-[#1a233a] rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4 text-slate-100">Ollama Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Base URL</label>
              <input 
                type="text" 
                value={localSettings.ollamaBaseUrl}
                onChange={e => setLocalSettings({...localSettings, ollamaBaseUrl: e.target.value})}
                className="w-full bg-[#101726] border border-[#1a233a] rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="http://localhost:11434"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Model Name</label>
              <div className="flex gap-2">
                <input 
                  type="text" 
                  value={localSettings.ollamaModel}
                  onChange={e => setLocalSettings({...localSettings, ollamaModel: e.target.value})}
                  className="flex-1 bg-[#101726] border border-[#1a233a] rounded-lg px-4 py-3 text-slate-100 focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="e.g. llama3, mistral"
                />
                <button 
                  onClick={autoDiscoverOllama}
                  className="bg-[#1a233a] hover:bg-[#23304c] border border-[#2a3858] px-4 py-3 rounded-lg transition-colors font-medium text-slate-200"
                >
                  Auto-Discover
                </button>
              </div>
            </div>
          </div>
          <button 
            onClick={testConnection}
            className="mt-6 text-sm text-blue-400 hover:text-blue-300 transition-colors"
          >
            Test Connection
          </button>
        </div>
      )}

    </div>
  );
};

export default Settings;
