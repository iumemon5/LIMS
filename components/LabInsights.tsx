
import React, { useState } from 'react';
import { Sparkles, Send, Loader2 } from 'lucide-react';
import { getLabIntelligence } from '../services/geminiService';
import { useLab } from '../contexts/LabContext';

const LabInsights: React.FC = () => {
  const { requests, clients } = useLab();
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setAnswer(null);

    const labData = {
      requests: requests,
      clients: clients,
      statusBreakdown: requests.reduce((acc: any, req) => {
        acc[req.status] = (acc[req.status] || 0) + 1;
        return acc;
      }, {})
    };

    const result = await getLabIntelligence(query, labData);
    setAnswer(result || "No response received.");
    setLoading(false);
  };

  // Simple Markdown Parser to avoid heavy dependencies
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      const isList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = isList ? line.trim().substring(2) : line;
      
      // Parse Bold (**text**)
      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      
      const content = parts.map((part, partIndex) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={partIndex} className="font-bold text-indigo-900">{part.slice(2, -2)}</strong>;
        }
        return <span key={partIndex}>{part}</span>;
      });

      if (isList) {
        return (
          <div key={lineIndex} className="flex gap-2 mb-1 ml-2">
            <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div>
            <div className="text-sm text-slate-700 leading-relaxed">{content}</div>
          </div>
        );
      }

      return (
        <p key={lineIndex} className={`text-sm text-slate-700 leading-relaxed ${line.trim() === '' ? 'h-2' : 'mb-2'}`}>
          {content}
        </p>
      );
    });
  };

  return (
    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="text-indigo-600" size={20} />
        <h2 className="text-lg font-bold text-indigo-900">Lab Intelligence Assistant</h2>
      </div>
      
      <p className="text-sm text-indigo-700 mb-6">
        Ask about laboratory performance, sample bottlenecks, or general trends. 
        <span className="block mt-1 font-medium italic italic text-indigo-800">"What is the current status of my highest priority samples?"</span>
      </p>

      <form onSubmit={handleAsk} className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type your question here..."
          className="w-full bg-white border border-indigo-200 rounded-xl py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
        />
        <button
          type="submit"
          disabled={loading}
          className="absolute right-2 top-1/2 -translate-y-1/2 bg-indigo-600 text-white p-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-md"
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
        </button>
      </form>

      {answer && (
        <div className="bg-white border border-indigo-100 rounded-xl p-6 animate-in fade-in slide-in-from-top-4 duration-300 shadow-sm">
          <div className="flex gap-4">
            <div className="shrink-0 w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-sm mt-1">
              <Sparkles size={16} />
            </div>
            <div className="flex-1">
              {renderFormattedText(answer)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabInsights;
