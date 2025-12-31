import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Accessioning from './components/Accessioning';
import PatientManagement from './components/PatientManagement';
import ClientList from './components/ClientList';
import Billing from './components/Billing';
import Compliance from './components/Compliance';
import Departments from './components/Departments';
import Reports from './components/Reports';
import SampleList from './components/SampleList';
import Inventory from './components/Inventory';
import Worksheets from './components/Worksheets';
import Settings from './components/Settings';
import { DataBackup } from './components/DataBackup';
import {
    Settings as SettingsIcon,
    FlaskConical,
    Lock,
    Eye,
    EyeOff,
    User as UserIcon,
    ShieldCheck,
    CheckCircle2,
    AlertCircle,
    ArrowRight
} from 'lucide-react';
import { LabProvider, useLab } from './contexts/LabContext';

const ProtectedApp: React.FC = () => {
    const { user, login } = useLab();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [email, setEmail] = useState('admin@msolutions.pk');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // If no user is logged in, show Login Screen
    if (!user) {
        const handleLogin = (e: React.FormEvent) => {
            e.preventDefault();
            setIsAnimating(true);
            setError('');

            // Simulate network delay for effect
            setTimeout(() => {
                const success = login(email, password);
                if (success) {
                    setIsAnimating(false);
                } else {
                    setError('Invalid email or password.');
                    setIsAnimating(false);
                }
            }, 800);
        };

        return (
            <div className="flex min-h-screen w-full overflow-hidden bg-slate-50 font-sans">
                {/* Left Pane: Visual & Branding (Hidden on mobile) */}
                <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-end p-16 overflow-hidden bg-slate-900">
                    {/* Background Image */}
                    <div
                        className="absolute inset-0 z-0 bg-cover bg-center transition-transform duration-[20s] hover:scale-110"
                        style={{
                            backgroundImage: "url('https://images.unsplash.com/photo-1579165466741-7f35a4755657?auto=format&fit=crop&q=80&w=2000')",
                            opacity: 0.4
                        }}
                    ></div>

                    {/* Overlay Gradient */}
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-slate-900/60 to-[#005c97]/30 mix-blend-multiply"></div>
                    <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>

                    {/* Content */}
                    <div className="relative z-20 max-w-lg animate-in slide-in-from-bottom-8 duration-700">
                        <div className="mb-6 flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-xl">
                                <FlaskConical size={24} />
                            </div>
                            <span className="text-white font-black text-2xl tracking-tight italic">M-Solutions</span>
                        </div>
                        <h1 className="text-white text-5xl font-extrabold leading-tight tracking-tight mb-6">
                            Precision in every<br />
                            <span className="text-blue-400">data point.</span>
                        </h1>
                        <p className="text-slate-300 text-lg leading-relaxed max-w-md font-medium">
                            Securely manage patient data, automate workflows, and ensure compliance with our AI-powered laboratory information system.
                        </p>
                        <div className="mt-8 flex items-center gap-4 text-sm font-bold text-slate-400">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span>ISO 15189 Compliant</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={16} className="text-emerald-500" />
                                <span>99.9% Uptime</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Pane: Login Form */}
                <div className="w-full lg:w-1/2 flex flex-col relative bg-white overflow-y-auto">
                    {/* Top Bar: Status Chip */}
                    <div className="absolute top-0 right-0 p-6 sm:p-8 flex justify-end w-full z-10">
                        <div className="flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full bg-emerald-50 pl-3 pr-4 border border-emerald-100 shadow-sm animate-in fade-in duration-1000">
                            <div className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                            </div>
                            <p className="text-emerald-700 text-xs font-bold uppercase tracking-wide">System Operational</p>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="flex-1 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24">
                        <div className="w-full max-w-sm space-y-8 animate-in zoom-in-95 duration-500">
                            {/* Header */}
                            <div className="space-y-2">
                                <div className="lg:hidden flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white mb-6 shadow-lg shadow-blue-200">
                                    <FlaskConical size={24} />
                                </div>
                                <h2 className="text-slate-900 tracking-tight text-3xl font-black leading-tight">
                                    Sign in to LIMS
                                </h2>
                                <p className="text-slate-500 text-base font-medium">
                                    Please enter your credentials to access the workspace.
                                </p>
                            </div>

                            {/* Error Message */}
                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 animate-in slide-in-from-top-2">
                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                    <div className="text-sm font-bold">{error}</div>
                                </div>
                            )}

                            {/* Form */}
                            <form onSubmit={handleLogin} className="space-y-5">
                                {/* Email Field */}
                                <div className="space-y-1.5">
                                    <label className="text-slate-700 text-xs font-bold uppercase tracking-wider ml-1">
                                        Employee ID / Email
                                    </label>
                                    <div className="relative group">
                                        <input
                                            className="form-input flex w-full rounded-xl text-slate-900 bg-slate-50 border-slate-200 h-12 pl-4 pr-10 text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none"
                                            placeholder="e.g. user@labworks.com"
                                            type="text"
                                            value={email}
                                            onChange={e => setEmail(e.target.value)}
                                            disabled={isAnimating}
                                        />
                                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                                            <UserIcon size={18} />
                                        </div>
                                    </div>
                                </div>

                                {/* Password Field */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between items-center ml-1">
                                        <label className="text-slate-700 text-xs font-bold uppercase tracking-wider">
                                            Password
                                        </label>
                                        <a href="#" className="text-blue-600 text-xs font-bold hover:text-blue-700 hover:underline transition-colors">
                                            Forgot Password?
                                        </a>
                                    </div>
                                    <div className="relative group">
                                        <input
                                            className="form-input flex w-full rounded-xl text-slate-900 bg-slate-50 border-slate-200 h-12 pl-4 pr-10 text-sm font-bold placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 outline-none"
                                            placeholder="••••••••"
                                            type={showPassword ? 'text' : 'password'}
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            disabled={isAnimating}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer transition-colors outline-none"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Login Button */}
                                <button
                                    disabled={isAnimating}
                                    className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-lg shadow-blue-200 hover:shadow-blue-300 transition-all duration-200 flex items-center justify-center gap-2 group active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                                >
                                    {isAnimating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <Lock size={16} className="group-hover:scale-110 transition-transform" />
                                            Secure Login
                                            <ArrowRight size={16} className="opacity-0 -translate-x-2 group-hover:translate-x-0 group-hover:opacity-100 transition-all" />
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Footer */}
                            <div className="pt-6 text-center space-y-6">
                                <p className="text-slate-500 text-sm">
                                    Don't have an account?
                                    <a href="#" className="text-blue-600 font-bold hover:underline ml-1">Request Access</a>
                                </p>
                                <div className="flex items-center justify-center gap-2 text-xs text-slate-400 font-medium bg-slate-50 py-2 rounded-lg">
                                    <ShieldCheck size={14} />
                                    <span>Protected by 256-bit SSL encryption</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Footer Gradient */}
                    <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 lg:hidden"></div>
                </div>
            </div>
        );
    }

    const renderContent = () => {
        // Simple Access Control Check
        const isAdmin = user?.role === 'Super Admin';
        const isManager = isAdmin || user?.role === 'Pathologist';

        switch (activeTab) {
            case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
            case 'accessioning': return <Accessioning />;
            case 'samples': return <SampleList />;
            case 'patients': return <PatientManagement />;
            case 'departments':
                if (!isAdmin) return <AccessDenied />;
                return <Departments />;
            case 'clients': return <ClientList />;
            case 'billing': return <Billing />;
            case 'quality': return <Compliance />;
            case 'reports': return <Reports />;
            case 'inventory':
                if (!isManager) return <AccessDenied />;
                return <Inventory />;
            case 'worksheets': return <Worksheets />;
            case 'settings':
                if (!isAdmin) return <AccessDenied />;
                return (
                    <div className="max-w-2xl mx-auto space-y-6">
                        <h2 className="text-2xl font-black text-slate-800">System Settings</h2>
                        <DataBackup />
                        <Settings />
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
                            <SettingsIcon size={40} />
                        </div>
                        <h2 className="text-xl font-bold text-slate-900">{activeTab.toUpperCase()} Module</h2>
                        <p className="text-slate-500 max-w-md">Module under development.</p>
                    </div>
                );
        }
    };

    // Simple Access Denied Component
    const AccessDenied = () => (
        <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-6 animate-in fade-in zoom-in-95">
            <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center shadow-inner">
                <Lock size={48} strokeWidth={1.5} />
            </div>
            <div className="space-y-2">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
                <p className="text-slate-500 max-w-sm font-medium">
                    You do not have the required permissions to access this administrative module.
                    Please contact your system administrator.
                </p>
            </div>
            <button
                onClick={() => setActiveTab('dashboard')}
                className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-sm shadow-lg hover:bg-slate-800 transition-all active:scale-95"
            >
                Return to Dashboard
            </button>
        </div>
    );

    return (
        <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
            {renderContent()}
        </Layout>
    );
};

const App: React.FC = () => {
    return (
        <LabProvider>
            <ProtectedApp />
        </LabProvider>
    );
};

export default App;