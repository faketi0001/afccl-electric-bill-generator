import { useState, useEffect } from 'react';
import api from '../../api';

export default function CustomerTab() {
  const [customers, setCustomers] = useState([]);
  const [form, setForm] = useState({ name:'', address:'', meterNo:'', phone:'' });
  const [editingId, setEditingId] = useState(null);
  const [msg, setMsg] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const load = async () => {
    const res = await api.get('/customers');
    setCustomers(res.data);
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/customers/${editingId}`, form);
        setMsg('Customer updated!');
      } else {
        await api.post('/customers', form);
        setMsg('Customer added!');
      }
      setForm({ name:'', address:'', meterNo:'', phone:'' });
      setEditingId(null);
      load();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Error saving customer');
    }
  };

  const handleEdit = (c) => {
    setForm({ name:c.name, address:c.address, meterNo:c.meterNo, phone:c.phone||'' });
    setEditingId(c._id);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this customer?')) return;
    await api.delete(`/customers/${id}`);
    load();
  };

  return (
    <div>
      <h2>Customer Management</h2>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ background:'#fff', padding:'1.5rem', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', marginBottom:'2rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1rem' }}>
        <h3 style={{ gridColumn:'1/-1', margin:0 }}>{editingId ? 'Edit Customer' : 'Add Customer'}</h3>
        {msg && <p style={{ gridColumn:'1/-1', color: msg.includes('Error') || msg.includes('exists') ? '#e53e3e' : '#38a169', margin:0 }}>{msg}</p>}

        {[['name','Full Name'],['address','Address'],['meterNo','Meter Number'],['phone','Phone (optional)']].map(([field, label]) => (
          <div key={field} style={{ display:'flex', flexDirection:'column', gap:'0.25rem' }}>
            <label style={{ fontSize:'0.85rem', fontWeight:'600', color:'#4a5568' }}>{label}</label>
            <input
              value={form[field]}
              onChange={e => setForm({...form, [field]: e.target.value})}
              required={field !== 'phone'}
              style={{ padding:'0.6rem', border:'1px solid #e2e8f0', borderRadius:'4px' }}
            />
          </div>
        ))}

        <div style={{ gridColumn:'1/-1', display:'flex', gap:'0.5rem' }}>
          <button type="submit" style={{ padding:'0.6rem 1.2rem', background:'#3182ce', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
            {editingId ? 'Update' : 'Add Customer'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm({ name:'', address:'', meterNo:'', phone:'' }); }}
              style={{ padding:'0.6rem 1.2rem', background:'#a0aec0', color:'#fff', border:'none', borderRadius:'4px', cursor:'pointer' }}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Table */}
      <div style={{ marginBottom: '1rem' }}>
        <input 
          type="text" 
          placeholder="Search by Name, Meter No, or Address..." 
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{ padding: '0.5rem 1rem', border: '1px solid #e2e8f0', borderRadius: '20px', minWidth: '300px' }}
        />
      </div>
      
      <div style={{ background:'#fff', borderRadius:'8px', boxShadow:'0 1px 3px rgba(0,0,0,0.1)', overflow:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ background:'#ebf8ff' }}>
              {['Name','Address','Meter No','Phone','Actions'].map(h => (
                <th key={h} style={{ padding:'0.75rem 1rem', textAlign:'left', fontSize:'0.8rem', fontWeight:'700', color:'#2d3748', textTransform:'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {customers.filter(c => {
              if (!searchQuery) return true;
              const q = searchQuery.toLowerCase();
              return c.name?.toLowerCase().includes(q) || 
                     c.meterNo?.toLowerCase().includes(q) || 
                     c.address?.toLowerCase().includes(q);
            }).map(c => (
              <tr key={c._id} style={{ borderTop:'1px solid #e2e8f0' }}>
                <td style={{ padding:'0.75rem 1rem' }}>{c.name}</td>
                <td style={{ padding:'0.75rem 1rem', maxWidth:'200px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.address}</td>
                <td style={{ padding:'0.75rem 1rem', fontFamily:'monospace' }}>{c.meterNo}</td>
                <td style={{ padding:'0.75rem 1rem' }}>{c.phone || '-'}</td>
                <td style={{ padding:'0.75rem 1rem', display:'flex', gap:'0.5rem' }}>
                  <button onClick={() => handleEdit(c)} style={{ padding:'0.3rem 0.6rem', background:'#f6ad55', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem' }}>Edit</button>
                  <button onClick={() => handleDelete(c._id)} style={{ padding:'0.3rem 0.6rem', background:'#fc8181', border:'none', borderRadius:'4px', cursor:'pointer', fontSize:'0.8rem' }}>Delete</button>
                </td>
              </tr>
            ))}
            {customers.length === 0 && (
              <tr><td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'#a0aec0' }}>No customers yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
