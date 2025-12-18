
import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, Bell, Lock, Save, 
  Mail, Phone, Globe, Shield, Database,
  ToggleLeft, ToggleRight, CheckCircle2, UserPlus, X,
  Activity, AlertTriangle
} from 'lucide-react';
import { useLab } from '../contexts/LabContext';
import { User } from '../types';
import { formatDateTime } from '../utils/formatters';

const Settings: React.FC = () => {
  const { settings, updateSettings, users, addUser, updateUserStatus } = useLab();
  const [activeTab, setActiveTab] = useState('general');
  const [localSettings, setLocalSettings] = useState(settings);
  const [showSuccess, setShowSuccess] = useState(false);
  
  // User Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [newUser, setNewUser] = useState<Partial<User>>({
      name: '',
      email: '',
      role: 'Technician',
      status: 'Active'
  });

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    updateSettings(localSettings);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleAddUser = (e: React.FormEvent) => {
      e.preventDefault();
      addUser(newUser as User);
      setIsUserModalOpen(false);
      setNewUser({ name: '', email: '', role: 'Technician', status: 'Active' });
  };

  const handleToggleNotification = (key: keyof typeof settings.notifications) => {
      setLocalSettings(prev => ({
          ...prev,
          notifications: {
              ...prev.notifications,
              [key]: !prev.notifications[key]
          }
      }));
  };

  const tabs = [
    { id: 'general', label: 'General Info', icon: <Building2 size={18} /> },
    { id: 'users', label: 'User Management', icon: <Users size={18} /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell size={18} /> },
    { id: 'security', label: 'Security & Backup', icon: <Shield size={18} /> },
  ];

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden -m-4">
      {/* Sidebar */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col">
        <div className="p-6 border-b border-slate-200">
          <h2 className="font-black text-slate-900 text-lg tracking-tight">Settings</h2>
          <p className="text-xs text-slate-500 font-medium mt-1">System preferences</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === tab.id 
                  ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200' 
                  : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'general' && (
          <div className="p-8 max-w-3xl animate-in fade-in slide-in-from-right-4 duration-300">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Laboratory Profile</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">Lab Name</label>
                <div className="relative">
                   <Building2 className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                     value={localSettings.name}
                     onChange={e => setLocalSettings({...localSettings, name: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">Website</label>
                <div className="relative">
                   <Globe className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                     value={localSettings.website}
                     onChange={e => setLocalSettings({...localSettings, website: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">Address</label>
                <textarea 
                  value={localSettings.address}
                  onChange={e => setLocalSettings({...localSettings, address: e.target.value})}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm font-medium text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none h-20 resize-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">Official Email</label>
                <div className="relative">
                   <Mail className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                     value={localSettings.email}
                     onChange={e => setLocalSettings({...localSettings, email: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-500 uppercase">Phone</label>
                <div className="relative">
                   <Phone className="absolute left-3 top-2.5 text-slate-400" size={16} />
                   <input 
                     value={localSettings.phone}
                     onChange={e => setLocalSettings({...localSettings, phone: e.target.value})}
                     className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                   />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-4 pt-6 border-t border-slate-100">
               {showSuccess && <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-in fade-in"><CheckCircle2 size={16}/> Saved Successfully</span>}
               <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                 <Save size={18} /> Save Changes
               </button>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="p-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-900">User Access Control</h2>
                <button 
                    onClick={() => setIsUserModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800"
                >
                    <UserPlus size={16} /> Add User
                </button>
            </div>
            
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-6 py-3 text-xs font-black uppercase text-slate-500">User</th>
                    <th className="px-6 py-3 text-xs font-black uppercase text-slate-500">Role</th>
                    <th className="px-6 py-3 text-xs font-black uppercase text-slate-500">Last Login</th>
                    <th className="px-6 py-3 text-xs font-black uppercase text-slate-500">Status</th>
                    <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4">
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-xs text-slate-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 font-medium">{user.role}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500">{formatDateTime(user.lastLogin || '')}</td>
                        <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${user.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                            {user.status}
                        </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <button 
                             onClick={() => updateUserStatus(user.id, user.status === 'Active' ? 'Inactive' : 'Active')}
                             className={`text-xs font-bold hover:underline ${user.status === 'Active' ? 'text-red-500' : 'text-green-600'}`}
                           >
                               {user.status === 'Active' ? 'Deactivate' : 'Activate'}
                           </button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
          </div>
        )}

        {activeTab === 'notifications' && (
            <div className="p-8 max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
                <h2 className="text-xl font-bold text-slate-900 mb-6">Alerts & Notifications</h2>
                
                <div className="space-y-4">
                    {[
                        { key: 'emailAlerts', title: 'Email Notifications', desc: 'Receive daily summaries and critical alerts via email.' },
                        { key: 'smsAlerts', title: 'SMS Alerts', desc: 'Get urgent updates on your registered mobile number.' },
                        { key: 'criticalResultAlert', title: 'Critical Result Warnings', desc: 'Instant popup when a test result falls in panic range.' },
                        { key: 'lowStockWarning', title: 'Inventory Low Stock', desc: 'Notify when reagents drop below minimum level.' },
                        { key: 'dailyReport', title: 'Auto-Send Daily Report', desc: 'Email the daily business report at closing time (20:00).' },
                    ].map((item) => (
                        <div key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl hover:border-blue-200 transition-colors bg-white">
                            <div className="flex gap-4">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${localSettings.notifications[item.key as keyof typeof localSettings.notifications] ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                                    <Bell size={20} />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-900">{item.title}</p>
                                    <p className="text-xs text-slate-500 max-w-xs">{item.desc}</p>
                                </div>
                            </div>
                            <button onClick={() => handleToggleNotification(item.key as any)}>
                                {localSettings.notifications[item.key as keyof typeof localSettings.notifications] 
                                    ? <ToggleRight size={32} className="text-blue-600" /> 
                                    : <ToggleLeft size={32} className="text-slate-300" />
                                }
                            </button>
                        </div>
                    ))}
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100 flex justify-end">
                    {showSuccess && <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-in fade-in mr-4"><CheckCircle2 size={16}/> Preferences Saved</span>}
                    <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                        <Save size={18} /> Update Preferences
                    </button>
                </div>
            </div>
        )}

        {activeTab === 'security' && (
           <div className="p-8 max-w-2xl animate-in fade-in slide-in-from-right-4 duration-300">
              <h2 className="text-xl font-bold text-slate-900 mb-6">Security & Database</h2>
              <div className="space-y-6">
                 <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Database size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900">Auto-Backup</p>
                          <p className="text-xs text-slate-500">Daily database snapshot at 00:00 UTC</p>
                       </div>
                    </div>
                    <button onClick={() => setLocalSettings({...localSettings, autoBackup: !localSettings.autoBackup})}>
                       {localSettings.autoBackup ? <ToggleRight size={32} className="text-green-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                 </div>
                 
                 <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <div className="flex items-center gap-4">
                       <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600">
                          <Shield size={20} />
                       </div>
                       <div>
                          <p className="font-bold text-slate-900">2FA Enforcement</p>
                          <p className="text-xs text-slate-500">Require Two-Factor Auth for all staff</p>
                       </div>
                    </div>
                    <button onClick={() => setLocalSettings({...localSettings, enforce2FA: !localSettings.enforce2FA})}>
                       {localSettings.enforce2FA ? <ToggleRight size={32} className="text-green-600" /> : <ToggleLeft size={32} className="text-slate-300" />}
                    </button>
                 </div>
              </div>
              <div className="mt-8 flex justify-end">
                 {showSuccess && <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-in fade-in mr-4"><CheckCircle2 size={16}/> Settings Saved</span>}
                 <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-lg shadow-blue-100 transition-all active:scale-95">
                    <Save size={18} /> Update Security Settings
                 </button>
              </div>
           </div>
        )}
      </div>

      {/* Add User Modal */}
      {isUserModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="font-bold text-slate-900">Create New User</h3>
                   <button onClick={() => setIsUserModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                   </button>
                </div>
                <form onSubmit={handleAddUser} className="space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Full Name</label>
                      <input 
                         autoFocus
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                         value={newUser.name}
                         onChange={e => setNewUser({...newUser, name: e.target.value})}
                         required
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Email Address</label>
                      <input 
                         type="email"
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                         value={newUser.email}
                         onChange={e => setNewUser({...newUser, email: e.target.value})}
                         required
                      />
                   </div>
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Role</label>
                      <select 
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                         value={newUser.role}
                         onChange={e => setNewUser({...newUser, role: e.target.value as any})}
                      >
                         <option>Pathologist</option>
                         <option>Technician</option>
                         <option>Receptionist</option>
                         <option>Super Admin</option>
                      </select>
                   </div>
                   <button className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg shadow-lg transition-all mt-2">
                       Create Account
                   </button>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default Settings;
