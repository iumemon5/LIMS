import React, { useState } from 'react';
import { Sparkles, ArrowUp, Loader2 } from 'lucide-react';
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

  const handleChipClick = (text: string) => {
      setQuery(text);
      // Optional: Auto submit or let user click send
  };

  // Simple Markdown Parser
  const renderFormattedText = (text: string) => {
    return text.split('\n').map((line, lineIndex) => {
      const isList = line.trim().startsWith('* ') || line.trim().startsWith('- ');
      const cleanLine = isList ? line.trim().substring(2) : line;
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
      return <p key={lineIndex} className={`text-sm text-slate-700 leading-relaxed ${line.trim() === '' ? 'h-2' : 'mb-2'}`}>{content}</p>;
    });
  };

  return (
    <div className="bg-indigo-50/50 p-6 rounded-xl border border-indigo-100 shadow-sm flex flex-col h-[300px]">
      <div className="flex items-center gap-2 mb-3 text-indigo-700">
        <div className="p-1 bg-indigo-100 rounded">
          <Sparkles size={16} />
        </div>
        <h3 className="text-sm font-bold uppercase tracking-wide">Lab Intelligence Assistant</h3>
      </div>
      
      {!answer ? (
        <>
            <div className="space-y-2 mb-6">
                <p className="text-sm text-slate-600">Ask specific questions to generate reports or find bottlenecks.</p>
            </div>
            
            <form onSubmit={handleAsk} className="relative group mb-4">
                <input
                aria-label="Ask Lab Intelligence"
                className="w-full h-12 pl-4 pr-14 rounded-lg border border-indigo-200 bg-white shadow-sm text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
                placeholder="E.g., 'Show me overdue haematology samples'"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                />
                <button 
                  type="submit"
                  disabled={loading}
                  aria-label="Send Query" 
                  className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500 flex items-center justify-center disabled:opacity-70"
                >
                  {loading ? <Loader2 size={18} className="animate-spin"/> : <ArrowUp size={20} />}
                </button>
            </form>

            <div className="flex gap-2 mt-auto flex-wrap">
                <button type="button" onClick={() => handleChipClick("Revenue today?")} className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors font-medium">
                    Revenue today?
                </button>
                <button type="button" onClick={() => handleChipClick("Pending Validations")} className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors font-medium">
                    Pending Validations
                </button>
                <button type="button" onClick={() => handleChipClick("Critical alerts log")} className="text-xs bg-white border border-indigo-100 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-50 hover:border-indigo-200 transition-colors font-medium">
                    Critical alerts log
                </button>
            </div>
        </>
      ) : (
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
             <div className="bg-white border border-indigo-100 rounded-xl p-4 shadow-sm animate-in fade-in slide-in-from-bottom-2">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-indigo-500 uppercase">AI Response</span>
                    <button onClick={() => setAnswer(null)} className="text-xs font-bold text-slate-400 hover:text-indigo-600">New Search</button>
                </div>
                {renderFormattedText(answer)}
             </div>
          </div>
      )}
    </div>
  );
};

export default LabInsights;