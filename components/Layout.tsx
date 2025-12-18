
import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  LayoutDashboard, 
  FlaskConical, 
  Users, 
  FileText, 
  Settings, 
  Bell, 
  Search,
  ChevronRight,
  Database,
  HeartPulse,
  CreditCard,
  ShieldCheck,
  MessageSquare,
  Plus,
  Terminal,
  FileSpreadsheet,
  Server,
  LogOut,
  Microscope,
  CheckCircle2,
  AlertTriangle,
  Info
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { settings, user, logout, patients, requests } = useLab();
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const notifRef = useRef<HTMLDivElement>(null);

  // Mock Notifications (Stateful)
  const [notifications, setNotifications] = useState([
      { id: 1, title: 'System Backup Complete', time: '10 mins ago', type: 'info', icon: <CheckCircle2 size={16} className="text-green-500"/> },
      { id: 2, title: 'Reagent Low: Glucose', time: '1 hour ago', type: 'warning', icon: <AlertTriangle size={16} className="text-orange-500"/> },
      { id: 3, title: 'New Protocol v2.1', time: '2 hours ago', type: 'info', icon: <Info size={16} className="text-blue-500"/> },
  ]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'accessioning', label: 'Accessioning [F12]', icon: <FlaskConical size={20} /> },
    { id: 'samples', label: 'Lab Workbench', icon: <Microscope size={20} /> },
    { id: 'worksheets', label: 'Worksheets & Batches', icon: <FileSpreadsheet size={20} /> },
    { id: 'patients', label: 'Patients [F11]', icon: <HeartPulse size={20} /> },
    { id: 'departments', label: 'Dept. & Tests', icon: <LayersIcon size={20} /> },
    { id: 'clients', label: 'Referrers', icon: <Users size={20} /> },
    { id: 'instruments', label: 'Analyzers', icon: <Server size={20} /> },
    { id: 'billing', label: 'Billing & Fees', icon: <CreditCard size={20} /> },
    { id: 'reports', label: 'Summary Reports', icon: <FileText size={20} /> },
    { id: 'quality', label: 'Compliance & Audit', icon: <ShieldCheck size={20} /> },
    { id: 'inventory', label: 'Inventory', icon: <Database size={20} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      // Global Search: Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette((open) => !open);
        setSearchQuery('');
      }

      // Escape to close command palette
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }

      // F11: Patients
      if (e.key === 'F11') {
          e.preventDefault();
          setActiveTab('patients');
      }

      // F12: Accessioning
      if (e.key === 'F12') {
          e.preventDefault();
          setActiveTab('accessioning');
      }
    };
    
    const clickOutside = (e: MouseEvent) => {
        if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
            setShowNotifications(false);
        }
    };

    document.addEventListener('keydown', down);
    document.addEventListener('mousedown', clickOutside);
    return () => {
        document.removeEventListener('keydown', down);
        document.removeEventListener('mousedown', clickOutside);
    };
  }, [setActiveTab]);

  const getInitials = (name: string) => {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const handleMarkAllRead = () => {
      setNotifications([]);
      setShowNotifications(false);
  };

  // Search Indexer
  const filteredResults = useMemo(() => {
      if (!searchQuery) return [];
      const term = searchQuery.toLowerCase();
      
      const patResults = patients
          .filter(p => p.firstName.toLowerCase().includes(term) || p.lastName.toLowerCase().includes(term) || p.mrn.toLowerCase().includes(term))
          .map(p => ({
              id: p.id,
              type: 'Patient',
              title: `${p.firstName} ${p.lastName}`,
              subtitle: p.mrn,
              icon: <HeartPulse size={16} />,
              action: () => setActiveTab('patients')
          })).slice(0, 3);

      const reqResults = requests
          .filter(r => r.id.toLowerCase().includes(term))
          .map(r => ({
              id: r.id,
              type: 'Request',
              title: r.id,
              subtitle: `Status: ${r.status}`,
              icon: <Microscope size={16} />,
              action: () => setActiveTab('accessioning') // Ideally deep link, but module nav for now
          })).slice(0, 3);

      const navResults = menuItems
          .filter(m => m.label.toLowerCase().includes(term))
          .map(m => ({
              id: m.id,
              type: 'Navigation',
              title: m.label,
              subtitle: 'Go to module',
              icon: m.icon,
              action: () => setActiveTab(m.id)
          }));

      return [...navResults, ...patResults, ...reqResults];
  }, [searchQuery, patients, requests]);

  return (
    <div className="flex h-screen overflow-hidden text-slate-700 bg-slate-50">
      <aside className="w-64 bg-white border-r border-slate-300 flex flex-col hidden md:flex shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-[#005c97] p-2 rounded-lg shadow-lg">
            <FlaskConical className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="font-black text-lg tracking-tighter text-slate-900 italic leading-tight">{settings.name || 'M-Solutions'}</span>
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">AI powered LIMS</span>
          </div>
        </div>

        <nav className="flex-1 mt-2 overflow-y-auto custom-scrollbar">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-6 py-3.5 text-sm font-semibold transition-all hover:bg-slate-50 ${
                activeTab === item.id ? 'bg-[#f0f9ff] text-[#005c97] border-r-4 border-[#005c97]' : 'text-slate-500'
              }`}
            >
              <div className={`${activeTab === item.id ? 'text-[#005c97]' : 'text-slate-400'}`}>
                {item.icon}
              </div>
              {item.label}
              {activeTab === item.id && <ChevronRight size={14} className="ml-auto opacity-50" />}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#005c97] flex items-center justify-center text-white font-black shadow-lg">
              {user ? getInitials(user.name) : '??'}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-black text-slate-900 truncate">{user?.name || 'Guest'}</p>
              <div className="flex items-center gap-1">
                 <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tight">{user?.role || 'Session Active'}</p>
              </div>
            </div>
            <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <header className="h-14 bg-white border-b border-slate-300 flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
          <div className="relative w-96 max-w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <button 
              onClick={() => { setShowCommandPalette(true); setSearchQuery(''); }}
              className="w-full bg-slate-100 border border-slate-200 rounded-lg py-1.5 pl-9 pr-4 text-xs text-left text-slate-500 focus:ring-2 focus:ring-[#005c97] outline-none transition-all shadow-inner flex justify-between items-center"
            >
              <span>Search patients or run commands...</span>
              <div className="flex items-center gap-1">
                <kbd className="hidden sm:inline-block px-1.5 font-mono text-[10px] font-bold text-slate-500 bg-white border border-slate-300 rounded shadow-sm">Ctrl K</kbd>
              </div>
            </button>
          </div>
          <div className="flex items-center gap-3">
            <a 
              href="https://wa.me/?text=Hi%2C%20I%20need%20technical%20support%20for%20M-Solutions%20LIMS."
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 text-xs font-bold hover:bg-green-100 transition-colors"
            >
               <MessageSquare size={14} /> WhatsApp Integrated
            </a>
            <div className="relative" ref={notifRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100'}`}
                >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                        <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-600 rounded-full border-2 border-white"></span>
                    )}
                </button>
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <span className="text-xs font-bold text-slate-700 uppercase">Notifications</span>
                            <button 
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                            >
                                Mark all read
                            </button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-6 text-center text-slate-400 text-xs font-medium">No new notifications</div>
                            ) : (
                                notifications.map(n => (
                                    <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 transition-colors flex gap-3">
                                        <div className="mt-1">{n.icon}</div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800">{n.title}</p>
                                            <p className="text-xs text-slate-500">{n.time}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            <div className="h-6 w-[1px] bg-slate-300 mx-1"></div>
            <button 
              onClick={() => setActiveTab('accessioning')}
              className="bg-[#005c97] text-white px-5 py-2 rounded-lg text-xs font-black shadow-md hover:bg-blue-800 hover:shadow-lg transition-all active:scale-95 flex items-center gap-2 uppercase tracking-tight"
            >
              <Plus size={16} /> New Registration
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative custom-scrollbar">
          {children}
        </div>

        {/* Command Palette Modal */}
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[20vh]" onClick={() => setShowCommandPalette(false)}>
            <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3">
                <Terminal className="text-slate-400" size={20} />
                <input 
                  autoFocus 
                  className="flex-1 outline-none text-slate-700 placeholder:text-slate-400 font-medium" 
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button 
                    onClick={() => setShowCommandPalette(false)}
                    className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors cursor-pointer"
                >
                    ESC
                </button>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto">
                {searchQuery === '' ? (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Quick Navigation</div>
                        {menuItems.slice(0, 5).map(item => (
                        <button 
                            key={item.id} 
                            onClick={() => { setActiveTab(item.id); setShowCommandPalette(false); }}
                            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors"
                        >
                            {item.icon}
                            <span>Go to {item.label}</span>
                        </button>
                        ))}
                    </>
                ) : (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Search Results</div>
                        {filteredResults.length === 0 ? (
                             <div className="px-3 py-4 text-center text-sm text-slate-400">No results found</div>
                        ) : (
                            filteredResults.map((item, i) => (
                                <button 
                                    key={`${item.type}-${item.id}`} 
                                    onClick={() => { item.action(); setShowCommandPalette(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-colors group"
                                >
                                    <div className="text-slate-400 group-hover:text-blue-500">{item.icon}</div>
                                    <div className="text-left flex-1">
                                        <div className="font-bold text-slate-700 group-hover:text-blue-700">{item.title}</div>
                                        <div className="text-[10px] text-slate-400">{item.type} · {item.subtitle}</div>
                                    </div>
                                    <div className="text-[10px] font-bold text-slate-300 group-hover:text-blue-400">Jump</div>
                                </button>
                            ))
                        )}
                    </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// Icon Helper for Departments
const LayersIcon = ({ size }: { size: number }) => (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <polygon points="12 2 2 7 12 12 22 7 12 2" />
      <polyline points="2 17 12 22 22 17" />
      <polyline points="2 12 12 17 22 12" />
    </svg>
);

export default Layout;
