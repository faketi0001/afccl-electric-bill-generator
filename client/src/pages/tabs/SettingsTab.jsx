import { useState, useEffect } from 'react';
import api from '../../api';

export default function SettingsTab() {
  const [form, setForm] = useState({
    companyName:'', companyAddress:'', companyPhone:'', companyEmail:'',
    logoBase64:'', logoMimeType:'image/png',
    footerText:'', invoiceTitle:'ELECTRICITY BILL'
  });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/settings').then(res => setForm(res.data));
  }, []);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      setForm(f => ({ ...f, logoBase64: base64, logoMimeType: file.type }));
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await api.put('/settings', form);
      setMsg('Settings saved!');
    } catch {
      setMsg('Error saving settings');
    }
  };

  return (
    <div>
      <h2>Invoice Settings</h2>
      <form onSubmit={handleSave} style={{ background:'#fff', padding:'1.5rem', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem', maxWidth:'700px' }}>
        {msg && <p style={{ gridColumn:'1/-1', color:'#38a169', margin:0 }}>{msg}</p>}

        {[
          ['invoiceTitle','Invoice Title'],['companyName','Company Name'],
          ['companyAddress','Company Address'],['companyPhone','Phone'],
          ['companyEmail','Email'],
        ].map(([field,label]) => (
          <label key={field} style={lbl}>
            {label}
            <input value={form[field]||''} onChange={e => setForm({...form,[field]:e.target.value})} style={inp} />
          </label>
        ))}

        <label style={{ ...lbl, gridColumn:'1/-1' }}>
          Footer Text
          <textarea value={form.footerText||''} onChange={e => setForm({...form,footerText:e.target.value})} style={{ ...inp, height:'80px', resize:'vertical' }} />
        </label>

        <div style={{ gridColumn:'1/-1' }}>
          <label style={lbl}>
            Company Logo (PNG/JPG)
            <input type="file" accept="image/png,image/jpeg" onChange={handleLogoUpload} style={{ fontSize:'0.9rem' }} />
          </label>
          {form.logoBase64 && (
            <img src={`data:${form.logoMimeType};base64,${form.logoBase64}`} alt="Logo preview"
              style={{ maxHeight:'80px', marginTop:'0.5rem', border:'1px solid #e2e8f0', borderRadius:'4px', padding:'4px' }} />
          )}
        </div>

        <div style={{ gridColumn:'1/-1' }}>
          <button type="submit" style={{ padding:'0.75rem 1.5rem', background:'#3182ce', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer', fontWeight:'600' }}>
            Save Settings
          </button>
        </div>
      </form>
    </div>
  );
}

const lbl = { display:'flex', flexDirection:'column', gap:'0.25rem', fontSize:'0.85rem', fontWeight:'600', color:'#4a5568' };
const inp = { padding:'0.6rem', border:'1px solid #e2e8f0', borderRadius:'4px', fontSize:'0.95rem', fontWeight:'400' };
