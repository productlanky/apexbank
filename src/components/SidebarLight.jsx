import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Send, ArrowLeftRight,
  Landmark, Ticket, FileText, Settings, LogOut, ChevronRight,
  Download,
  CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';

const NAV = [
  { id: 'dashboard',    label: 'Dashboard',           icon: LayoutDashboard },
  { id: 'send',         label: 'Send Money',          icon: Send },
  { id: 'exchange', label: 'Exchange Money',      icon: ArrowLeftRight, key: 'exchange' }, 
  { id: 'wire',         label: 'Wire Transfer',       icon: Send,           key: 'wire' }, 
  { id: 'receive',        label: 'Receive Money',       icon: Download,       key: 'receive' },
  { id: 'cards',          label: 'My Card',            icon: CreditCard,     key: 'cards' },
  { id: 'support',      label: 'Support Tickets',     icon: Ticket,         key: 'support' },
  { id: 'transactions', label: 'Transactions Report', icon: FileText,       key: 'report' }, 
];

// Stagger animation variants for the nav list
const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

export default function SidebarLight({ active, onNav }) {
  const { userProfile } = useApp();
  const navigate = useNavigate();

  // Dynamically generate user info from Firebase Profile
  const firstName = userProfile?.firstName || 'User';
  const lastName = userProfile?.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const initials = firstName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <aside style={{
      width: 240, flexShrink: 0, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#fff',
      borderRight: '1px solid #e2e8f0',
      overflow: 'hidden',
    }}>
      {/* Top banner */}
      <div style={{
        position: 'relative', height: 170, flexShrink: 0, overflow: 'hidden',
        background: 'linear-gradient(160deg, #0f172a 0%, #1e3a5f 60%, #0f4c81 100%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        paddingBottom: 16,
      }}>
        {/* Decorative lines with a subtle infinite pulse */}
        <motion.svg 
          animate={{ opacity: [0.18, 0.3, 0.18] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} 
          viewBox="0 0 240 170" 
          preserveAspectRatio="none"
        >
          <line x1="-20" y1="60"  x2="280" y2="10"  stroke="#60a5fa" strokeWidth="1.5"/>
          <line x1="-20" y1="90"  x2="280" y2="40"  stroke="#38bdf8" strokeWidth="1"/>
          <line x1="-20" y1="120" x2="280" y2="70"  stroke="#7dd3fc" strokeWidth="1.5"/>
          <line x1="-20" y1="150" x2="280" y2="100" stroke="#60a5fa" strokeWidth="1"/>
          <line x1="-20" y1="30"  x2="280" y2="160" stroke="#bae6fd" strokeWidth="0.8"/>
          <line x1="60"  y1="0"   x2="200" y2="170" stroke="#38bdf8" strokeWidth="0.8"/>
          <line x1="120" y1="0"   x2="260" y2="170" stroke="#60a5fa" strokeWidth="1"/>
        </motion.svg>

        {/* Avatar with pop-in effect */}
        <motion.div 
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
          style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'linear-gradient(135deg, #1e40af, #3b82f6)',
            border: '3px solid rgba(255,255,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, fontWeight: 800, color: '#fff',
            marginBottom: 8, zIndex: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>
          {initials}
        </motion.div>
        <motion.p 
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          style={{ fontSize: 13.5, fontWeight: 600, color: '#fff', zIndex: 1 }}
        >
          {fullName}
        </motion.p>
      </div>

      {/* Nav */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 12px 12px' }}>
        <p style={{ fontSize: 10.5, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 6px', marginBottom: 8 }}>
          Navigations
        </p>
        <motion.nav 
          variants={listVariants} 
          initial="hidden" 
          animate="visible"
          style={{ display: 'flex', flexDirection: 'column', gap: 4 }}
        >
          {NAV.map(({ id, label, icon: Icon, arrow, key }) => {
            const targetId = key || id; 
            const isActive = active === id; // Highlighting logic remains tied to the route 'id'

            return (
              <motion.button
                variants={itemVariants}
                key={targetId}
                onClick={() => onNav(id)} // Navigation relies on the actual route 'id'
                whileHover={{ x: isActive ? 0 : 4 }}
                whileTap={{ scale: 0.98 }}
                style={{ 
                  position: 'relative',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
                  padding: '10px 12px', 
                  borderRadius: 8,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  color: isActive ? '#0f4c81' : '#475569',
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 14,
                  transition: 'color 0.2s ease',
                  zIndex: 1
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavBackground"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: '#f1f5f9',
                      borderRadius: 8,
                      zIndex: -1
                    }}
                  />
                )}

                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon size={17} strokeWidth={isActive ? 2.5 : 2} color={isActive ? '#3b82f6' : '#64748b'} />
                  {label}
                </span>
                {arrow && <ChevronRight size={14} style={{ opacity: isActive ? 0.8 : 0.4 }} />}
              </motion.button>
            );
          })}
        </motion.nav>
      </div>

      {/* Footer */}
      <div style={{ padding: '10px 12px 16px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <motion.button 
          whileHover={{ x: 4, backgroundColor: '#f8fafc' }}
          onClick={() => onNav('settings')} 
          style={{ 
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', 
            borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#475569', fontWeight: 500, fontSize: 14 
          }}
        >
          <Settings size={17} strokeWidth={2} color="#64748b" /> Settings
        </motion.button>
        <motion.button 
          onClick={handleLogout}
          whileHover={{ x: 4, backgroundColor: '#fef2f2' }}
          style={{ 
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', 
            borderRadius: 8, border: 'none', background: 'transparent', cursor: 'pointer',
            color: '#ef4444', fontWeight: 500, fontSize: 14 
          }}
        >
          <LogOut size={17} strokeWidth={2} color="#ef4444" /> Sign Out
        </motion.button>
      </div>
    </aside>
  );
}