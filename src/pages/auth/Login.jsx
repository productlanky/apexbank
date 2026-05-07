import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, AlertCircle } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebase'; 
import { useApp } from '../../context/AppContext';

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function Login() {
  const navigate = useNavigate();
  const { currentUser, userProfile, loadingAuth } = useApp(); // Global session state

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- 🛑 AUTO-REROUTE IF ALREADY LOGGED IN 🛑 ---
  useEffect(() => {
    if (!loadingAuth && currentUser && userProfile) {
      const status = (userProfile.status || userProfile.accountStatus || '').toLowerCase();
      const role = userProfile.role;

      if (status === 'suspended') {
        navigate('/suspended', { state: { reason: userProfile.suspensionReason }, replace: true });
      } else if (role === 'admin' || role === 'Administrator') {
        navigate('/controls/users', { replace: true });
      } else {
        navigate('/app/dashboard', { replace: true });
      }
    }
  }, [currentUser, userProfile, loadingAuth, navigate]);

  // --- MANUAL LOGIN LOGIC ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(''); 
    
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        const role = userData.role;
        const status = (userData.status || userData.accountStatus || "").toLowerCase();

        // 1. Enforce suspensions immediately
        if (status === 'suspended') {
          await auth.signOut();
          navigate('/suspended', { state: { reason: userData.suspensionReason }, replace: true });
          return;
        }

        // 2. Smart Router
        if (role === 'admin' || role === 'Administrator') {
          navigate('/controls/users', { replace: true });
        } else {
          navigate('/app/dashboard', { replace: true });
        }
      } else {
        navigate('/app/dashboard', { replace: true });
      }

    } catch (err) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('Invalid email or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Failed to sign in. Please check your connection.');
      }
      setIsLoading(false); // Only stop loading if there is an error
    } 
  };

  // Prevent flicker while checking session state
  if (loadingAuth || (currentUser && userProfile)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff' }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  return (
    <div className='w-full' style={{ display: 'flex', minHeight: '100vh', background: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* --- LEFT PANEL: BRANDING --- */}
      <div className="hidden md:flex" style={{ flex: 1, background: '#020617', position: 'relative', overflow: 'hidden', flexDirection: 'column', padding: '40px 60px' }}>
        
        {/* Abstract Background Glows */}
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: '-10%', left: '-20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, rgba(2,6,23,0) 60%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, rgba(2,6,23,0) 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="MidFirst Bank Logo" style={{ height: 28, width: 'auto' }} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>MidFirst Bank</span>
        </div>

        {/* Hero Copy */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 24 }}>
              Manage your <br/>capital with <span style={{ color: '#f97316' }}>precision.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, maxWidth: 480 }}>
              Log in to access your dashboard, issue virtual cards, and execute global wire transfers in seconds.
            </p>
          </motion.div>
        </div>

        {/* Minimal Footer */}
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 24 }}>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>© {new Date().getFullYear()} MidFirst Bank</span>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Support</span>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>System Status: <span style={{ color: '#10b981' }}>Operational</span></span>
        </div>
      </div>

      {/* --- RIGHT PANEL: LOGIN FORM --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', maxWidth: 600, margin: '0 auto' }}>
        
        {/* Mobile Logo */}
        <div className="md:hidden" style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="MidFirst Bank Logo" style={{ height: 24, width: 'auto' }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>MidFirst Bank</span>
        </div>

        <motion.div variants={staggerContainer} initial="hidden" animate="visible" style={{ width: '100%', maxWidth: 400 }}>
          
          <motion.div variants={fadeUp} style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: 8 }}>Welcome back</h2>
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>Enter your credentials to access your account.</p>
          </motion.div>

          <form onSubmit={handleLogin}>
            
            {/* Error Message Display */}
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: -10, height: 0 }} 
                  animate={{ opacity: 1, y: 0, height: 'auto' }} 
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  style={{ overflow: 'hidden', marginBottom: 20 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12 }}>
                    <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
                    <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 500 }}>{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Field */}
            <motion.div variants={fadeUp} style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Email Address</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                <input 
                  type="email" required
                  value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  style={{ 
                    width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, 
                    background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: 15, fontWeight: 500, 
                    outline: 'none', transition: 'border 0.2s, box-shadow 0.2s' 
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 4px rgba(234,88,12,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </motion.div>

            {/* Password Field */}
            <motion.div variants={fadeUp} style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                <input 
                  type={showPassword ? 'text' : 'password'} required
                  value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{ 
                    width: '100%', padding: '14px 44px 14px 44px', borderRadius: 14, 
                    background: '#fff', border: '1px solid #e2e8f0', color: '#0f172a', fontSize: 15, fontWeight: 500, 
                    outline: 'none', transition: 'border 0.2s, box-shadow 0.2s' 
                  }}
                  onFocus={e => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 4px rgba(234,88,12,0.1)'; }}
                  onBlur={e => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; }}
                />
                <button 
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 16, background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}
                >
                  {showPassword ? <EyeOff size={18} color="#94a3b8" /> : <Eye size={18} color="#94a3b8" />}
                </button>
              </div>
            </motion.div>

            {/* Remember Me & Forgot Password */}
            <motion.div variants={fadeUp} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" style={{ width: 16, height: 16, accentColor: '#ea580c', cursor: 'pointer' }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: '#475569' }}>Remember me</span>
              </label>
              <button type="button" style={{ background: 'none', border: 'none', color: '#ea580c', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                Forgot password?
              </button>
            </motion.div>

            {/* Submit Button */}
            <motion.div variants={fadeUp}>
              <button 
                type="submit" disabled={isLoading}
                style={{ 
                  width: '100%', padding: '16px', background: '#0f172a', color: '#fff', 
                  fontSize: 16, fontWeight: 700, borderRadius: 14, border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer', 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(15,23,42,0.15)'
                }}
                onMouseEnter={e => { if(!isLoading) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 16px rgba(15,23,42,0.2)'; }}}
                onMouseLeave={e => { if(!isLoading) { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.15)'; }}}
              >
                {isLoading ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'flex' }}>
                    <Loader2 size={20} />
                  </motion.div>
                ) : (
                  <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
            </motion.div>
          </form>

          {/* Sign Up Link */}
          <motion.div variants={fadeUp} style={{ marginTop: 32, textAlign: 'center' }}>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
              Don't have an account? <button type="button" style={{ background: 'none', border: 'none', color: '#0f172a', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Request Access</button>
            </p>
          </motion.div>

        </motion.div>
      </div>
    </div>
  );
}