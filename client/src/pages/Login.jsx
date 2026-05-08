import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/login', { username, password });
      login(res.data.token, res.data.username);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <h2 style={styles.title}>⚡ Electric Bill System</h2>
        <p style={styles.subtitle}>Admin Login</p>
        {error && <p style={styles.error}>{error}</p>}
        <input
          style={styles.input}
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
          required
        />
        <input
          style={styles.input}
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <button style={styles.button} disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}

const styles = {
  container: { display:'flex', justifyContent:'center', alignItems:'center', height:'100vh', background:'#f0f4f8' },
  form: { background:'#fff', padding:'2rem', borderRadius:'8px', boxShadow:'0 2px 10px rgba(0,0,0,0.1)', width:'320px', display:'flex', flexDirection:'column', gap:'1rem' },
  title: { margin:0, textAlign:'center', color:'#1a202c' },
  subtitle: { margin:0, textAlign:'center', color:'#718096', fontSize:'0.9rem' },
  input: { padding:'0.75rem', border:'1px solid #e2e8f0', borderRadius:'4px', fontSize:'1rem' },
  button: { padding:'0.75rem', background:'#3182ce', color:'#fff', border:'none', borderRadius:'4px', fontSize:'1rem', cursor:'pointer' },
  error: { color:'#e53e3e', fontSize:'0.85rem', textAlign:'center' },
};
