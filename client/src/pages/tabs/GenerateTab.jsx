import { useState, useEffect } from 'react';
import api from '../../api';
import { generateInvoicePDF } from '../../utils/pdfGenerator';

export default function GenerateTab() {
  const [customers, setCustomers] = useState([]);
  const [config, setConfig]       = useState({});
  const [settings, setSettings]   = useState({});
  const [form, setForm] = useState({
    customerId: '', billMonth: '', previousReading: '', currentReading: '',
    fine: 0, fineNote: '', dueDate: ''
  });
  const [preview, setPreview] = useState(null);
  const [msg, setMsg] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  useEffect(() => {
    Promise.all([
      api.get('/customers'),
      api.get('/config'),
      api.get('/settings'),
    ]).then(([c, cf, s]) => {
      setCustomers(c.data);
      setConfig(cf.data);
      setSettings(s.data);
    });
  }, []);

  // Live calculation preview
  useEffect(() => {
    if (!form.previousReading || !form.currentReading || !config.ratePerUnit) return;
    const units = Number(form.currentReading) - Number(form.previousReading);
    if (units < 0) return;
    const unitCharge = units * config.ratePerUnit;
    const subtotal = unitCharge + Number(config.serviceCharge || 0) + Number(form.fine || 0);
    const vatAmount = (subtotal * (config.vatPercent || 0)) / 100;
    const total = subtotal + vatAmount;
    setPreview({ units, unitCharge, vatAmount, total });
  }, [form.previousReading, form.currentReading, form.fine, config]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('/invoices', {
        customer: form.customerId,
        billMonth: form.billMonth,
        previousReading: Number(form.previousReading),
        currentReading: Number(form.currentReading),
        ratePerUnit: config.ratePerUnit,
        serviceCharge: config.serviceCharge || 0,
        vatPercent: config.vatPercent || 0,
        fine: Number(form.fine || 0),
        fineNote: form.fineNote,
        dueDate: form.dueDate || null,
      });
      setMsg(`Invoice ${res.data.invoiceNo} created!`);

      // Auto-download PDF
      generateInvoicePDF(res.data, settings);
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error creating invoice');
    }
  };

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'2rem' }}>
      <div>
        <h2>Generate New Bill</h2>
        <form onSubmit={handleSubmit} style={{ background:'#fff', padding:'1.5rem', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:'1rem' }}>
          {msg && <p style={{ color: msg.includes('Error') ? '#e53e3e' : '#38a169', margin:0 }}>{msg}</p>}

          <label style={lbl}>
            Customer Search (Name or Meter No)
            <input 
              type="text" 
              list="customer-options"
              value={customerSearch}
              onChange={e => {
                setCustomerSearch(e.target.value);
                const found = customers.find(c => `${c.name} — ${c.meterNo}` === e.target.value);
                setForm({...form, customerId: found ? found._id : ''});
              }}
              style={inp} 
              placeholder="Type to search..." 
              required 
            />
            <datalist id="customer-options">
              {customers.map(c => <option key={c._id} value={`${c.name} — ${c.meterNo}`} />)}
            </datalist>
          </label>

          <label style={lbl}>
            Bill Month
            <input type="month" value={form.billMonth} onChange={e => setForm({...form, billMonth:e.target.value})} style={inp} required />
          </label>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.75rem' }}>
            <label style={lbl}>
              Previous Reading (kWh)
              <input type="number" value={form.previousReading} onChange={e => setForm({...form, previousReading:e.target.value})} style={inp} required />
            </label>
            <label style={lbl}>
              Current Reading (kWh)
              <input type="number" value={form.currentReading} onChange={e => setForm({...form, currentReading:e.target.value})} style={inp} required />
            </label>
          </div>

          <label style={lbl}>
            Fine Amount (BDT — optional)
            <input type="number" min="0" step="0.01" value={form.fine}
              onChange={e => setForm({...form, fine:e.target.value})} style={inp} />
          </label>

          <label style={lbl}>
            Fine Note (optional)
            <input value={form.fineNote} onChange={e => setForm({...form, fineNote:e.target.value})} style={inp} placeholder="e.g. Late payment penalty" />
          </label>

          <label style={lbl}>
            Due Date
            <input type="date" value={form.dueDate} onChange={e => setForm({...form, dueDate:e.target.value})} style={inp} required />
          </label>

          <button type="submit" style={{ padding:'0.75rem', background:'#2f855a', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'600', fontSize:'1rem' }}>
            Generate & Download PDF
          </button>
        </form>
      </div>

      {/* Calculation Preview */}
      <div>
        <h2>Bill Summary</h2>
        {preview ? (
          <div style={{ background:'#fff', padding:'1.5rem', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              {[
                ['Units Consumed', `${preview.units} kWh`],
                [`Rate per Unit`, `৳ ${config.ratePerUnit}`],
                [`Unit Charge`, `৳ ${preview.unitCharge.toFixed(2)}`],
                [`Service Charge`, `৳ ${(config.serviceCharge||0).toFixed(2)}`],
                [`Fine`, `৳ ${Number(form.fine||0).toFixed(2)}`],
                [`VAT (${config.vatPercent}%)`, `৳ ${preview.vatAmount.toFixed(2)}`],
              ].map(([k,v]) => (
                <tr key={k}><td style={{ padding:'0.5rem 0', color:'#718096' }}>{k}</td><td style={{ textAlign:'right', fontFamily:'monospace' }}>{v}</td></tr>
              ))}
              <tr style={{ borderTop:'2px solid #e2e8f0' }}>
                <td style={{ padding:'0.75rem 0', fontWeight:'700', fontSize:'1.2rem' }}>Total Payable</td>
                <td style={{ textAlign:'right', fontWeight:'700', fontSize:'1.2rem', color:'#2b6cb0' }}>৳ {preview.total.toFixed(2)}</td>
              </tr>
            </table>
          </div>
        ) : (
          <div style={{ background:'#fff', padding:'2rem', borderRadius:'8px', color:'#a0aec0', textAlign:'center', boxShadow:'0 1px 3px rgba(0,0,0,0.1)' }}>
            Enter meter readings to see bill summary
          </div>
        )}
      </div>
    </div>
  );
}

const lbl = { display:'flex', flexDirection:'column', gap:'0.25rem', fontSize:'0.85rem', fontWeight:'600', color:'#4a5568' };
const inp = { padding:'0.6rem', border:'1px solid #e2e8f0', borderRadius:'4px', fontSize:'0.95rem', fontWeight:'400' };
