
import React, { useMemo, useState } from 'react';
import { useLab } from '../contexts/LabContext';
import { CreditCard, DollarSign, Download, Clock, TrendingUp, Filter, Search, X, CheckCircle2, Printer } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils/formatters';
import { calculateFinancials } from '../services/analyticsService';
import { Invoice } from './Invoice';

const Billing: React.FC = () => {
  const { requests, recordPayment, patients, clients, settings } = useLab();
  
  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Invoice Reprint State
  const [invoiceToPrintId, setInvoiceToPrintId] = useState<string | null>(null);
  
  // Table Filter State
  const [showTableFilter, setShowTableFilter] = useState(false);
  const [tableFilterText, setTableFilterText] = useState('');

  // Dynamic Financial Calculations via Service
  const metrics = useMemo(() => calculateFinancials(requests), [requests]);

  // Logic for finding invoice to pay
  const pendingInvoices = requests.filter(r => r.dueAmount > 0);
  const filteredInvoices = pendingInvoices.filter(r => {
     const patient = patients.find(p => p.id === r.patientId);
     const search = invoiceSearch.toLowerCase();
     return r.id.toLowerCase().includes(search) || 
            (patient && (patient.firstName.toLowerCase().includes(search) || patient.lastName.toLowerCase().includes(search)));
  });

  // Table Data Filtering
  const filteredTableData = requests.filter(r => {
      if (!tableFilterText) return true;
      const search = tableFilterText.toLowerCase();
      const patient = patients.find(p => p.id === r.patientId);
      const client = clients.find(c => c.id === r.clientId);
      const name = client ? client.name : `${patient?.firstName} ${patient?.lastName}`;
      
      return r.id.toLowerCase().includes(search) || name.toLowerCase().includes(search);
  });

  const selectedInvoice = selectedInvoiceId ? requests.find(r => r.id === selectedInvoiceId) : null;
  const invoiceToPrint = invoiceToPrintId ? requests.find(r => r.id === invoiceToPrintId) : null;

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);
    
    if (selectedInvoiceId && amount > 0) {
       if (selectedInvoice && amount > selectedInvoice.dueAmount) {
           alert("Payment amount cannot exceed the outstanding balance.");
           return;
       }
       
       recordPayment(selectedInvoiceId, amount);
       setPaymentSuccess(true);
       setTimeout(() => {
          setPaymentSuccess(false);
          setIsPaymentModalOpen(false);
          setSelectedInvoiceId(null);
          setPaymentAmount('');
          setInvoiceSearch('');
       }, 1500);
    }
  };

  const handleOpenPayment = (id: string) => {
      setSelectedInvoiceId(id);
      setIsPaymentModalOpen(true);
  };

  const handleDownloadStatement = () => {
    // Generate CSV Content
    const headers = ['InvoiceID', 'Date', 'Patient/Client', 'Total Fee', 'Discount', 'Paid', 'Due', 'Status'];
    const rows = requests.map(r => {
       const client = clients.find(c => c.id === r.clientId);
       const patient = patients.find(p => p.id === r.patientId);
       const name = client ? client.name : `${patient?.firstName} ${patient?.lastName}`;
       const status = r.dueAmount <= 0 ? 'Settled' : 'Unpaid';
       
       return [
          r.id, 
          r.dateReceived,
          `"${name}"`, // Quote to handle commas in names
          r.totalFee,
          r.discount,
          r.paidAmount,
          r.dueAmount,
          status
       ].join(',');
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financial_statement_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Financials</h1>
          <p className="text-slate-500">Real-time revenue tracking and invoice management</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleDownloadStatement}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-50 flex items-center gap-2"
          >
            <Download size={18} /> Financial Statement
          </button>
          <button 
            onClick={() => setIsPaymentModalOpen(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-700 flex items-center gap-2 shadow-lg shadow-green-200 transition-all active:scale-95"
          >
            <DollarSign size={18} /> Record Payment
          </button>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Clock size={64} className="text-red-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Outstanding Balance</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{formatCurrency(metrics.outstanding)}</p>
          <div className="flex items-center gap-1 text-red-600 text-xs mt-3 font-bold bg-red-50 inline-block px-2 py-1 rounded-lg">
            Needs Collection
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
          <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <TrendingUp size={64} className="text-green-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Total Collected</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{formatCurrency(metrics.totalCollected)}</p>
          <div className="flex items-center gap-1 text-green-600 text-xs mt-3 font-bold bg-green-50 inline-block px-2 py-1 rounded-lg">
             {metrics.recoveryRate.toFixed(1)}% Recovery Rate
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
           <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CreditCard size={64} className="text-blue-600" />
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Today's Revenue</p>
          <p className="text-3xl font-black text-slate-900 mt-2 tracking-tight">{formatCurrency(metrics.todayCollected)}</p>
          <div className="text-slate-500 text-xs mt-3 font-medium">
            From {requests.filter(r => r.dateReceived === new Date().toISOString().split('T')[0]).length} transactions
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-bold text-slate-800">Recent Transactions</h3>
            <button 
                onClick={() => setShowTableFilter(!showTableFilter)}
                className={`text-xs font-bold hover:text-blue-600 flex items-center gap-1 ${showTableFilter ? 'text-blue-600' : 'text-slate-500'}`}
            >
                <Filter size={12} /> {showTableFilter ? 'Hide Filters' : 'Filter list'}
            </button>
        </div>
        {showTableFilter && (
            <div className="p-4 bg-slate-50 border-b border-slate-200 animate-in fade-in slide-in-from-top-2">
                <input 
                    autoFocus
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    placeholder="Filter by Invoice ID, Patient or Client Name..."
                    value={tableFilterText}
                    onChange={e => setTableFilterText(e.target.value)}
                />
            </div>
        )}
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Invoice Ref</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Client / Patient</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Date</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Total</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Paid</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Due</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 w-12"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTableData.slice().reverse().map((req) => {
              const client = clients.find(c => c.id === req.clientId);
              const patient = patients.find(p => p.id === req.patientId);
              const isPaid = req.dueAmount <= 0;
              const isPartial = req.dueAmount > 0 && req.paidAmount > 0;
              
              return (
                <tr key={req.id} className="hover:bg-slate-50 group transition-colors">
                  <td 
                    onClick={() => handleOpenPayment(req.id)}
                    className="px-6 py-4 font-mono text-sm font-bold text-blue-600 group-hover:underline cursor-pointer"
                    title="Click to Record Payment"
                  >
                    {req.id}
                  </td>
                  <td className="px-6 py-4">
                     <div className="text-sm font-bold text-slate-900">{client ? client.name : `${patient?.firstName} ${patient?.lastName}`}</div>
                     <div className="text-xs text-slate-500">{client ? 'Corporate Client' : 'Private Patient'}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{formatDate(req.dateReceived)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-slate-900">{formatCurrency(req.totalFee)}</td>
                  <td className="px-6 py-4 text-sm font-medium text-green-600">{formatCurrency(req.paidAmount)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-red-500">{req.dueAmount > 0 ? formatCurrency(req.dueAmount) : '-'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wide border ${
                      isPaid 
                        ? 'bg-green-50 text-green-700 border-green-200' 
                        : isPartial 
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                    }`}>
                      {isPaid ? 'Settled' : isPartial ? 'Partial' : 'Unpaid'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      <button 
                        onClick={() => setInvoiceToPrintId(req.id)}
                        className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-200 transition-colors"
                        title="Reprint Invoice"
                      >
                          <Printer size={16} />
                      </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Invoice Reprint Modal */}
      {invoiceToPrint && (() => {
          const p = patients.find(pat => pat.id === invoiceToPrint.patientId);
          return p ? (
             <Invoice 
                request={invoiceToPrint} 
                patient={p} 
                settings={settings} 
                onClose={() => setInvoiceToPrintId(null)} 
             />
          ) : null;
      })()}

      {/* Payment Modal */}
      {isPaymentModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
             {paymentSuccess ? (
                <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center animate-in zoom-in">
                   <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-4">
                      <CheckCircle2 size={32} />
                   </div>
                   <h3 className="text-xl font-black text-slate-900">Payment Recorded</h3>
                   <p className="text-slate-500">Transaction completed successfully.</p>
                </div>
             ) : (
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                      <h3 className="font-bold text-lg text-slate-900">Receive Payment</h3>
                      <button onClick={() => { setIsPaymentModalOpen(false); setSelectedInvoiceId(null); }} className="text-slate-400 hover:text-slate-600">
                         <X size={20} />
                      </button>
                   </div>
                   
                   <div className="p-6 flex-1 overflow-hidden flex flex-col">
                      {!selectedInvoice ? (
                         <>
                            <div className="relative mb-4">
                               <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                               <input 
                                  autoFocus
                                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-green-500 outline-none"
                                  placeholder="Search Invoice ID or Patient Name..."
                                  value={invoiceSearch}
                                  onChange={e => setInvoiceSearch(e.target.value)}
                               />
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-2">
                               {filteredInvoices.length === 0 ? (
                                  <div className="text-center py-8 text-slate-400 text-sm">No pending invoices found.</div>
                               ) : (
                                  filteredInvoices.map(r => {
                                     const p = patients.find(pat => pat.id === r.patientId);
                                     return (
                                        <button 
                                           key={r.id}
                                           onClick={() => setSelectedInvoiceId(r.id)}
                                           className="w-full text-left p-3 rounded-lg border border-slate-100 hover:border-green-300 hover:bg-green-50 transition-all flex justify-between items-center group"
                                        >
                                           <div>
                                              <p className="font-bold text-slate-900 group-hover:text-green-800">{p?.firstName} {p?.lastName}</p>
                                              <p className="text-xs text-slate-500 font-mono">{r.id}</p>
                                           </div>
                                           <div className="text-right">
                                              <p className="font-bold text-red-600 text-sm">{formatCurrency(r.dueAmount)}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">Due</p>
                                           </div>
                                        </button>
                                     );
                                  })
                               )}
                            </div>
                         </>
                      ) : (
                         <form onSubmit={handlePayment} className="space-y-6">
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Invoice Ref</span>
                                  <span className="font-mono font-bold text-slate-900">{selectedInvoice.id}</span>
                               </div>
                               <div className="flex justify-between items-center mb-2">
                                  <span className="text-xs font-bold text-slate-500 uppercase">Total Bill</span>
                                  <span className="font-bold text-slate-900">{formatCurrency(selectedInvoice.totalFee)}</span>
                               </div>
                               <div className="flex justify-between items-center text-red-600">
                                  <span className="text-xs font-bold uppercase">Outstanding</span>
                                  <span className="font-black text-lg">{formatCurrency(selectedInvoice.dueAmount)}</span>
                               </div>
                            </div>

                            <div>
                               <label className="text-xs font-bold text-slate-500 uppercase">Payment Amount (PKR)</label>
                               <input 
                                  autoFocus
                                  type="number"
                                  min="0"
                                  className="w-full mt-1 border border-slate-300 rounded-xl px-4 py-3 text-2xl font-black text-slate-900 focus:ring-2 focus:ring-green-500 outline-none"
                                  placeholder="0"
                                  max={selectedInvoice.dueAmount}
                                  value={paymentAmount}
                                  onChange={e => setPaymentAmount(e.target.value)}
                                  required
                               />
                               <div className="flex gap-2 mt-2">
                                  <button type="button" onClick={() => setPaymentAmount(selectedInvoice.dueAmount.toString())} className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded hover:bg-green-100">Full Amount</button>
                               </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                               <button type="button" onClick={() => setSelectedInvoiceId(null)} className="flex-1 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50">Back</button>
                               <button className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-200">Confirm Payment</button>
                            </div>
                         </form>
                      )}
                   </div>
                </div>
             )}
          </div>
      )}
    </div>
  );
};

export default Billing;
