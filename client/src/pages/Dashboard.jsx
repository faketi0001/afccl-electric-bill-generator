import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import CustomerTab from './tabs/CustomerTab';
import ConfigTab from './tabs/ConfigTab';
import GenerateTab from './tabs/GenerateTab';
import AnalyzerTab from './tabs/AnalyzerTab';
import SettingsTab from './tabs/SettingsTab';

const TABS = [
  { id: 'customers', label: '👥 Customers' },
  { id: 'config',    label: '⚙️ Config' },
  { id: 'generate',  label: '📄 Generate Bill' },
  { id: 'analyzer',  label: '📊 Bill Analyzer' },
  { id: 'settings',  label: '🎨 Invoice Settings' },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('customers');
  const { username, logout } = useAuth();

  const renderTab = () => {
    switch (activeTab) {
      case 'customers': return <CustomerTab />;
      case 'config':    return <ConfigTab />;
      case 'generate':  return <GenerateTab />;
      case 'analyzer':  return <AnalyzerTab />;
      case 'settings':  return <SettingsTab />;
    }
  };

  return (
    <div style={styles.shell}>
      <header style={styles.header}>
        <span style={styles.logo}>⚡ Electric Bill System</span>
        <div style={styles.headerRight}>
          <span style={styles.user}>👤 {username}</span>
          <button onClick={logout} style={styles.logoutBtn}>Logout</button>
        </div>
      </header>

      <nav style={styles.nav}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{ ...styles.navBtn, ...(activeTab === tab.id ? styles.navBtnActive : {}) }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main style={styles.main}>
        {renderTab()}
      </main>
    </div>
  );
}

const styles = {
  shell: { minHeight:'100vh', background:'#f7fafc', display:'flex', flexDirection:'column' },
  header: { background:'#1a365d', color:'#fff', padding:'1rem 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  logo: { fontSize:'1.2rem', fontWeight:'bold' },
  headerRight: { display:'flex', alignItems:'center', gap:'1rem' },
  user: { fontSize:'0.9rem', opacity:0.8 },
  logoutBtn: { padding:'0.4rem 0.8rem', background:'transparent', border:'1px solid rgba(255,255,255,0.5)', color:'#fff', borderRadius:'4px', cursor:'pointer' },
  nav: { background:'#2d3748', display:'flex', gap:'0', overflowX:'auto' },
  navBtn: { padding:'0.75rem 1.2rem', background:'transparent', border:'none', color:'#a0aec0', cursor:'pointer', whiteSpace:'nowrap', borderBottom:'3px solid transparent', transition:'all 0.2s' },
  navBtnActive: { color:'#fff', borderBottomColor:'#63b3ed', background:'rgba(255,255,255,0.05)' },
  main: { flex:1, padding:'2rem', maxWidth:'1200px', margin:'0 auto', width:'100%', boxSizing:'border-box' },
};
