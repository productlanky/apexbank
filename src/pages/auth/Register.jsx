import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowRight, Mail, User, CheckCircle2, Loader2, AlertCircle, 
  Key, Lock, Check, Copy, Calendar, Globe, MapPin, 
  ShieldCheck, UploadCloud, ShieldAlert, FileText, X
} from 'lucide-react';

import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase'; 

// --- CLOUDINARY CONFIGURATION ---
const CLOUDINARY_UPLOAD_PRESET = 'midfirst_app'; // e.g. "midfirst_kyc"
const CLOUDINARY_CLOUD_NAME = 'dsjxqz6hy';
const CLOUDINARY_API_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

const STEPS = [
  { id: 1, title: 'Auth', icon: Lock },
  { id: 2, title: 'Personal', icon: User },
  { id: 3, title: 'KYC', icon: ShieldCheck }
];

const DOC_TYPES = [
  { id: 'drivers_license', label: "Driver's License", requiresBack: true },
  { id: 'national_id', label: 'National ID Card', requiresBack: true },
  { id: 'passport', label: 'Passport', requiresBack: false }
];

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(''); // E.g., "Uploading documents..."
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [createdData, setCreatedData] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    dob: '',
    country: '',
    state: '',
    address: '',
    docType: 'drivers_license',
    docFront: null,
    docBack: null
  });

  const handleChange = (field, value) => setFormData(prev => ({ ...prev, [field]: value }));
  const handleFileChange = (field, file) => setFormData(prev => ({ ...prev, [field]: file }));

  const nextStep = () => {
    setError('');
    
    // Step 1 Validation
    if (step === 1) {
      if (!formData.email) return setError('Email address is required.');
      if (formData.password.length < 6) return setError('Password must be at least 6 characters.');
      if (formData.password !== formData.confirmPassword) return setError('Passwords do not match.');
    }
    
    // Step 2 Validation
    if (step === 2) {
      if (!formData.firstName || !formData.lastName) return setError('Legal name is required.');
      if (!formData.dob) return setError('Date of birth is required.');
      if (!formData.country || !formData.state || !formData.address) return setError('Full address details are required.');
    }

    setStep(s => s + 1);
  };

  const prevStep = () => {
    setError('');
    setStep(s => s - 1);
  };

  // --- CLOUDINARY UPLOAD HELPER ---
  const uploadToCloudinary = async (file) => {
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    data.append("cloud_name", CLOUDINARY_CLOUD_NAME);

    const response = await fetch(CLOUDINARY_API_URL, {
      method: "POST",
      body: data
    });

    if (!response.ok) throw new Error("Failed to upload document to secure server.");
    
    const json = await response.json();
    return json.secure_url; // The HTTPS URL of the uploaded image
  };

  const handleSubmit = async () => {
    setError('');
    
    // Final KYC Validation
    const selectedDoc = DOC_TYPES.find(d => d.id === formData.docType);
    if (!formData.docFront) return setError('Please upload the front of your document.');
    if (selectedDoc.requiresBack && !formData.docBack) return setError('Please upload the back of your document.');

    setIsSubmitting(true);

    try {
      // 1. Upload Documents to Cloudinary
      setSubmitStatus('Encrypting & uploading documents...');
      let frontUrl = '';
      let backUrl = '';

      frontUrl = await uploadToCloudinary(formData.docFront);
      if (selectedDoc.requiresBack && formData.docBack) {
        backUrl = await uploadToCloudinary(formData.docBack);
      }

      // 2. Create Firebase Auth User
      setSubmitStatus('Provisioning secure account...');
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      const accountNumber = Math.floor(1000000000 + Math.random() * 9000000000).toString();

      // 3. Save User Profile to Firestore
      await setDoc(doc(db, "users", newUser.uid), {
        uid: newUser.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        dob: formData.dob,
        country: formData.country,
        state: formData.state,
        address: formData.address,
        kycStatus: 'Pending',
        kycDocType: formData.docType,
        kycDocFront: frontUrl,
        kycDocBack: backUrl,
        accountNumber: accountNumber,
        balances: { USD: 0, EUR: 0, GBP: 0, CAD: 0, AUD: 0 }, 
        balance: 0,
        createdAt: new Date().toISOString(),
        status: 'Active',
        role: 'customer' 
      });
      
      setCreatedData({
        email: formData.email,
        accountNumber: accountNumber,
        name: `${formData.firstName} ${formData.lastName}`
      });
      setIsSuccess(true);

    } catch (err) {
      console.error("Error:", err);
      if (err.code === 'auth/email-already-in-use') setError('This email is already registered.');
      else setError(err.message || 'Failed to create account. Please verify your connection.');
    } finally {
      setIsSubmitting(false);
      setSubmitStatus('');
    }
  };

  const slideVariants = {
    enter: { opacity: 0, x: 20 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -20 }
  };

  return (
    <div className='w-full' style={{ display: 'flex', minHeight: '100vh', background: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* --- LEFT PANEL: BRANDING --- */}
      <div className="hidden md:flex" style={{ flex: 1, background: '#020617', position: 'relative', overflow: 'hidden', flexDirection: 'column', padding: '40px 60px' }}>
        <motion.div animate={{ rotate: 360, scale: [1, 1.1, 1] }} transition={{ duration: 25, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', top: '-10%', left: '-20%', width: '60vw', height: '60vw', background: 'radial-gradient(circle, rgba(234,88,12,0.15) 0%, rgba(2,6,23,0) 60%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <motion.div animate={{ rotate: -360, scale: [1, 1.2, 1] }} transition={{ duration: 30, repeat: Infinity, ease: 'linear' }} style={{ position: 'absolute', bottom: '-20%', right: '-10%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(251,146,60,0.08) 0%, rgba(2,6,23,0) 60%)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', zIndex: 10, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="MidFirst Bank Logo" style={{ height: 28, width: 'auto' }} />
          <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', color: '#fff' }}>MidFirst Bank</span>
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', zIndex: 10 }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h1 style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#fff', lineHeight: 1.1, letterSpacing: '-1px', marginBottom: 24 }}>
              Start your <br/>journey with <span style={{ color: '#f97316' }}>MidFirst.</span>
            </h1>
            <p style={{ fontSize: 18, color: '#94a3b8', lineHeight: 1.6, maxWidth: 480 }}>
              Create your account to access your personalized dashboard, issue virtual cards, and execute global wire transfers in seconds.
            </p>
          </motion.div>
        </div>

        <div style={{ position: 'relative', zIndex: 10, display: 'flex', gap: 24 }}>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>© {new Date().getFullYear()} MidFirst Bank</span>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Support</span>
          <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>System Status: <span style={{ color: '#10b981' }}>Operational</span></span>
        </div>
      </div>

      {/* --- RIGHT PANEL: WIZARD FORM --- */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px', position: 'relative', overflowY: 'auto' }}>
        
        <div className="md:hidden" style={{ position: 'absolute', top: 24, left: 24, display: 'flex', alignItems: 'center', gap: 10 }} onClick={() => navigate('/')}>
          <img src="/logo.png" alt="MidFirst Bank Logo" style={{ height: 24, width: 'auto' }} />
          <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px', color: '#0f172a' }}>MidFirst Bank</span>
        </div>

        <div style={{ width: '100%', maxWidth: 480, margin: '40px 0' }}>
          
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 32, fontWeight: 800, color: '#0f172a', letterSpacing: '-1px', marginBottom: 8 }}>
              {isSuccess ? 'Account Ready' : 'Create Account'}
            </h2>
            <p style={{ fontSize: 15, color: '#64748b', fontWeight: 500 }}>
              {isSuccess ? 'Your account has been provisioned successfully.' : 'Follow the steps to set up your secure profile.'}
            </p>
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

          {/* STEPPER PROGRESS */}
          {!isSuccess && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, position: 'relative', padding: '0 10px' }}>
              <div style={{ position: 'absolute', top: 20, left: 20, right: 20, height: 2, background: '#e2e8f0', zIndex: 0 }} />
              <div style={{ position: 'absolute', top: 20, left: 20, width: `calc(${((step - 1) / 2) * 100}% - 40px)`, height: 2, background: '#ea580c', zIndex: 0, transition: 'width 0.4s ease' }} />
              
              {STEPS.map((s) => (
                <div key={s.id} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: 60 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: step >= s.id ? '#ea580c' : '#fff', border: step >= s.id ? '2px solid #ea580c' : '2px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: step >= s.id ? '#fff' : '#94a3b8', transition: 'all 0.3s', boxShadow: step === s.id ? '0 0 0 4px rgba(234,88,12,0.1)' : 'none' }}>
                    {step > s.id ? <Check size={20} /> : <s.icon size={18} />}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: step >= s.id ? '#0f172a' : '#94a3b8', textAlign: 'center' }}>{s.title}</span>
                </div>
              ))}
            </div>
          )}

          {/* FORM AREA */}
          <div style={{ position: 'relative', minHeight: 320 }}>
            {isSuccess && createdData ? (
              /* --- SUCCESS VIEW --- */
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#fff7ed', border: '4px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <CheckCircle2 size={36} color="#ea580c" />
                </div>
                
                <div style={{ width: '100%', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', marginBottom: 24 }}>
                  <CredentialRow label="Account Holder" value={createdData.name} />
                  <CredentialRow label="Account Number" value={createdData.accountNumber} mono />
                  <CredentialRow label="Login Email" value={createdData.email} />
                </div>

                <div style={{ padding: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, display: 'flex', gap: 10, width: '100%', marginBottom: 24 }}>
                  <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#475569', fontWeight: 500, lineHeight: 1.5 }}>
                    Your KYC documents have been submitted and are currently under review. You will receive an email once verification is complete.
                  </p>
                </div>

                <button onClick={() => navigate('/login')} style={{ width: '100%', padding: '16px', borderRadius: 14, background: '#0f172a', color: '#fff', fontSize: 16, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}>
                  Proceed to Login <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              /* --- FORM STEPS --- */
              <AnimatePresence mode="wait">
                
                {/* --- STEP 1: AUTHENTICATION --- */}
                {step === 1 && (
                  <motion.div key="step1" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                        <label style={labelStyle}>Email Address</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="email" value={formData.email} onChange={e => handleChange('email', e.target.value)} placeholder="user@company.com" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                      
                      <div>
                        <label style={labelStyle}>Secure Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="password" value={formData.password} onChange={e => handleChange('password', e.target.value)} placeholder="Minimum 6 characters" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>

                      <div>
                        <label style={labelStyle}>Confirm Password</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Key size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="password" value={formData.confirmPassword} onChange={e => handleChange('confirmPassword', e.target.value)} placeholder="Repeat your password" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* --- STEP 2: PERSONAL INFO --- */}
                {step === 2 && (
                  <motion.div key="step2" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={labelStyle}>Legal First Name</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <User size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="text" value={formData.firstName} onChange={e => handleChange('firstName', e.target.value)} placeholder="Jane" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>Legal Last Name</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <User size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="text" value={formData.lastName} onChange={e => handleChange('lastName', e.target.value)} placeholder="Doe" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Date of Birth</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Calendar size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                        <input type="date" value={formData.dob} onChange={e => handleChange('dob', e.target.value)} style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                      <div>
                        <label style={labelStyle}>Country</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <Globe size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="text" value={formData.country} onChange={e => handleChange('country', e.target.value)} placeholder="e.g. United States" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                      <div>
                        <label style={labelStyle}>State / Province</label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                          <input type="text" value={formData.state} onChange={e => handleChange('state', e.target.value)} placeholder="e.g. NY" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                        </div>
                      </div>
                    </div>

                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>Full Residential Address</label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <MapPin size={18} color="#94a3b8" style={{ position: 'absolute', left: 16 }} />
                        <input type="text" value={formData.address} onChange={e => handleChange('address', e.target.value)} placeholder="Street, City, Zip Code" style={inputStyle} onFocus={handleFocus} onBlur={handleBlur} />
                      </div>
                    </div>

                  </motion.div>
                )}

                {/* --- STEP 3: KYC VERIFICATION --- */}
                {step === 3 && (
                  <motion.div key="step3" variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.3 }}>
                    
                    <div style={{ padding: '16px 20px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, display: 'flex', gap: 12, marginBottom: 24 }}>
                      <ShieldAlert size={24} color="#dc2626" style={{ flexShrink: 0 }} />
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: '#991b1b', marginBottom: 4 }}>Identity Verification Required</p>
                        <p style={{ fontSize: 13, color: '#b91c1c', lineHeight: 1.5 }}>
                          Information provided will be strictly validated. Submitting fraudulent or fabricated documents will lead to immediate account closure and forfeiture of all assets.
                        </p>
                      </div>
                    </div>

                    <div style={{ marginBottom: 24 }}>
                      <label style={labelStyle}>Document Type</label>
                      <select 
                        value={formData.docType} 
                        onChange={e => handleChange('docType', e.target.value)}
                        style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 15, fontWeight: 600, color: '#0f172a', outline: 'none', cursor: 'pointer' }}
                      >
                        {DOC_TYPES.map(doc => <option key={doc.id} value={doc.id}>{doc.label}</option>)}
                      </select>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: DOC_TYPES.find(d => d.id === formData.docType)?.requiresBack ? '1fr 1fr' : '1fr', gap: 16 }}>
                      <FileUploadBox 
                        label="Front of Document" 
                        file={formData.docFront} 
                        onChange={(f) => handleFileChange('docFront', f)} 
                      />
                      {DOC_TYPES.find(d => d.id === formData.docType)?.requiresBack && (
                        <FileUploadBox 
                          label="Back of Document" 
                          file={formData.docBack} 
                          onChange={(f) => handleFileChange('docBack', f)} 
                        />
                      )}
                    </div>

                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </div>

          {/* --- WIZARD FOOTER ACTIONS --- */}
          {!isSuccess && (
            <div style={{ marginTop: 40, display: 'flex', gap: 12 }}>
              <button 
                type="button" onClick={step === 1 ? () => navigate('/login') : prevStep} disabled={isSubmitting} 
                style={{ flex: 1, padding: '16px', borderRadius: 14, background: '#f1f5f9', color: '#475569', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', transition: 'background 0.2s' }}
              >
                {step === 1 ? 'Cancel' : 'Back'}
              </button>
              
              {step < 3 ? (
                <button onClick={nextStep} style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', borderRadius: 14, background: '#0f172a', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  Continue <ArrowRight size={18} />
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={isSubmitting} style={{ flex: 2, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '16px', borderRadius: 14, background: '#ea580c', color: '#fff', fontSize: 15, fontWeight: 700, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', boxShadow: '0 4px 12px rgba(234,88,12,0.2)', transition: 'transform 0.2s' }} onMouseEnter={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(-2px)'}} onMouseLeave={e => { if(!isSubmitting) e.currentTarget.style.transform = 'translateY(0)'}}>
                  {isSubmitting ? (
                    <>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><Loader2 size={18} /></motion.div>
                      <span>{submitStatus || 'Processing...'}</span>
                    </>
                  ) : 'Submit Application'}
                </button>
              )}
            </div>
          )}

          {/* Sign In Link */}
          {!isSuccess && step === 1 && (
            <div style={{ marginTop: 32, textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>
                Already have an account? <button type="button" onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: '#ea580c', fontWeight: 800, cursor: 'pointer', padding: 0 }}>Sign In</button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── REUSABLE UI ──────────────────────────────────────────────────────────────

const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 };

// Base input style, focus handlers below
const inputStyle = { width: '100%', padding: '14px 16px 14px 44px', borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff', fontSize: 15, color: '#0f172a', outline: 'none', transition: 'border 0.2s, box-shadow 0.2s' };
const handleFocus = (e) => { e.target.style.borderColor = '#ea580c'; e.target.style.boxShadow = '0 0 0 4px rgba(234,88,12,0.1)'; };
const handleBlur = (e) => { e.target.style.borderColor = '#e2e8f0'; e.target.style.boxShadow = 'none'; };

function CredentialRow({ label, value, mono }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
      <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{label}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: mono ? 'monospace' : 'inherit' }}>{value}</span>
        <button onClick={handleCopy} title="Copy" style={{ background: 'none', border: 'none', cursor: 'pointer', color: copied ? '#ea580c' : '#94a3b8', display: 'flex', transition: 'color 0.2s' }}>
          {copied ? <Check size={16} /> : <Copy size={16} />}
        </button>
      </div>
    </div>
  );
}

// Interactive Premium Dropzone with Image Preview
function FileUploadBox({ label, file, onChange }) {
  const fileInputRef = useRef(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (file && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [file]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      onChange(e.target.files[0]);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div 
        onClick={() => !file && fileInputRef.current?.click()}
        style={{
          position: 'relative',
          border: `2px dashed ${file ? '#ea580c' : '#cbd5e1'}`,
          background: file ? '#fff' : '#f8fafc',
          borderRadius: 16, height: 180, textAlign: 'center', cursor: file ? 'default' : 'pointer',
          transition: 'all 0.2s ease', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
        }}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept="image/*"
          onChange={handleFileChange}
        />
        
        {file ? (
          <>
            {previewUrl ? (
              <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <FileText size={32} color="#ea580c" style={{ marginBottom: 8 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>File selected</p>
              </div>
            )}
            
            {/* Overlay to remove file */}
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
                 onMouseEnter={e => e.currentTarget.style.opacity = 1}
                 onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >
              <button 
                type="button"
                onClick={handleClear}
                style={{ background: '#fff', border: 'none', borderRadius: 99, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700, color: '#dc2626', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              >
                <X size={16} /> Remove
              </button>
            </div>
          </>
        ) : (
          <>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
              <UploadCloud size={24} color="#ea580c" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Click to upload</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>JPEG or PNG</p>
          </>
        )}
      </div>
    </div>
  );
}