import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { AlertOctagon, Mail, LogOut, ShieldAlert } from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';

export default function Suspended() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Grab the reason from the router state, or provide a default fallback
  const reason = location.state?.reason || "Your account has been suspended for security reasons or a violation of our terms of service.";

  // 🛑 KILL THE SESSION IMMEDIATELY UPON ARRIVAL
  useEffect(() => {
    signOut(auth).catch(err => console.error("Error signing out suspended user:", err));
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth); // Double-tap the logout just to be certain
      navigate('/login');
    } catch (error) {
      console.error("Logout failed", error);
      navigate('/login');
    }
  };

  return (
    <div className='w-full' style={{ display: 'flex', minHeight: '100vh', background: '#f8fafc', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', sans-serif" }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }} 
        transition={{ duration: 0.4, type: "spring", stiffness: 200, damping: 20 }}
        style={{ width: '100%', maxWidth: 480, background: '#fff', padding: '40px 32px', borderRadius: 24, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0', textAlign: 'center' }}
      >
        <div style={{ width: 80, height: 80, background: '#fef2f2', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '8px solid #fee2e2' }}>
          <AlertOctagon size={32} color="#dc2626" />
        </div>
        
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 8 }}>Account Suspended</h1>
        <p style={{ fontSize: 15, color: '#64748b', lineHeight: 1.6, marginBottom: 32 }}>
          Your access to the Apex platform has been temporarily restricted by our administrative team.
        </p>

        {/* Reason Box */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 24, textAlign: 'left', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <ShieldAlert size={16} color="#475569" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason for Restriction</span>
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0f172a', lineHeight: 1.5 }}>
            "{reason}"
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <a 
            href="mailto:support@apex-financial.com" 
            style={{ width: '100%', padding: '16px', background: '#0f172a', color: '#fff', fontSize: 15, fontWeight: 700, borderRadius: 14, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background 0.2s', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}
          >
            <Mail size={18} /> Contact Support Team
          </a>
          
          <button 
            onClick={handleLogout}
            style={{ width: '100%', padding: '16px', background: 'transparent', color: '#64748b', fontSize: 15, fontWeight: 700, borderRadius: 14, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            <LogOut size={18} /> Sign Out
          </button>
        </div>

      </motion.div>
    </div>
  );
}