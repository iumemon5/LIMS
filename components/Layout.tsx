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
  Info,
  Menu,
  PanelLeftClose,
  PanelLeft,
  Command,
  Inbox,
  Beaker,
  ClipboardCheck,
  Archive,
  Package,
  Receipt,
  BarChart3,
  Thermometer,
  Keyboard,
  CornerDownLeft
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [shortcutKey, setShortcutKey] = useState<string>('⌘');
  const notifRef = useRef<HTMLDivElement>(null);

  // Mock Notifications
  const [notifications, setNotifications] = useState([
      { id: 1, title: 'System Backup Complete', time: '10 mins ago', type: 'info', icon: <CheckCircle2 size={16} className="text-green-500"/> },
      { id: 2, title: 'Reagent Low: Glucose', time: '1 hour ago', type: 'warning', icon: <AlertTriangle size={16} className="text-orange-500"/> },
      { id: 3, title: 'New Protocol v2.1', time: '2 hours ago', type: 'info', icon: <Info size={16} className="text-blue-500"/> },
  ]);

  // Grouped Navigation Structure
  const navGroups = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} />, shortcut: 'G D' },
      ]
    },
    {
      title: 'Lab Operations',
      items: [
        { id: 'accessioning', label: 'Accessioning', icon: <FlaskConical size={20} />, shortcut: 'F1' },
        { id: 'samples', label: 'Lab Workbench', icon: <Microscope size={20} />, shortcut: 'F2' },
        { id: 'worksheets', label: 'Worksheets', icon: <FileSpreadsheet size={20} /> },
      ]
    },
    {
      title: 'Clinical Data',
      items: [
        { id: 'patients', label: 'Patients', icon: <Users size={20} />, shortcut: 'F4' },
        { id: 'clients', label: 'Referrers', icon: <HeartPulse size={20} /> },
      ]
    },
    {
      title: 'Administration',
      items: [
        { id: 'inventory', label: 'Inventory', icon: <Package size={20} /> },
        { id: 'billing', label: 'Billing & Invoices', icon: <Receipt size={20} /> },
        { id: 'departments', label: 'Dept. & Tests', icon: <Beaker size={20} /> },
        { id: 'instruments', label: 'Analyzers', icon: <Server size={20} /> },
        { id: 'reports', label: 'Reports', icon: <BarChart3 size={20} /> },
        { id: 'quality', label: 'Compliance', icon: <ShieldCheck size={20} /> },
        { id: 'settings', label: 'System Settings', icon: <Settings size={20} /> },
      ]
    }
  ];

  // Flat list for search
  const allMenuItems = navGroups.flatMap(g => g.items);

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
              action: () => setActiveTab('accessioning') 
          })).slice(0, 3);

      const navResults = allMenuItems
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
  }, [searchQuery, patients, requests, allMenuItems, setActiveTab]);

  useEffect(() => {
    // Detect Platform for Shortcut Hint
    if (typeof navigator !== 'undefined') {
        const isMac = navigator.platform.toLowerCase().includes('mac');
        setShortcutKey(isMac ? '⌘' : 'Ctrl');
    }

    const down = (e: KeyboardEvent) => {
      // Global Search: Cmd+K or Ctrl+K
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setShowCommandPalette((open) => !open);
        setSearchQuery('');
      }
      
      // Toggle Sidebar: Ctrl+B
      if (e.key === 'b' && (e.ctrlKey)) {
        e.preventDefault();
        setIsSidebarCollapsed(prev => !prev);
      }

      // Handle Result Selection Shortcuts (Alt + 1-5)
      if (showCommandPalette && e.altKey && /^[1-5]$/.test(e.key)) {
          e.preventDefault();
          const index = parseInt(e.key) - 1;
          
          if (searchQuery === '') {
              // Quick Nav Shortcuts
              const item = allMenuItems[index];
              if (item) {
                  setActiveTab(item.id);
                  setShowCommandPalette(false);
              }
          } else {
              // Filtered Results Shortcuts
              const item = filteredResults[index];
              if (item) {
                  item.action();
                  setShowCommandPalette(false);
              }
          }
      }

      if (e.key === 'Escape') setShowCommandPalette(false);
      if (e.key === 'F1') { e.preventDefault(); setActiveTab('accessioning'); }
      if (e.key === 'F2') { e.preventDefault(); setActiveTab('samples'); }
      if (e.key === 'F4') { e.preventDefault(); setActiveTab('patients'); }
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
  }, [activeTab, showCommandPalette, filteredResults, searchQuery, allMenuItems, setActiveTab]);

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const handleMarkAllRead = () => { setNotifications([]); setShowNotifications(false); };

  return (
    <div className="flex h-screen overflow-hidden text-slate-900 bg-slate-50 font-sans selection:bg-blue-100 selection:text-blue-700">
      
      {/* SIDEBAR */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-200 flex flex-col z-20 transition-all duration-300 relative group/sidebar shadow-sm`}>
        
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 shrink-0">
           <div 
             className={`flex items-center gap-3 overflow-hidden transition-all ${isSidebarCollapsed ? 'justify-center w-full cursor-pointer hover:bg-slate-50 py-2 rounded-lg' : ''}`}
             onClick={() => isSidebarCollapsed && setIsSidebarCollapsed(false)}
             title={isSidebarCollapsed ? "Click to Expand" : ""}
           >
             <div className="bg-blue-600 text-white p-1.5 rounded-lg shrink-0">
               <FlaskConical size={24} strokeWidth={2.5} />
             </div>
             {!isSidebarCollapsed && (
               <div className="flex flex-col">
                 <span className="text-lg font-black tracking-tight leading-none text-slate-900">LabFlow</span>
                 <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">LIMS v2.0</span>
               </div>
             )}
           </div>
           {!isSidebarCollapsed && (
             <button 
               onClick={() => setIsSidebarCollapsed(true)}
               className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
               title="Collapse Sidebar (Ctrl+B)"
             >
               <PanelLeftClose size={18} />
             </button>
           )}
        </div>

        {/* Sidebar Search */}
        {!isSidebarCollapsed && (
           <div className="px-3 pt-4 pb-2">
             <div className="relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
               <input 
                 className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:bg-white transition-all shadow-sm"
                 placeholder="Jump to section..."
                 onClick={() => setShowCommandPalette(true)}
                 readOnly
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                 <span className="text-[10px] text-slate-400 font-mono border border-slate-200 rounded px-1.5 bg-white">/</span>
               </div>
             </div>
           </div>
        )}

        {/* Navigation Items */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-6 custom-scrollbar">
          {navGroups.map((group, idx) => (
             <div key={idx} className="space-y-0.5">
               {!isSidebarCollapsed && (
                  <div className="px-3 mb-2 flex items-center justify-between">
                     <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.title}</span>
                  </div>
               )}
               {group.items.map(item => {
                 const isActive = activeTab === item.id;
                 return (
                   <button
                     key={item.id}
                     onClick={() => setActiveTab(item.id)}
                     title={isSidebarCollapsed ? item.label : undefined}
                     className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 group ${
                       isActive 
                         ? 'bg-blue-50 text-blue-700 font-bold shadow-sm' 
                         : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                     } ${isSidebarCollapsed ? 'justify-center' : ''}`}
                   >
                     <div className={`${isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}`}>
                       {item.icon}
                     </div>
                     {!isSidebarCollapsed && (
                       <>
                         <span className="text-sm flex-1 text-left">{item.label}</span>
                         {item.shortcut && (
                            <kbd className="hidden group-hover:block text-[10px] font-mono text-slate-400 border border-slate-200 rounded px-1.5 bg-white">
                               {item.shortcut}
                            </kbd>
                         )}
                       </>
                     )}
                   </button>
                 );
               })}
             </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <div className={`flex items-center gap-3 w-full p-2 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group ${isSidebarCollapsed ? 'justify-center' : ''}`}>
             <div className="h-9 w-9 rounded-lg bg-slate-800 text-white flex items-center justify-center text-sm font-bold shadow-sm ring-2 ring-slate-100">
               {user ? getInitials(user.name) : 'G'}
             </div>
             {!isSidebarCollapsed && (
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Guest'}</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide truncate">{user?.role || 'Online'}</p>
                  </div>
                </div>
             )}
             {!isSidebarCollapsed && (
                <button onClick={(e) => { e.stopPropagation(); logout(); }} className="text-slate-400 hover:text-red-500 transition-colors">
                  <LogOut size={16} />
                </button>
             )}
          </div>
          {isSidebarCollapsed && (
             <div className="mt-2 text-center">
                <button onClick={logout} className="text-slate-400 hover:text-red-500 transition-colors">
                   <LogOut size={16} />
                </button>
             </div>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        
        {/* HEADER */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0 z-10 shadow-sm/50">
           {/* Global Search */}
           <div className="flex-1 max-w-lg flex items-center">
             {isSidebarCollapsed && (
                <button 
                  onClick={() => setIsSidebarCollapsed(false)}
                  className="mr-4 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Expand Sidebar"
                >
                   <PanelLeft size={20} />
                </button>
             )}
             <div className="relative group w-full" onClick={() => setShowCommandPalette(true)}>
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-blue-500 transition-colors" size={18} />
               <input 
                 className="w-full pl-10 pr-12 h-10 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white focus:border-blue-500 transition-all cursor-text"
                 placeholder="Search patients by ID, Name or Mobile..."
                 readOnly
               />
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
                 <kbd className="hidden sm:inline-flex h-6 items-center gap-1 rounded border border-slate-200 bg-white px-2 font-mono text-[10px] font-bold text-slate-500 shadow-sm min-w-[32px] justify-center">
                   {shortcutKey} K
                 </kbd>
               </div>
             </div>
           </div>

           {/* Header Actions */}
           <div className="flex items-center gap-4 ml-6">
              <a 
                href="https://wa.me/?text=Support" 
                target="_blank" rel="noreferrer"
                className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-100 hover:bg-emerald-100 transition-colors"
                title="Integration Status: Active"
              >
                 <MessageSquare size={16} />
                 <span className="text-xs font-bold">WhatsApp Active</span>
              </a>

              <div className="relative" ref={notifRef}>
                 <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors outline-none focus:ring-2 focus:ring-blue-500"
                 >
                    <Bell size={20} />
                    {notifications.length > 0 && (
                      <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
                    )}
                 </button>
                 {/* Notification Dropdown */}
                 {showNotifications && (
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                        <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Notifications</span>
                            <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-blue-600 hover:underline">Mark all read</button>
                        </div>
                        <div className="max-h-64 overflow-y-auto">
                            {notifications.length === 0 ? <div className="p-6 text-center text-slate-400 text-xs">No new notifications</div> : notifications.map(n => (
                                <div key={n.id} className="p-3 border-b border-slate-50 hover:bg-slate-50 flex gap-3">
                                    <div className="mt-1">{n.icon}</div>
                                    <div><p className="text-sm font-bold text-slate-800">{n.title}</p><p className="text-xs text-slate-500">{n.time}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                 )}
              </div>

              <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>

              <button 
                onClick={() => setActiveTab('accessioning')}
                className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
              >
                 <Plus size={18} />
                 <span>New Registration</span>
              </button>
           </div>
        </header>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar relative">
           {children}
        </div>

        {/* Command Palette Overlay */}
        {showCommandPalette && (
          <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center pt-[15vh]" onClick={() => setShowCommandPalette(false)}>
            <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
              <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-white">
                <Terminal className={`transition-colors ${searchQuery ? 'text-blue-600' : 'text-slate-400'}`} size={20} />
                <input 
                  autoFocus 
                  className="flex-1 outline-none text-slate-900 placeholder:text-slate-400 font-medium text-lg bg-transparent" 
                  placeholder="Type a command or search..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
                <button onClick={() => setShowCommandPalette(false)} className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500 hover:bg-slate-200 cursor-pointer">ESC</button>
              </div>
              <div className="p-2 max-h-[300px] overflow-y-auto bg-white min-h-[50px]">
                {searchQuery === '' ? (
                    <>
                        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 py-2">Quick Navigation</div>
                        {allMenuItems.slice(0, 5).map((item, i) => (
                          <button key={item.id} onClick={() => { setActiveTab(item.id); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                              {item.icon} 
                              <span className="flex-1 text-left">{item.label}</span>
                              <div className="flex items-center gap-2">
                                <kbd className="hidden group-hover:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400">
                                    Alt {i + 1}
                                </kbd>
                                <CornerDownLeft size={12} className="text-slate-300" />
                              </div>
                          </button>
                        ))}
                    </>
                ) : filteredResults.length === 0 ? (
                    <div className="px-3 py-8 text-center text-sm text-slate-400">No results found</div>
                ) : (
                    filteredResults.map((item, i) => (
                        <button key={`${item.type}-${item.id}`} onClick={() => { item.action(); setShowCommandPalette(false); }} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors group">
                            <div className="text-slate-400 group-hover:text-blue-600">{item.icon}</div>
                            <div className="text-left flex-1">
                                <div className="font-bold text-slate-700 group-hover:text-blue-700">{item.title}</div>
                                <div className="text-[10px] text-slate-400">{item.type} · {item.subtitle}</div>
                            </div>
                            <div className="flex items-center gap-2">
                                {i < 5 && (
                                    <kbd className="hidden group-hover:inline-flex h-5 items-center gap-1 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-bold text-slate-400">
                                        Alt {i + 1}
                                    </kbd>
                                )}
                                <div className="text-[10px] font-bold text-slate-300 group-hover:text-blue-400">Jump</div>
                            </div>
                        </button>
                    ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Layout;