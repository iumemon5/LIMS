import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle2, FileJson, RefreshCw } from 'lucide-react';

export const DataBackup: React.FC = () => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const getBackupData = () => {
        const keys = [
            'lims_patients_cache',
            'lims_requests_cache',
            'lims_inventory_cache',
            'lims_sync_queue',
            'lims_audit_logs_cache',
            'lims_clients',
            'lims_departments',
            'lims_worksheets',
            'lims_instruments',
            'lims_settings'
        ];

        const backup: Record<string, any> = {
            meta: {
                timestamp: new Date().toISOString(),
                version: '2.0',
                app: 'LIMS_OFFLINE_BACKUP'
            },
            data: {}
        };

        keys.forEach(key => {
            const val = localStorage.getItem(key);
            if (val) {
                try {
                    backup.data[key] = JSON.parse(val);
                } catch (e) {
                    backup.data[key] = val;
                }
            }
        });

        return backup;
    };

    const handleExport = () => {
        try {
            const data = getBackupData();
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `lims_backup_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setStatus('success');
            setMessage('Backup file downloaded successfully.');
            setTimeout(() => setStatus('idle'), 3000);
        } catch (err) {
            console.error(err);
            setStatus('error');
            setMessage('Failed to generate backup.');
        }
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const json = JSON.parse(event.target?.result as string);
                if (!json.meta || json.meta.app !== 'LIMS_OFFLINE_BACKUP') {
                    throw new Error("Invalid backup file format.");
                }

                if (!window.confirm(`Restore data from ${json.meta.timestamp}? This will OVERWRITE local data.`)) {
                    return;
                }

                // Restore
                Object.keys(json.data).forEach(key => {
                    localStorage.setItem(key, JSON.stringify(json.data[key]));
                });

                setStatus('success');
                setMessage('Data restored. Reloading...');
                setTimeout(() => window.location.reload(), 1500);

            } catch (err) {
                console.error(err);
                setStatus('error');
                setMessage('Invalid file or corrupt data.');
            }
        };
        reader.readAsText(file);
        e.target.value = ''; // Reset input
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
                <FileJson className="text-blue-600" size={24} />
                Offline Backup & Restore
            </h3>
            <p className="text-sm text-slate-500 mb-6">
                Save your data to a file to prevent loss if browser history is cleared.
                This is crucial for long-term offline usage.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <button
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 bg-blue-50 text-blue-700 hover:bg-blue-100 px-4 py-3 rounded-xl border border-blue-200 font-bold transition-colors"
                >
                    <Download size={20} />
                    Download Backup
                </button>

                <div className="relative flex-1">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept=".json"
                        className="hidden"
                    />
                    <button
                        onClick={handleImportClick}
                        className="w-full flex items-center justify-center gap-2 bg-slate-50 text-slate-700 hover:bg-slate-100 px-4 py-3 rounded-xl border border-slate-200 font-bold transition-colors"
                    >
                        <Upload size={20} />
                        Restore from File
                    </button>
                </div>
            </div>

            {status !== 'idle' && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-top-2 ${status === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                    }`}>
                    {status === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                    {message}
                </div>
            )}
        </div>
    );
};
