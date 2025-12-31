import React from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { TestDefinition } from '../types';
import { formatCurrency } from '../utils/formatters';

interface TestSelectorProps {
    testSearch: string;
    setTestSearch: (term: string) => void;
    filteredTests: TestDefinition[];
    activeTestIndex: number;
    setActiveTestIndex: (index: number | ((prev: number) => number)) => void;
    handleAddTest: (test: TestDefinition) => void;
    selectedTests: TestDefinition[];
    handleRemoveTest: (code: string) => void;
    inputRef: React.RefObject<HTMLInputElement>;
}

const TestSelector: React.FC<TestSelectorProps> = ({
    testSearch,
    setTestSearch,
    filteredTests,
    activeTestIndex,
    setActiveTestIndex,
    handleAddTest,
    selectedTests,
    handleRemoveTest,
    inputRef
}) => {
    return (
        <div className="flex-1 p-8 bg-slate-50 flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-xs font-bold">2</span>
                    Analysis Request
                </h2>
                <span className="text-xs font-medium text-slate-500">{selectedTests.length} items selected</span>
            </div>

            <div className="relative mb-6">
                <Search className="absolute left-3 top-3.5 text-slate-400" size={18} />
                <input
                    ref={inputRef}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-medium"
                    placeholder="Search test name, code or department..."
                    value={testSearch}
                    onChange={(e) => setTestSearch(e.target.value)}
                    onKeyDown={(e) => {
                        if (filteredTests.length === 0) return;

                        if (e.key === 'ArrowDown') {
                            e.preventDefault();
                            setActiveTestIndex(prev => prev < filteredTests.length - 1 ? prev + 1 : prev);
                        } else if (e.key === 'ArrowUp') {
                            e.preventDefault();
                            setActiveTestIndex(prev => prev > 0 ? prev - 1 : 0);
                        } else if (e.key === 'Enter' && activeTestIndex >= 0) {
                            e.preventDefault();
                            const t = filteredTests[activeTestIndex];
                            if (t) {
                                handleAddTest(t);
                                setTestSearch(''); // Input clears, focus remains
                                setActiveTestIndex(-1);
                            }
                        }
                    }}
                />

                {/* Search Dropdown */}
                {testSearch && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-slate-100 z-40 max-h-64 overflow-y-auto">
                        {filteredTests.map((test, idx) => (
                            <button
                                key={test.code}
                                onClick={() => handleAddTest(test)}
                                className={`w-full text-left px-4 py-3 flex items-center justify-between border-b border-slate-50 group ${idx === activeTestIndex ? 'bg-blue-50 ring-1 ring-inset ring-blue-200' : 'hover:bg-blue-50'
                                    }`}
                            >
                                <div>
                                    <p className="font-bold text-slate-900">{test.name}</p>
                                    <p className="text-xs text-slate-500 font-mono group-hover:text-blue-600">{test.code}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="text-sm font-bold text-slate-700">{formatCurrency(test.price)}</span>
                                    <Plus size={16} className="text-blue-600" />
                                </div>
                            </button>
                        ))}
                        {filteredTests.length === 0 && (
                            <div className="p-4 text-center text-sm text-slate-500">No tests found matching "{testSearch}"</div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected Tests List */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                {selectedTests.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                        <Search size={32} className="mb-2 opacity-50" />
                        <p className="text-sm font-medium">Search and add tests to build the request</p>
                    </div>
                ) : (
                    selectedTests.map((test, index) => (
                        <div key={`${test.code}-${index}`} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm group hover:border-blue-300 transition-all">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 font-mono">
                                    {test.code}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900">{test.name}</p>
                                    <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Dept: {test.departmentId}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="text-sm font-bold text-slate-700">{formatCurrency(test.price)}</span>
                                <button
                                    onClick={() => handleRemoveTest(test.code)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded transition-all"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TestSelector;
