import React from 'react';
import { X, Keyboard, Command, CornerDownLeft, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

const ShortcutsHelp: React.FC<Props> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    const sections = [
        {
            title: 'Global Navigation',
            shortcuts: [
                { keys: ['F1'], description: 'Go to Accessioning' },
                { keys: ['F2'], description: 'Go to Lab Workbench' },
                { keys: ['F4'], description: 'Go to Patient Directory' },
                { keys: ['Alt', 'D'], description: 'Go to Dashboard' },
                { keys: ['Ctrl', 'K'], description: 'Open Search / Command Palette' },
                { keys: ['?'], description: 'Show this Help functionality' },
            ]
        },
        {
            title: 'Data Entry (Accessioning)',
            shortcuts: [
                { keys: ['Alt', 'N'], description: 'Quick New Patient Modal' },
                { keys: ['↑', '↓'], description: 'Navigate Dropdowns' },
                { keys: ['Enter'], description: 'Select / Add Item' },
                { keys: ['Ctrl', 'Enter'], description: 'Save & Generate Bill' },
                { keys: ['Esc'], description: 'Close Modals' },
            ]
        }
    ];

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                            <Keyboard size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-xl text-slate-900">Keyboard Shortcuts</h3>
                            <p className="text-sm text-slate-500">Master the LIMS with these hotkeys</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 bg-white max-h-[70vh] overflow-y-auto">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">
                                {section.title}
                            </h4>
                            <div className="space-y-3">
                                {section.shortcuts.map((shortcut, sIdx) => (
                                    <div key={sIdx} className="flex items-center justify-between group">
                                        <span className="text-sm font-medium text-slate-600 group-hover:text-slate-900 transition-colors">
                                            {shortcut.description}
                                        </span>
                                        <div className="flex items-center gap-1">
                                            {shortcut.keys.map((key, kIdx) => (
                                                <kbd
                                                    key={kIdx}
                                                    className="min-w-[24px] h-7 px-2 flex items-center justify-center bg-slate-100 border-b-2 border-slate-300 rounded text-xs font-bold text-slate-700 font-mono shadow-sm"
                                                >
                                                    {key}
                                                </kbd>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-500 font-medium">
                    Note: Shortcuts may vary slightly depending on your operating system (macOS/Windows).
                </div>
            </div>
        </div>
    );
};

export default ShortcutsHelp;
