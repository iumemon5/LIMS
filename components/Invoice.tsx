
import React, { useEffect } from 'react';
import { AnalysisRequest, Patient, LabSettings } from '../types';
import { formatDate, formatCurrency } from '../utils/formatters';

interface InvoiceProps {
  request: AnalysisRequest;
  patient: Patient;
  settings: LabSettings;
  onClose: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({ request, patient, settings, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in print-reset-parent">
       <div className="printable-document bg-white w-full max-w-xl shadow-2xl overflow-hidden flex flex-col relative rounded-xl print:max-w-none print:w-full print:shadow-none print:rounded-none print:overflow-visible print:h-auto">
          {/* Toolbar - Hidden in Print */}
          <div className="print-hidden p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
             <h3 className="font-bold text-slate-700">Invoice Preview</h3>
             <div className="flex gap-2">
                <button onClick={onClose} className="px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 rounded-lg">Close</button>
                <button onClick={() => window.print()} className="px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700">Print Invoice</button>
             </div>
          </div>

          <div className="p-10 print:px-12 print:py-8 bg-white min-h-[500px] print:min-h-0">
            {/* Header */}
            <div className="text-center border-b-2 border-slate-900 pb-4 mb-6">
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{settings.name}</h1>
                <p className="text-xs text-slate-500 font-bold uppercase tracking-widest mt-1">{settings.address}</p>
                <p className="text-xs text-slate-500 mt-1">Ph: {settings.phone} | {settings.email}</p>
            </div>

            {/* Info Grid */}
            <div className="flex justify-between mb-8 text-sm">
                <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Bill To</p>
                    <p className="font-black text-slate-900 text-lg">{patient.firstName} {patient.lastName}</p>
                    <p className="text-slate-600 font-mono text-xs">{patient.mrn}</p>
                    <p className="text-slate-600 text-xs mt-1">{patient.gender} / {patient.age} {patient.ageUnit}</p>
                </div>
                <div className="text-right">
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-1">Invoice Details</p>
                    <p className="font-black text-slate-900 text-lg">#{request.id}</p>
                    <p className="text-slate-600 text-xs">{formatDate(request.dateReceived)}</p>
                    <p className="text-slate-600 text-xs mt-1">Priority: {request.priority}</p>
                </div>
            </div>

            {/* Line Items */}
            <div className="mb-8">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b-2 border-slate-100">
                            <th className="text-left py-2 font-black text-slate-900 uppercase text-xs">Test Description</th>
                            <th className="text-right py-2 font-black text-slate-900 uppercase text-xs">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {request.analyses.map((a, i) => (
                            <tr key={i}>
                                <td className="py-3 text-slate-700 font-medium">{a.title}</td>
                                <td className="py-3 text-right font-mono font-bold text-slate-900">{formatCurrency(a.price)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Totals */}
            <div className="flex flex-col items-end space-y-2 text-sm border-t-2 border-slate-100 pt-6">
                <div className="flex justify-between w-56">
                    <span className="text-slate-500 font-medium">Subtotal</span>
                    <span className="font-bold text-slate-900">{formatCurrency(request.totalFee)}</span>
                </div>
                <div className="flex justify-between w-56">
                    <span className="text-slate-500 font-medium">Discount</span>
                    <span className="font-bold text-red-500">-{formatCurrency(request.discount)}</span>
                </div>
                 <div className="flex justify-between w-56 pt-2 border-t border-slate-100">
                    <span className="font-black text-slate-900">Net Total</span>
                    <span className="font-black text-slate-900">{formatCurrency(request.totalFee - request.discount)}</span>
                </div>
                <div className="flex justify-between w-56">
                    <span className="text-slate-500 font-medium">Amount Paid</span>
                    <span className="font-bold text-green-600">{formatCurrency(request.paidAmount)}</span>
                </div>
                <div className="flex justify-between w-56 pt-2 border-t-2 border-slate-900 mt-2">
                    <span className="font-black text-slate-900 uppercase">Balance Due</span>
                    <span className="font-black text-slate-900">{formatCurrency(request.dueAmount)}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="mt-16 text-center text-[10px] text-slate-400 break-inside-avoid">
                <p className="uppercase font-bold tracking-widest">Thank you for your business</p>
                <p className="mt-1">Computer Generated Receipt. Signature not required.</p>
                <p>Printed: {new Date().toLocaleString()}</p>
            </div>
          </div>
       </div>
    </div>
  );
};
