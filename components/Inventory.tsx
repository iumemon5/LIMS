
import React, { useState, useMemo } from 'react';
import { useLab } from '../contexts/LabContext';
import { 
  Package, Search, AlertTriangle, Plus, 
  ArrowUp, ArrowDown, History, Archive, X, FileText
} from 'lucide-react';
import { InventoryItem } from '../types';
import { formatDateTime } from '../utils/formatters';

const Inventory: React.FC = () => {
  const { inventory, updateStock, addInventoryItem, auditLogs } = useLab();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Form State
  const [newItem, setNewItem] = useState<Partial<InventoryItem>>({
    name: '',
    category: 'Reagent',
    lotNumber: '',
    expiryDate: '',
    quantity: 0,
    unit: 'Units',
    minLevel: 5,
    location: ''
  });

  const filteredInventory = inventory.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.lotNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter audit logs for inventory related actions
  const inventoryLogs = useMemo(() => {
    return auditLogs.filter(log => log.resourceType === 'Inventory');
  }, [auditLogs]);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    // ID generation is delegated to LabContext
    addInventoryItem(newItem as InventoryItem);
    setIsModalOpen(false);
    setNewItem({
        name: '',
        category: 'Reagent',
        lotNumber: '',
        expiryDate: '',
        quantity: 0,
        unit: 'Units',
        minLevel: 5,
        location: ''
    });
  };

  return (
    <div className="space-y-6 h-[calc(100vh-80px)] flex flex-col">
      <div className="flex justify-between items-end shrink-0">
        <div>
           <h1 className="text-2xl font-black text-slate-900 tracking-tight">Inventory & Reagents</h1>
           <p className="text-slate-500 font-medium mt-1">Track consumables, lot numbers and expiry dates</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-blue-100 flex items-center gap-2 transition-all active:scale-95"
        >
           <Plus size={18} /> Add Item
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4 shrink-0">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
             <AlertTriangle size={20} />
           </div>
           <div>
              <p className="text-2xl font-black text-slate-900">{inventory.filter(i => i.quantity <= i.minLevel).length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase">Low Stock Alerts</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
             <Package size={20} />
           </div>
           <div>
              <p className="text-2xl font-black text-slate-900">{inventory.length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase">Total Items</p>
           </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4">
           <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center text-purple-600">
             <Archive size={20} />
           </div>
           <div>
              <p className="text-2xl font-black text-slate-900">{inventory.filter(i => i.category === 'Consumable').length}</p>
              <p className="text-xs font-bold text-slate-500 uppercase">Consumables</p>
           </div>
        </div>
      </div>

      <div className="flex-1 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center gap-4">
           <div className="relative flex-1">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
             <input 
               className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none"
               placeholder="Search inventory by name or lot number..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
           <button 
             onClick={() => setIsHistoryOpen(true)}
             className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 flex items-center gap-2 hover:bg-slate-50 transition-colors"
           >
             <History size={16} /> History
           </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left border-collapse">
             <thead className="sticky top-0 bg-white border-b border-slate-200 z-10 shadow-sm">
                <tr>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider">Item Details</th>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider">Category</th>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider">Lot / Expiry</th>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider">Location</th>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider text-center">Stock Level</th>
                   <th className="px-6 py-3 text-xs font-black uppercase text-slate-500 tracking-wider text-right">Actions</th>
                </tr>
             </thead>
             <tbody className="divide-y divide-slate-100">
                {filteredInventory.map(item => {
                  const isLow = item.quantity <= item.minLevel;
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                       <td className="px-6 py-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="text-xs text-slate-500 font-mono">{item.id}</div>
                       </td>
                       <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                            item.category === 'Reagent' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {item.category}
                          </span>
                       </td>
                       <td className="px-6 py-4">
                          <div className="text-sm font-medium text-slate-700">{item.lotNumber}</div>
                          <div className={`text-xs font-medium ${new Date(item.expiryDate) < new Date() ? 'text-red-600' : 'text-slate-500'}`}>
                             Exp: {item.expiryDate}
                          </div>
                       </td>
                       <td className="px-6 py-4 text-sm text-slate-600 font-medium">
                          {item.location}
                       </td>
                       <td className="px-6 py-4 text-center">
                          <div className="flex flex-col items-center">
                             <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-slate-900'}`}>
                               {item.quantity}
                             </span>
                             <span className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</span>
                          </div>
                       </td>
                       <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                             <button 
                               onClick={() => updateStock(item.id, item.quantity - 1)}
                               className="p-1.5 hover:bg-red-100 text-slate-400 hover:text-red-600 rounded-lg transition-colors"
                             >
                               <ArrowDown size={16} />
                             </button>
                             <button 
                               onClick={() => updateStock(item.id, item.quantity + 1)}
                               className="p-1.5 hover:bg-green-100 text-slate-400 hover:text-green-600 rounded-lg transition-colors"
                             >
                               <ArrowUp size={16} />
                             </button>
                          </div>
                       </td>
                    </tr>
                  )
                })}
             </tbody>
          </table>
        </div>
      </div>

      {/* History Modal */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
           <div className="w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                 <div>
                    <h3 className="font-bold text-slate-900 text-lg">Inventory Audit Log</h3>
                    <p className="text-xs text-slate-500">Track all stock movements and adjustments</p>
                 </div>
                 <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                 {inventoryLogs.length === 0 ? (
                    <div className="text-center py-10 text-slate-400">
                        <History size={48} className="mx-auto mb-2 opacity-20" />
                        <p className="font-medium">No inventory records found</p>
                    </div>
                 ) : (
                    inventoryLogs.map(log => {
                      // Attempt to parse details to find item name if possible, or use resourceId
                      return (
                        <div key={log.id} className="border border-slate-100 rounded-xl p-3 hover:bg-slate-50 transition-colors">
                           <div className="flex justify-between items-start mb-1">
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                                 log.action === 'STOCK_ADJUST' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                 {log.action.replace('_', ' ')}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono">{formatDateTime(log.timestamp)}</span>
                           </div>
                           <p className="text-sm text-slate-800 font-medium leading-snug">{log.details}</p>
                           <div className="flex justify-between items-center mt-2">
                             <span className="text-[10px] font-mono text-slate-400">{log.resourceId}</span>
                             <span className="text-[10px] font-bold text-slate-500">{log.user}</span>
                           </div>
                        </div>
                      );
                    })
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Add Item Modal */}
      {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-bold text-lg text-slate-900">Add Inventory Item</h3>
                   <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                      <X size={20} />
                   </button>
                </div>
                
                <form onSubmit={handleAddItem} className="p-6 space-y-4">
                   <div>
                      <label className="text-xs font-bold text-slate-500 uppercase">Item Name</label>
                      <input 
                         autoFocus
                         className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                         placeholder="e.g. Alcohol Swabs"
                         value={newItem.name}
                         onChange={e => setNewItem({...newItem, name: e.target.value})}
                         required
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Category</label>
                         <select 
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newItem.category}
                            onChange={e => setNewItem({...newItem, category: e.target.value as any})}
                         >
                            <option>Reagent</option>
                            <option>Consumable</option>
                            <option>Equipment</option>
                         </select>
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Lot Number</label>
                         <input 
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="LOT-XXX"
                            value={newItem.lotNumber}
                            onChange={e => setNewItem({...newItem, lotNumber: e.target.value})}
                         />
                      </div>
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                         <input 
                            type="number"
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newItem.quantity || ''}
                            onChange={e => setNewItem({...newItem, quantity: parseInt(e.target.value)})}
                            required
                         />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Unit</label>
                         <input 
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Packs"
                            value={newItem.unit}
                            onChange={e => setNewItem({...newItem, unit: e.target.value})}
                            required
                         />
                      </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                       <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Expiry Date</label>
                         <input 
                            type="date"
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newItem.expiryDate}
                            onChange={e => setNewItem({...newItem, expiryDate: e.target.value})}
                            required
                         />
                      </div>
                      <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Min Alert Level</label>
                         <input 
                            type="number"
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            value={newItem.minLevel || ''}
                            onChange={e => setNewItem({...newItem, minLevel: parseInt(e.target.value)})}
                         />
                      </div>
                   </div>

                    <div>
                         <label className="text-xs font-bold text-slate-500 uppercase">Storage Location</label>
                         <input 
                            className="w-full mt-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Fridge B, Shelf 2"
                            value={newItem.location}
                            onChange={e => setNewItem({...newItem, location: e.target.value})}
                         />
                    </div>

                   <div className="pt-4 flex gap-3">
                      <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2.5 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                      <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200">Register Item</button>
                   </div>
                </form>
             </div>
          </div>
      )}
    </div>
  );
};

export default Inventory;
