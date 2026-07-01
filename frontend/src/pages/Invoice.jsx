import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';
import { bills, getClientById, getVideosByClient, settings, MONTH_LABEL } from '../lib/store';

export default function Invoice() {
  const { billId } = useParams();
  const navigate = useNavigate();

  const bill = bills.find((b) => b.id === billId);
  const client = bill ? getClientById(bill.client_id) : null;
  const company = settings.company;

  // Billable items = Approved + Locked videos in the bill's month/year
  const items = useMemo(() => {
    if (!bill || !client) return [];
    return getVideosByClient(client.id)
      .filter((v) => v.year === bill.year && v.month === bill.month && v.client_status === 'Approved' && v.client_locked)
      .map((v) => ({
        id: v.id,
        file_name: v.file_name || `${v.name.replace(/\s+/g, '_')}_${(v.version || 'V1').toLowerCase()}`,
        category: v.category,
        duration: v.duration,
        version: v.version,
        amount: Number(v.amount || 0),
      }));
  }, [bill, client]);

  if (!bill || !client) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex items-center justify-center p-8">
        <div className="text-center">
          <p className="text-lg">Invoice not found.</p>
          <button onClick={() => navigate(-1)} className="mt-4 inline-flex items-center gap-2 px-3 py-2 rounded border border-slate-300"><ArrowLeft className="w-4 h-4" /> Back</button>
        </div>
      </div>
    );
  }

  const subtotal = items.reduce((a, i) => a + i.amount, 0);
  const declaredSubtotal = Number(bill.subtotal || subtotal);
  const discount = Number(bill.discount || 0);
  const tax = Number(bill.tax || 0);
  const grand = Number(bill.total_amount ?? Math.max(0, declaredSubtotal - discount + tax));

  return (
    <div className="invoice-shell min-h-screen bg-slate-100 p-6 print:bg-white print:p-0">
      {/* Screen-only toolbar */}
      <div className="no-print max-w-[820px] mx-auto mb-4 flex justify-between items-center">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-sm">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </button>
      </div>

      <div className="invoice-page mx-auto bg-white text-slate-800 shadow-xl print:shadow-none">
        <div className="invoice-inner">
          {/* Header */}
          <div className="flex items-start justify-between gap-6 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              {company.logo_url ? (
                <img src={company.logo_url} alt="logo" className="h-16 w-16 object-contain" />
              ) : (
                <div className="h-16 w-16 rounded-lg bg-slate-900 text-white flex items-center justify-center text-2xl font-bold">{(company.name || 'E').slice(0,1)}</div>
              )}
              <div>
                <div className="text-xl font-bold text-slate-900">{company.name}</div>
                <div className="text-xs text-slate-500 mt-1 leading-5 whitespace-pre-line">{company.address}</div>
                <div className="text-xs text-slate-500 leading-5">
                  {company.phone} · {company.email}
                  {company.website ? <> · {company.website}</> : null}
                </div>
                {company.gstin && <div className="text-xs text-slate-500">GSTIN: {company.gstin}</div>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-extrabold tracking-tight text-slate-900 uppercase">Invoice</div>
              <div className="mt-2 text-sm"><span className="text-slate-500">Invoice #</span> <span className="font-semibold">{bill.invoice_no || bill.id}</span></div>
              <div className="text-sm"><span className="text-slate-500">Date</span> <span className="font-semibold">{bill.generated_at}</span></div>
              <div className="text-sm"><span className="text-slate-500">Period</span> <span className="font-semibold">{MONTH_LABEL[bill.month-1]} {bill.year}</span></div>
            </div>
          </div>

          {/* Bill To */}
          <div className="mt-6 grid grid-cols-2 gap-6">
            <div>
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Billed To</div>
              <div className="mt-1 flex items-center gap-3">
                {client.logo_url && <img src={client.logo_url} alt="" className="h-10 w-10 object-contain rounded border border-slate-200 bg-white" />}
                <div>
                  <div className="font-semibold text-slate-900">{client.name}</div>
                  <div className="text-xs text-slate-500">{client.email || ''}{client.email && client.phone ? ' · ' : ''}{client.phone || ''}</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-wider text-slate-500">Status</div>
              <div className={`mt-1 inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${bill.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>{bill.status}</div>
            </div>
          </div>

          {/* Items table */}
          <table className="invoice-table w-full mt-6 border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-10 text-left">Sl. No</th>
                <th className="text-left">File Name</th>
                <th className="text-left">Category</th>
                <th className="text-left w-24">Duration</th>
                <th className="text-left w-20">Version</th>
                <th className="text-right w-28">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-slate-500 py-6">No billable items in this period.</td></tr>
              ) : items.map((it, idx) => (
                <tr key={it.id}>
                  <td>{idx + 1}</td>
                  <td className="break-all"><span className="font-medium text-slate-800">{it.file_name}</span></td>
                  <td>{it.category}</td>
                  <td>{it.duration}</td>
                  <td className="font-mono">{it.version}</td>
                  <td className="text-right tabular-nums">₹{it.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals */}
          <div className="mt-6 flex justify-end">
            <div className="w-full max-w-sm text-sm">
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500">Total Files</span>
                <span className="font-semibold text-slate-800">{items.length}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-200">
                <span className="text-slate-500">Subtotal</span>
                <span className="font-semibold text-slate-800 tabular-nums">₹{declaredSubtotal.toLocaleString()}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Discount</span>
                  <span className="font-semibold text-slate-800 tabular-nums">- ₹{discount.toLocaleString()}</span>
                </div>
              )}
              {tax > 0 && (
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-500">Tax</span>
                  <span className="font-semibold text-slate-800 tabular-nums">₹{tax.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between mt-2 py-2 px-3 bg-slate-900 text-white rounded">
                <span className="font-semibold">Grand Total</span>
                <span className="font-bold tabular-nums">₹{grand.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-10 pt-4 border-t border-slate-200 text-xs text-slate-500">
            <p>Thank you for your business.</p>
            <p className="mt-1">This is a computer-generated invoice.</p>
          </div>
        </div>
      </div>

      <style>{`
        .invoice-page { width: 210mm; min-height: 297mm; padding: 0; box-sizing: border-box; }
        .invoice-inner { padding: 22mm 18mm; font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif; }
        .invoice-table { table-layout: fixed; word-wrap: break-word; }
        .invoice-table thead th { background: #f1f5f9; color: #0f172a; font-weight: 700; text-transform: uppercase; font-size: 11px; letter-spacing: 0.03em; border: 1px solid #e2e8f0; padding: 10px 12px; }
        .invoice-table tbody td { border: 1px solid #e2e8f0; padding: 10px 12px; vertical-align: middle; }
        .invoice-table tbody tr:nth-child(even) td { background: #f8fafc; }
        @media print {
          @page { size: A4 portrait; margin: 0; }
          html, body { background: #fff !important; }
          .no-print { display: none !important; }
          .invoice-shell { padding: 0 !important; background: #fff !important; }
          .invoice-page { box-shadow: none !important; margin: 0 !important; }
          .invoice-table thead { display: table-header-group; }
          .invoice-table tr, .invoice-table td, .invoice-table th { page-break-inside: avoid; break-inside: avoid; }
        }
      `}</style>
    </div>
  );
}
