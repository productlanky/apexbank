import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, Bell, ChevronDown, LogOut, Check, ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';

// --- CUSTOM TOGGLE COMPONENT ---
function Toggle({ isOn, onToggle }) {
  return (
    <motion.div 
      onClick={onToggle}
      style={{
        width: 44, height: 24, borderRadius: 12, 
        background: isOn ? '#ea580c' : '#cbd5e1', // MidFirst Orange
        display: 'flex', alignItems: 'center', padding: 2, cursor: 'pointer',
        justifyContent: isOn ? 'flex-end' : 'flex-start', transition: 'background 0.3s'
      }}
    >
      <motion.div 
        layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} 
      />
    </motion.div>
  );
}

// --- READ-ONLY DATA FIELD ---
function SettingField({ label, value }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</label>
      <div style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 15, fontWeight: 600, color: '#334155' }}>
        {value || 'Not provided'}
      </div>
    </div>
  );
}

export default function Settings() {
  const { userProfile, currentUser } = useApp();
  const navigate = useNavigate();
  
  const [expanded, setExpanded] = useState('personal'); 
  
  // --- PERSISTENT TOGGLE STATE ---
  // 1. Initialize state by checking localStorage first
  const [toggles, setToggles] = useState(() => {
    const savedPrefs = localStorage.getItem('midfirst_preferences');
    if (savedPrefs) {
      return JSON.parse(savedPrefs);
    }
    return { pushNotif: true, emailNotif: true }; // Defaults
  });

  // 2. Update state AND save to localStorage whenever clicked
  const handleToggle = (key) => {
    setToggles(prev => {
      const newToggles = { ...prev, [key]: !prev[key] };
      localStorage.setItem('midfirst_preferences', JSON.stringify(newToggles));
      return newToggles;
    });
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Safe data extraction
  const firstName = userProfile?.firstName || 'User';
  const lastName = userProfile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = firstName.charAt(0).toUpperCase();

  // Reusable accordion row wrapper
  const SettingRow = ({ id, icon: Icon, title, subtitle, children }) => {
    const isOpen = expanded === id;
    return (
      <div style={{ borderBottom: '1px solid #f1f5f9', overflow: 'hidden' }}>
        <button 
          onClick={() => setExpanded(isOpen ? null : id)}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', background: isOpen ? '#f8fafc' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s' }}
        >
          <div style={{ width: 40, height: 40, borderRadius: 12, background: isOpen ? '#ea580c' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background 0.2s' }}>
            <Icon size={20} color={isOpen ? '#fff' : '#64748b'} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a' }}>{title}</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 2 }}>{subtitle}</p>
          </div>
          <motion.div animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={18} color="#94a3b8" />
          </motion.div>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: 'easeInOut' }}>
              <div style={{ padding: '10px 20px 24px 76px' }}> 
                {children}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div style={{ minHeight: '100%', paddingBottom: 100 }}>
      {/* Header */}
      <div style={{ padding: '24px clamp(20px, 4vw, 32px)', marginBottom: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.5px' }}>Settings</h1>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Manage your account details and preferences</p>
      </div>

      <div style={{ padding: '0 clamp(20px, 4vw, 32px)', maxWidth: 760, margin: '0 auto' }}>
        
        {/* --- PROFILE CARD --- */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px', display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32, boxShadow: '0 4px 6px rgba(0,0,0,0.02)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg, #ea580c, #f97316)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)' }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {fullName}
            </p>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {currentUser?.email}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: '#fff7ed', borderRadius: 99, color: '#ea580c', fontSize: 12, fontWeight: 700, flexShrink: 0 }}>
            <Check size={14} strokeWidth={3} /> Verified
          </div>
        </div>

        {/* --- ACCOUNT SECTION --- */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12, paddingLeft: 8 }}>Account Data</p>
          <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.01)' }}>
            
            <SettingRow id="personal" icon={User} title="Profile Information" subtitle="Your registered identity details">
              <SettingField label="Full Legal Name" value={fullName} />
              <SettingField label="Registered Email" value={currentUser?.email} />
              <SettingField label="Account Number" value={userProfile?.accountNumber} />
              <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                <ShieldCheck size={18} color="#ea580c" />
                <p style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                  To change your registered email or legal name, please contact our support team.
                </p>
              </div>
            </SettingRow>

            <SettingRow id="notifications" icon={Bell} title="Notifications" subtitle="Control how we contact you">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Push Notifications</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Receive alerts on your device.</p>
                  </div>
                  <Toggle isOn={toggles.pushNotif} onToggle={() => handleToggle('pushNotif')} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: '#0f172a' }}>Email Alerts</p>
                    <p style={{ fontSize: 12, color: '#64748b' }}>Security and transfer confirmations.</p>
                  </div>
                  <Toggle isOn={toggles.emailNotif} onToggle={() => handleToggle('emailNotif')} />
                </div>
              </div>
            </SettingRow>

          </div>
        </div>

        {/* --- LOGOUT BUTTON --- */}
        <motion.button 
          onClick={handleLogout}
          whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
          style={{ width: '100%', padding: '16px', borderRadius: 16, background: '#fef2f2', border: '1px solid #fecaca', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, color: '#ef4444', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
        >
          <LogOut size={18} /> Sign Out securely
        </motion.button>
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 16, fontWeight: 500 }}>MidFirst Banking App v2.1.0</p>

      </div>
    </div>
  );
}