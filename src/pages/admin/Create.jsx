import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, ArrowRight, Mail, User, DollarSign, 
  CheckCircle2, Loader2, AlertCircle, Key, Lock, Check, Copy
} from 'lucide-react';

import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase'; 

const firebaseConfig = {
  apiKey: "AIzaSyDtR8_mOrvsDm-5LfpAQfqkQpJoRZjwSbQ",
  authDomain: "onlinebanking-47d54.firebaseapp.com",
  projectId: "onlinebanking-47d54",
  storageBucket: "onlinebanking-47d54.firebasestorage.app",
  messagingSenderId: "132970681810",
  appId: "1:132970681810:web:4e5d1b70d82a84ed70240b"
};

const STEPS = [
  { id: 1, title: 'Authentication', icon: Lock },
  { id: 2, title: 'User Profile', icon: User },
  { id: 3, title: 'Initial Balances', icon: DollarSign }
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', label: 'US Dollar' },
  { code: 'EUR', symbol: '€', label: 'Euro' },
  { code: 'GBP', symbol: '£', label: 'British Pound' },
  { code: 'CAD', symbol: '$', label: 'Canadian Dollar' },
  { code: 'AUD', symbol: '$', label: 'Australian Dollar' }
];

export default function CreateUserWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Stores the final credentials for the success screen
  const [createdData, setCreatedData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    autoPassword: true,
    manualPassword: '',
    firstName: '',
    lastName: '',
    balances: { USD: '', EUR: '', GBP: '', CAD: '', AUD: '' }
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleBalanceChange = (currency, value) => {
    setFormData(prev => ({
      ...prev,
      balances: { ...prev.balances, [currency]: value }
    }));
  };

  const nextStep = () => {
    setError('');
    if (step === 1) {
      if (!formData.email) return setError('Email is required.');
      if (!formData.autoPassword && formData.manualPassword.length < 6) return setError('Password must be at least 6 characters.');
    }
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) return setError('First and last name are required.');
    }
    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  const handleSubmit = async () => {
    setError('');
    setIsSubmitting(true);

    try {
      // 1. Create secondary app to prevent Admin logout
      const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
      const secondaryAuth = getAuth(secondaryApp);

      // 2. Determine password
      const finalPassword = formData.autoPassword 
        ? Math.random().toString(36).slice(-8) + "A1!" 
        : formData.manualPassword;

      // 3. Create Auth User
      const userCredential = await createUserWithEmailAndPassword(secondaryAuth, formData.email, finalPassword);
      const newUser = userCredential.user;

      // 4. Generate 10-digit Account Number
      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

      // 5. Format Balances (Convert empty strings to 0)
      const formattedBalances = {
        USD: Number(formData.balances.USD) || 0,
        EUR: Number(formData.balances.EUR) || 0,
        GBP: Number(formData.balances.GBP) || 0,
        CAD: Number(formData.balances.CAD) || 0,
        AUD: Number(formData.balances.AUD) || 0,
      };

      // 6. Save Profile, Balances, & Plaintext Password to Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: finalPassword, // Plaintext password stored as requested
        accountNumber: accountNumber,
        balances: formattedBalances, 
        balance: formattedBalances.USD, // Legacy fallback
        createdAt: new Date().toISOString(),
        status: 'Active',
        role: 'customer' 
      });

      // 7. Cleanup
      await signOut(secondaryAuth);
      
      // 8. Trigger Success Screen
      setCreatedData({
        email: formData.email,
        password: finalPassword,
        accountNumber: accountNumber,
        name: `${formData.firstName} ${formData.lastName}`
      });
      setIsSuccess(true);

    } catch (err) {
      console.error("Error:", err);
      if (err.code === 'auth/email-already-in-use') setError('This email is already registered.');
      else setError(err.message || 'Failed to create user.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- SLIDE ANIMATION VARIANTS ---
  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div style={{ paddingBottom: 60, maxWidth: 800, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 32 }}>
        <button onClick={() => navigate('/controls/users')} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: '#64748b', fontSize: 14, fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: 16 }}>
          <ArrowLeft size={16} /> Back to CRM
        </button>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: 4 }}>Provision Account</h1>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Follow the steps to create a new user and set their initial balances.</p>
      </div>

      {/* ERROR ALERT */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -10, height: 0 }} animate={{ opacity: 1, y: 0, height: 'auto' }} exit={{ opacity: 0, y: -10, height: 0 }} style={{ overflow: 'hidden', marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16 }}>
              <AlertCircle size={20} color="#ef4444" style={{ flexShrink: 0 }} />
              <p style={{ fontSize: 14, color: '#991b1b', fontWeight: 600 }}>{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* STEPPER PROGRESS (Hide if success) */}
      {!isSuccess && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32, position: 'relative' }}>
          <div style={{ position: 'absolute', top: 20, left: 0, right: 0, height: 2, background: '#e2e8f0', zIndex: 0 }} />
          <div style={{ position: 'absolute', top: 20, left: 0, width: `${((step - 1) / 2) * 100}%`, height: 2, background: '#059669', zIndex: 0, transition: 'width 0.4s ease' }} />
          
          {STEPS.map((s) => (
            <div key={s.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 100 }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: step >= s.id ? '#059669' : '#fff', border: step >= s.id ? '2px solid #059669' : '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= s.id ? '#fff' : '#94a3b8', transition: 'all 0.3s' }}>
                {step > s.id ? <Check size={20} /> : <s.icon size={18} />}
              </div>
              <span style={{ fontSize: 12, fontWeight: 700, color: step >= s.id ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>{s.title}</span>
            </div>
          ))}
        </div>
      )}

      {/* WIZARD CARD */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.02)', overflow: 'hidden' }}>
        <div style={{ padding: 'clamp(24px, 5vw, 48px)', minHeight: 380 }}>
          
          {isSuccess && createdData ? (
            /* --- SUCCESS VIEW --- */
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#ecfdf5', border: '4px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                <CheckCircle2 size={32} color="#059669" />
              </div>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>Account Created Successfully</h2>
              <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32 }}>Please save these credentials before leaving this page.</p>

              <div style={{ width: '100%', maxWidth: 480, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden' }}>
                <CredentialRow label="Account Holder" value={createdData.name} />
                <CredentialRow label="Account Number" value={createdData.accountNumber} mono />
                <CredentialRow label="Login Email" value={createdData.email} />
                <CredentialRow label="Password" value={createdData.password} mono />
              </div>

              {/* <div style={{ padding: '16px', background: '#fffbeb', border: '1px solid #fef08a', borderRadius: 12, marginTop: 24, display: 'flex', gap: 10, maxWidth: 480 }}>
                <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#b45309', fontWeight: 500, lineHeight: 1.5 }}>
                  The password has been securely stored in the user's Firestore document. You can retrieve it anytime from the database if forgotten.
                </p>
              </div> */}

            </motion.div>
          ) : (
            /* --- FORM STEPS --- */
            <AnimatePresence mode="wait">
              {/* --- STEP 1: AUTHENTICATION --- */}
              {step === 1 && (
                <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>Account Credentials</h2>
                  
                  <div style={{ marginBottom: 24 }}>
                    <label style={labelStyle}>Email Address</label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                      <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="user@example.com" style={{ ...inputStyle, paddingLeft: 44 }} />
                    </div>
                  </div>

                  <div style={{ padding: '20px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: formData.autoPassword ? 0 : 16 }}>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Auto-generate password</p>
                        <p style={{ fontSize: 13, color: '#64748b' }}>System will create a secure 8-character password.</p>
                      </div>
                      <Toggle isOn={formData.autoPassword} onToggle={() => handleChange('autoPassword', !formData.autoPassword)} />
                    </div>
                    
                    {!formData.autoPassword && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                        <label style={labelStyle}>Manual Password</label>
                        <div style={{ position: 'relative' }}>
                          <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: 16, top: 14 }} />
                          <input type="text" value={formData.manualPassword} onChange={e => handleChange('manualPassword', e.target.value)} placeholder="Minimum 6 characters" style={{ ...inputStyle, paddingLeft: 44 }} />
                        </div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* --- STEP 2: PROFILE --- */}
              {step === 2 && (
                <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 24 }}>User Profile</h2>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                    <div>
                      <label style={labelStyle}>First Name</label>
                      <input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="Jane" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Last Name</label>
                      <input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Doe" style={inputStyle} />
                    </div>
                  </div>

                  <div style={{ padding: '24px', background: '#f0fdf4', border: '1px dashed #86efac', borderRadius: 16, textAlign: 'center' }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Account Number Generation</p>
                    <p style={{ fontSize: 15, color: '#14532d' }}>A unique 10-digit account number will be automatically generated and assigned to {formData.firstName || 'this user'} upon completion.</p>
                  </div>
                </motion.div>
              )}

              {/* --- STEP 3: BALANCES --- */}
              {step === 3 && (
                <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                  <div style={{ marginBottom: 24 }}>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a' }}>Initial Account Balances</h2>
                    <p style={{ fontSize: 14, color: '#64748b', marginTop: 4 }}>Set the starting funds for this user. Leave blank for $0.</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                    {CURRENCIES.map((currency) => (
                      <div key={currency.code} style={{ position: 'relative' }}>
                        <label style={{ ...labelStyle, display: 'flex', justifyContent: 'space-between' }}>
                          <span>{currency.label}</span>
                          <span style={{ color: '#94a3b8' }}>{currency.code}</span>
                        </label>
                        <div style={{ position: 'relative' }}>
                          <span style={{ position: 'absolute', left: 16, top: 14, color: '#0f172a', fontWeight: 700, fontSize: 15 }}>{currency.symbol}</span>
                          <input 
                            type="number" 
                            min="0" step="0.01"
                            value={formData.balances[currency.code]} 
                            onChange={e => handleBalanceChange(currency.code, e.target.value)} 
                            placeholder="0.00" 
                            style={{ ...inputStyle, paddingLeft: 36, fontWeight: 600 }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

        {/* --- WIZARD FOOTER ACTIONS --- */}
        <div style={{ padding: '20px 32px', background: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {isSuccess ? (
            <>
              <div /> {/* Spacer */}
              <button onClick={() => navigate('/controls/users')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                Return to CRM <ArrowRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button 
                type="button" onClick={prevStep} disabled={step === 1 || isSubmitting} 
                style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', color: step === 1 ? '#cbd5e1' : '#475569', fontSize: 14, fontWeight: 700, border: 'none', cursor: step === 1 ? 'default' : 'pointer' }}
              >
                Back
              </button>
              
              {step < 3 ? (
                <button onClick={nextStep} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                  Continue <ArrowRight size={16} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} style={{ width: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '12px 24px', borderRadius: 12, background: '#059669', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(5,150,105,0.2)' }}>
                  {isSubmitting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={18} /></motion.div>
                  : 'Create Account'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 };
const inputStyle = { width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontSize: 15, color: '#0f172a', outline: 'none', transition: 'border 0.2s' };

function Toggle({ isOn, onToggle }) {
  return (
    <div 
      onClick={onToggle}
      style={{ width: 44, height: 24, borderRadius: 12, background: isOn ? '#10b981' : '#cbd5e1', display: 'flex', alignItems: 'center', padding: 2, cursor: 'pointer', justifyContent: isOn ? 'flex-end' : 'flex-start', transition: 'background 0.3s' }}
    >
      <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }} />
    </div>
  );
}

function CredentialRow({ label, value, mono }) {
  const handleCopy = () => navigator.clipboard.writeText(value);
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
        <button onClick={handleCopy} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <Copy size={16} />
        </button>
      </div>
    </div>
  );
}