import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Settings, Activity, 
  Menu, X, LogOut, Zap, ShieldAlert 
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase'; // Ensure this path points to your firebase.js file

const ADMIN_LINKS = [
  { path: '/controls/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { path: '/controls/users',     icon: Users,           label: 'Manage Users' },
  { path: '/controls/create',    icon: Activity,        label: 'Create User' },
    { path: '/controls/support',    icon: Activity,        label: 'Manage Support' },
  { path: '/controls/settings',  icon: Settings,        label: 'Settings' },
];

export default function AdminShell() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  // Close mobile menu whenever the route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  // --- FIREBASE LOGOUT FUNCTION ---
  const handleLogout = async () => {
    try {
      await signOut(auth); // Tell Firebase to destroy the session
      navigate('/login');  // Redirect to login page
    } catch (error) {
      console.error("Error signing out:", error);
      // Fallback redirect just in case
      navigate('/login');
    }
  };

  const SidebarContent = () => (
    <div className='w-full' style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '24px 20px' }}>
      {/* Admin Branding */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 48, paddingLeft: 8 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.3)' }}>
          <ShieldAlert size={20} color="#fff" />
        </div>
        <div>
          <span style={{ display: 'block', fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px', lineHeight: 1.2 }}>Apex</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Portal</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
        {ADMIN_LINKS.map(({ path, icon: Icon, label }) => {
          const isActive = location.pathname.includes(path);
          return (
            <NavLink 
              key={path} to={path}
              style={{ textDecoration: 'none' }}
            >
              <div 
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, 
                  background: isActive ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'all 0.2s', cursor: 'pointer'
                }}
                onMouseEnter={e => { if(!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#fff'; }}}
                onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
              >
                <Icon size={20} color={isActive ? '#ef4444' : 'currentColor'} />
                <span style={{ fontSize: 15, fontWeight: 600 }}>{label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Admin Profile / Logout */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 24, marginTop: 'auto' }}>
        <button 
          onClick={handleLogout} // Hooked up the Firebase logout here
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', borderRadius: 14, background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
        >
          <LogOut size={20} />
          <span style={{ fontSize: 15, fontWeight: 600 }}>Exit Admin</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className='w-full' style={{ display: 'flex', height: '100vh', background: '#f8fafc', fontFamily: "'Inter', sans-serif", overflow: 'hidden' }}>
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden md:block" style={{ width: 280, background: '#0f172a', borderRight: '1px solid #1e293b', flexShrink: 0 }}>
        <SidebarContent />
      </aside>

      {/* --- MOBILE HEADER --- */}
      <div className="md:hidden" style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 72, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', zIndex: 40, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldAlert size={18} color="#fff" />
          </div>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>Apex Admin</span>
        </div>
        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>
          <Menu size={28} />
        </button>
      </div>

      {/* --- MOBILE SIDEBAR OVERLAY --- */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              onClick={() => setIsMobileMenuOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(4px)', zIndex: 50 }}
            />
            {/* Sliding Drawer */}
            <motion.div 
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              style={{ position: 'fixed', top: 0, bottom: 0, left: 0, width: 280, background: '#0f172a', zIndex: 60, boxShadow: '4px 0 24px rgba(0,0,0,0.5)' }}
            >
              <button 
                onClick={() => setIsMobileMenuOpen(false)} 
                style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
              >
                <X size={24} />
              </button>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- MAIN CONTENT AREA --- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%', overflowY: 'auto', paddingTop: 'env(safe-area-inset-top)' }}>
        {/* Spacer for mobile header */}
        <div className="md:hidden" style={{ height: 72, flexShrink: 0 }} />
        
        {/* The Outlet is where AdminDashboard, ManageUsers, etc. will render */}
        <div style={{ flex: 1, padding: 'clamp(20px, 4vw, 40px)', position: 'relative' }}>
          <Outlet />
        </div>
      </main>

    </div>
  );
}