import { useState, useEffect } from 'react';
import api from '../../api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

export default function AnalyzerTab() {
  const [invoices, setInvoices] = useState([]);
  const [filter, setFilter]     = useState('all'); // all | paid | unpaid
  const [monthFilter, setMonthFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [settings, setSettings] = useState({});

  const load = async () => {
    const [inv, s] = await Promise.all([api.get('/invoices'), api.get('/settings')]);
    setInvoices(inv.data);
    setSettings(s.data);
  };

  useEffect(() => { load(); }, []);

  const filtered = invoices.filter(i => {
    if (filter !== 'all' && i.status !== filter) return false;
    if (monthFilter && i.billMonth !== monthFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const match = 
        i.invoiceNo?.toLowerCase().includes(q) ||
        i.customer?.name?.toLowerCase().includes(q) ||
        i.customer?.meterNo?.toLowerCase().includes(q) ||
        i.customer?.address?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const toggleStatus = async (inv) => {
    const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
    await api.patch(`/invoices/${inv._id}/status`, { status: newStatus });
    load();
  };

  const handleDownload = (invoice, withSeal = false) => {
    generateInvoicePDF(invoice, settings, withSeal);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this invoice?')) return;
    await api.delete(`/invoices/${id}`);
    load();
  };

  // Summary stats
  const totalUnpaid = invoices.filter(i => i.status === 'unpaid').reduce((s,i) => s + i.totalAmount, 0);
  const totalPaid   = invoices.filter(i => i.status === 'paid').reduce((s,i) => s + i.totalAmount, 0);

  return (
    <div>
      <h2>Bill Analyzer</h2>

      {/* Stats cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem', marginBottom:'2rem' }}>
        {[
          { label:'Total Invoices', value: invoices.length, color:'#3182ce' },
          { label:'Paid (BDT)', value:`৳ ${totalPaid.toFixed(2)}`, color:'#38a169' },
          { label:'Unpaid (BDT)', value:`৳ ${totalUnpaid.toFixed(2)}`, color:'#e53e3e' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', padding:'1.25rem', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', borderLeft:`4px solid ${s.color}` }}>
            <div style={{ color:'#718096', fontSize:'0.8rem', textTransform:'uppercase', letterSpacing:'0.05em' }}>{s.label}</div>
            <div style={{ fontSize:'1.5rem', fontWeight:'700', color:s.color, marginTop:'0.25rem' }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter and Search */}
      <div style={{ display:'flex', gap:'1rem', marginBottom:'1rem', flexWrap:'wrap', alignItems:'center' }}>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {['all','paid','unpaid'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding:'0.4rem 1rem', border:'1px solid #e2e8f0', borderRadius:'20px', cursor:'pointer', background: filter===f ? '#3182ce' : '#fff', color: filter===f ? '#fff' : '#4a5568', fontWeight: filter===f ? '600' : '400' }}>
              {f.charAt(0).toUpperCase()+f.slice(1)}
            </button>
          ))}
        </div>
        
        <input 
          type="month" 
          value={monthFilter} 
          onChange={e => setMonthFilter(e.target.value)} 
          style={{ padding: '0.4rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '4px' }}
        />

        <input 
          type="text" 
          placeholder="Search Invoice, Name, Meter, Address..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.4rem 0.8rem', border: '1px solid #e2e8f0', borderRadius: '20px', minWidth: '280px' }}
        />
      </div>

      {/* Table */}
      <div style={{ background:'#fff', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.9rem' }}>
          <thead>
            <tr style={{ background:'#ebf8ff' }}>
              {['Invoice No','Customer','Meter','Month','Total (BDT)','Status','Paid Date','Actions'].map(h => (
                <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.75rem', fontWeight:'700', color:'#2d3748', textTransform:'uppercase', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(inv => (
              <tr key={inv._id} style={{ borderTop:'1px solid #e2e8f0' }}>
                <td style={{ padding:'0.6rem 1rem', fontFamily:'monospace', fontSize:'0.8rem' }}>{inv.invoiceNo}</td>
                <td style={{ padding:'0.6rem 1rem' }}>{inv.customer?.name}</td>
                <td style={{ padding:'0.6rem 1rem', fontFamily:'monospace', fontSize:'0.8rem' }}>{inv.customer?.meterNo}</td>
                <td style={{ padding:'0.6rem 1rem' }}>{inv.billMonth}</td>
                <td style={{ padding:'0.6rem 1rem', fontFamily:'monospace', fontWeight:'600' }}>৳ {inv.totalAmount?.toFixed(2)}</td>
                <td style={{ padding:'0.6rem 1rem' }}>
                  <span style={{ padding:'0.2rem 0.6rem', borderRadius:'12px', fontSize:'0.75rem', fontWeight:'600', background: inv.status==='paid' ? '#c6f6d5' : '#fed7d7', color: inv.status==='paid' ? '#22543d' : '#742a2a' }}>
                    {inv.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding:'0.6rem 1rem', fontSize:'0.8rem' }}>
                  {inv.paidAt ? new Date(inv.paidAt).toLocaleDateString() : '-'}
                </td>
                <td style={{ padding:'0.6rem 1rem', display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
                  <button onClick={() => handleDownload(inv, false)} style={btnSm('#3182ce')}>PDF</button>
                  {inv.status === 'paid' && (
                    <button onClick={() => handleDownload(inv, true)} style={btnSm('#2f855a')}>PAID PDF</button>
                  )}
                  <button onClick={() => toggleStatus(inv)} style={btnSm(inv.status==='paid' ? '#d69e2e' : '#38a169')}>
                    {inv.status==='paid' ? 'Unpaid' : 'Mark Paid'}
                  </button>
                  <button onClick={() => handleDelete(inv._id)} style={btnSm('#e53e3e')}>Del</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={8} style={{ padding:'2rem', textAlign:'center', color:'#a0aec0' }}>No invoices found</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const btnSm = (bg) => ({ padding:'0.25rem 0.5rem', background:bg, color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'0.75rem', whiteSpace:'nowrap' });
