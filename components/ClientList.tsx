import React, { useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { Mail, Phone, ExternalLink, Plus, Stethoscope, User, X, Edit, Clock, Building2 } from 'lucide-react';
import { Client } from '../types';

const ClientList: React.FC = () => {
  const { clients, addClient, updateClient, requests } = useLab();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [clientForm, setClientForm] = useState<Partial<Client>>({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: ''
  });

  const handleCreateOrUpdateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && clientForm.id) {
        updateClient(clientForm as Client);
    } else {
        addClient(clientForm as Client);
    }
    closeModal();
  };

  const openAddModal = () => {
      setIsEditing(false);
      setClientForm({ name: '', code: '', contactPerson: '', email: '', phone: '' });
      setIsModalOpen(true);
  };

  const openEditModal = (client: Client) => {
      setIsEditing(true);
      setClientForm(client);
      setIsModalOpen(true);
  };

  const closeModal = () => {
      setIsModalOpen(false);
      setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Referring Doctors</h1>
          <p className="text-slate-500">Manage external physicians and referral sources</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200 transition-all active:scale-95"
        >
          <Plus size={18} /> Add Doctor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => {
          // Count active referrals
          const activeReferrals = requests.filter(r => r.referrer === client.name && r.status !== 'Verified').length;
          
          return (
            <div key={client.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow group relative">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold text-lg group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Stethoscope size={24} />
                </div>
                <div className="flex gap-1">
                    <button 
                      onClick={() => openEditModal(client)}
                      className="text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-lg"
                      title="Edit Details"
                    >
                      <Edit size={18} />
                    </button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-900 mb-1 truncate">{client.name}</h3>
              <p className="text-sm text-slate-500 mb-6 flex items-center gap-1">
                <Building2 size={14} /> {client.contactPerson || 'Private Practice'}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Mail size={16} className="text-slate-400" />
                  <span className="truncate">{client.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <Phone size={16} className="text-slate-400" />
                  <span>{client.phone}</span>
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs font-semibold uppercase text-slate-400">Activity</span>
                <div className="flex gap-2">
                  {activeReferrals > 0 && (
                    <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded flex items-center gap-1">
                        <Clock size={10} /> {activeReferrals} Active Cases
                    </span>
                  )}
                  <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded font-mono">{client.code}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-lg text-slate-900">{isEditing ? 'Edit Doctor' : 'Register New Doctor'}</h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-slate-600">
                     <X size={20} />
                  </button>
               </div>
               
               <form onSubmit={handleCreateOrUpdateClient} className="p-6 space-y-4">
                  <div className="grid grid-cols-4 gap-4">
                     <div className="col-span-1">
                        <label className="text-xs font-bold text-slate-500 uppercase">Code</label>
                        <input 
                           disabled={isEditing}
                           className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none uppercase font-mono disabled:opacity-50 disabled:bg-slate-50"
                           placeholder="DR01"
                           value={clientForm.code}
                           onChange={e => setClientForm({...clientForm, code: e.target.value})}
                           required
                           maxLength={6}
                        />
                     </div>
                     <div className="col-span-3">
                        <label className="text-xs font-bold text-slate-500 uppercase">Doctor Name</label>
                        <input 
                           autoFocus={!isEditing}
                           className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="e.g. Dr. Sarah Smith"
                           value={clientForm.name}
                           onChange={e => setClientForm({...clientForm, name: e.target.value})}
                           required
                        />
                     </div>
                  </div>
                  
                  <div>
                     <label className="text-xs font-bold text-slate-500 uppercase">Affiliation / Clinic</label>
                     <input 
                        className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                        placeholder="e.g. City Hospital / Private Clinic"
                        value={clientForm.contactPerson}
                        onChange={e => setClientForm({...clientForm, contactPerson: e.target.value})}
                     />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                        <input 
                           type="email"
                           className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                           placeholder="doctor@example.com"
                           value={clientForm.email}
                           onChange={e => setClientForm({...clientForm, email: e.target.value})}
                        />
                     </div>
                     <div>
                        <label className="text-xs font-bold text-slate-500 uppercase">Phone</label>
                        <input 
                           className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                           placeholder="03xx-xxxxxxx"
                           value={clientForm.phone}
                           onChange={e => setClientForm({...clientForm, phone: e.target.value})}
                           required
                        />
                     </div>
                  </div>

                  <div className="pt-4 flex gap-3">
                     <button type="button" onClick={closeModal} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                     <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">{isEditing ? 'Save Changes' : 'Register Doctor'}</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default ClientList;