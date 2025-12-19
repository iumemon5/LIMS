
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
import Instruments from './components/Instruments';
import { Settings as SettingsIcon, FlaskConical, Lock, ChevronRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { LabProvider, useLab } from './contexts/LabContext';

const ProtectedApp: React.FC = () => {
  const { user, login, users } = useLab();
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
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
         <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="h-32 bg-[#005c97] flex flex-col items-center justify-center relative overflow-hidden">
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-white mb-2 shadow-inner">
                  <FlaskConical size={24} />
               </div>
               <h1 className="text-white font-black text-xl tracking-tight italic">M-Solutions LIMS</h1>
               <p className="text-blue-100 text-xs font-bold uppercase tracking-widest opacity-80">Secure Access Gateway</p>
            </div>
            
            <form onSubmit={handleLogin} className="p-8">
               <div className="mb-6">
                  <h2 className="text-xl font-bold text-slate-900">Welcome Back</h2>
                  <p className="text-slate-500 text-sm">Please sign in to access your laboratory workspace.</p>
               </div>
               
               {error && (
                 <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg flex items-center gap-2 text-sm text-red-600 font-bold animate-in slide-in-from-top-2">
                    <AlertCircle size={16} />
                    {error}
                 </div>
               )}

               <div className="space-y-4">
                  <div className="space-y-1">
                     <label className="text-xs font-black text-slate-500 uppercase">Email Address</label>
                     {/* User Selector for Demo Convenience (still requires password) */}
                     <div className="relative">
                        <select 
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#005c97] outline-none appearance-none"
                           value={email}
                           onChange={e => setEmail(e.target.value)}
                        >
                           {users.map(u => (
                              <option key={u.id} value={u.email}>{u.name} ({u.role})</option>
                           ))}
                        </select>
                        <ChevronRight className="absolute right-4 top-3.5 text-slate-400 rotate-90" size={16} />
                     </div>
                  </div>

                  <div className="space-y-1">
                     <div className="flex justify-between">
                        <label className="text-xs font-black text-slate-500 uppercase">Password</label>
                        <span className="text-[10px] text-slate-400">Default: admin123</span>
                     </div>
                     <div className="relative">
                        <input 
                           type={showPassword ? 'text' : 'password'}
                           className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-[#005c97] outline-none"
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                           placeholder="Enter your password"
                        />
                        <button 
                           type="button"
                           onClick={() => setShowPassword(!showPassword)}
                           className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600"
                        >
                           {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                  </div>

                  <button 
                     disabled={isAnimating}
                     className="w-full bg-[#005c97] hover:bg-blue-800 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                     {isAnimating ? (
                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     ) : (
                        <>
                           <Lock size={16} /> Secure Login
                        </>
                     )}
                  </button>
               </div>

               <div className="mt-8 text-center">
                  <p className="text-xs text-slate-400 font-medium">Protected by ISO 27001 Security Standards.</p>
                  <p className="text-[10px] text-slate-300 mt-1">v1.0.1 (Build 2025.11)</p>
               </div>
            </form>
         </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard onNavigate={setActiveTab} />;
      case 'accessioning': return <Accessioning />;
      case 'samples': return <SampleList />;
      case 'patients': return <PatientManagement />;
      case 'departments': return <Departments />;
      case 'clients': return <ClientList />;
      case 'billing': return <Billing />;
      case 'quality': return <Compliance />;
      case 'reports': return <Reports />;
      case 'inventory': return <Inventory />;
      case 'worksheets': return <Worksheets />;
      case 'instruments': return <Instruments />;
      case 'settings': return <Settings />;
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
