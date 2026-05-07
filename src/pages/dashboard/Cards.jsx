import { useState, useEffect } from 'react';
import { Eye, EyeOff, Copy, Check, Lock, Unlock, Leaf, Plus, CreditCard, Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { doc, updateDoc, arrayUnion, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useApp } from '../../context/AppContext';

// --- HELPERS ---
const fmt = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD = s => new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function Cards() {
  const { userProfile, currentUser, loadingAuth } = useApp();
  
  const [showModal, setShowModal] = useState(false);
  const [isIssuing, setIsIssuing] = useState(false);
  const [issueStep, setIssueStep] = useState(''); 
  const [issueError, setIssueError] = useState('');
  
  // --- NEW: CARD SELECTOR STATE ---
  const [activeCardIndex, setActiveCardIndex] = useState(0);

  if (loadingAuth || !userProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  const cards = userProfile.cards || [];
  const currentUsdBalance = Number(userProfile.balances?.USD || 0);
  const ISSUANCE_FEE = 3.00;

  // Safe fallback if active index is somehow out of bounds
  const activeCard = cards[activeCardIndex] || cards[0];

  // --- REALISTIC ISSUE NEW CARD LOGIC ---
  const handleConfirmIssuance = async () => {
    setIssueError('');
    setIsIssuing(true);
    
    try {
      if (currentUsdBalance < ISSUANCE_FEE) {
        throw new Error(`Insufficient funds. You need at least ${fmt(ISSUANCE_FEE)} USD.`);
      }

      setIssueStep('Contacting Mastercard network...');
      await new Promise(r => setTimeout(r, 1200)); 

      setIssueStep('Provisioning secure numbers...');
      await new Promise(r => setTimeout(r, 1000)); 

      const newCardNumber = `4521 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)}`;
      const cvv = Math.floor(100 + Math.random() * 900).toString();
      const expYear = new Date().getFullYear() + 3;
      const expMonth = String(new Date().getMonth() + 1).padStart(2, '0');
      
      const newCard = {
        id: Date.now().toString(),
        cardNumber: newCardNumber,
        cvv: cvv,
        expiry: `${expMonth}/${String(expYear).slice(-2)}`,
        isLocked: false,
        limit: 5000,
        spent: 0,
        brand: 'Mastercard',
        type: 'Virtual Debit',
        createdAt: new Date().toISOString(),
        cardTransactions: [] 
      };

      const newBalances = {
        ...userProfile.balances,
        USD: currentUsdBalance - ISSUANCE_FEE
      };

      await updateDoc(doc(db, 'users', currentUser.uid), {
        cards: arrayUnion(newCard),
        balances: newBalances,
        balance: newBalances.USD 
      });

      await addDoc(collection(db, 'transactions'), {
        userId: currentUser.uid,
        type: 'debit',
        name: 'Virtual Card Issuance Fee',
        avatar: '💳',
        amount: ISSUANCE_FEE,
        currency: 'USD',
        date: new Date().toISOString(),
        category: 'Fee',
        status: 'Completed',
        timestamp: serverTimestamp()
      });
      
      // Automatically switch to the newly created card
      setActiveCardIndex(cards.length);
      setShowModal(false);
    } catch (error) {
      console.error("Failed to issue card:", error);
      setIssueError(error.message || "Failed to connect to issuance server.");
    } finally {
      setIsIssuing(false);
      setIssueStep('');
    }
  };

  const toggleCardLock = async (targetCardId, currentLockState) => {
    try {
      const updatedCards = cards.map(c => 
        c.id === targetCardId ? { ...c, isLocked: !currentLockState } : c
      );
      await updateDoc(doc(db, 'users', currentUser.uid), { cards: updatedCards });
    } catch (error) {
      console.error("Failed to update lock status:", error);
    }
  };

  return (
    <div style={{ paddingBottom: 100, fontFamily: "'Inter', sans-serif" }}>
      
      {/* --- ISSUANCE MODAL --- */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000 }} onClick={() => !isIssuing && setShowModal(false)} />
            <motion.div className='fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2' initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} style={{background: '#fff', borderRadius: 24, padding: 32, width: '90%', maxWidth: 420, zIndex: 1001, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
              
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff7ed', border: '4px solid #ffedd5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <CreditCard size={28} color="#ea580c" />
              </div>

              <h2 style={{ fontSize: 22, fontWeight: 800, color: '#0f172a', marginBottom: 8, letterSpacing: '-0.5px' }}>Issue Virtual Card</h2>
              <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>Instantly generate a secure Mastercard for online purchases. The issuance fee will be deducted from your USD balance.</p>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 16, padding: 20, marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottom: '1px solid #e2e8f0' }}>
                  <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>Current Balance</span>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{fmt(currentUsdBalance)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, color: '#475569', fontWeight: 600 }}>Issuance Fee</span>
                  <span style={{ fontSize: 16, fontWeight: 800, color: '#dc2626' }}>-{fmt(ISSUANCE_FEE)}</span>
                </div>
              </div>

              {issueError && (
                <div style={{ padding: '12px 16px', background: '#fef2f2', borderRadius: 12, border: '1px solid #fecaca', display: 'flex', gap: 10, marginBottom: 24 }}>
                  <AlertCircle size={18} color="#dc2626" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: '#991b1b', fontWeight: 500, lineHeight: 1.4 }}>{issueError}</p>
                </div>
              )}

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowModal(false)} disabled={isIssuing} style={{ flex: 1, padding: '16px', background: '#f1f5f9', color: '#475569', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: isIssuing ? 'not-allowed' : 'pointer', transition: 'background 0.2s' }}>Cancel</button>
                <button onClick={handleConfirmIssuance} disabled={isIssuing} style={{ flex: 2, padding: '16px', background: '#ea580c', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 700, border: 'none', cursor: isIssuing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)' }}>
                  {isIssuing ? (
                    <><Loader2 size={18} className="animate-spin" /> {issueStep}</>
                  ) : (
                    <><ShieldCheck size={18} /> Confirm & Issue</>
                  )}
                </button>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* --- PAGE HEADER --- */}
      <div style={{ padding: '24px clamp(20px, 4vw, 32px)', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={20} color="#fb923c" />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Cards</h1>
            </div>
            <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginLeft: 48 }}>Manage your virtual debit cards.</p>
          </div>
          
          <button 
            onClick={() => { setIssueError(''); setShowModal(true); }}
            style={{ padding: '12px 20px', background: '#0f172a', color: '#fff', borderRadius: 14, fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}
          >
            <Plus size={16} /> Issue New Card
          </button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div style={{ padding: '0 clamp(20px, 4vw, 32px)', maxWidth: 1000, margin: '0 auto' }}>
        {cards.length === 0 ? (
          /* EMPTY STATE */
          <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ background: '#fff', border: '1px dashed #cbd5e1', borderRadius: 24, padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
              <CreditCard size={32} color="#94a3b8" />
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 8 }}>No Active Cards</h2>
            <p style={{ fontSize: 15, color: '#64748b', marginBottom: 32, maxWidth: 300, lineHeight: 1.5 }}>You haven't issued any virtual cards yet. Generate one instantly to start spending securely online.</p>
            <button 
              onClick={() => { setIssueError(''); setShowModal(true); }} 
              style={{ padding: '16px 32px', background: '#0f172a', color: '#fff', borderRadius: 16, fontSize: 15, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}
            >
              <Plus size={18} /> Issue Virtual Card
            </button>
          </motion.div>
        ) : (
          /* RENDER SINGLE ACTIVE CARD */
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* --- CARD SELECTOR (Only show if multiple cards) --- */}
            {cards.length > 1 && (
              <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollbarWidth: 'none' }}>
                {cards.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => setActiveCardIndex(idx)}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 99,
                      whiteSpace: 'nowrap',
                      fontSize: 14,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      background: activeCardIndex === idx ? '#0f172a' : '#fff',
                      color: activeCardIndex === idx ? '#fff' : '#64748b',
                      border: `1px solid ${activeCardIndex === idx ? '#0f172a' : '#e2e8f0'}`,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      boxShadow: activeCardIndex === idx ? '0 4px 12px rgba(15,23,42,0.1)' : '0 2px 4px rgba(0,0,0,0.02)'
                    }}
                  >
                    <CreditCard size={16} />
                    •• {c.cardNumber.slice(-4)}
                    {c.isLocked && <Lock size={12} color={activeCardIndex === idx ? '#f87171' : '#dc2626'} />}
                  </button>
                ))}
              </div>
            )}

            {/* --- ACTIVE VIRTUAL CARD --- */}
            <AnimatePresence mode="wait">
              {activeCard && (
                <VirtualCard 
                  key={activeCard.id} 
                  card={activeCard} 
                  userProfile={userProfile} 
                  onToggleLock={() => toggleCardLock(activeCard.id, activeCard.isLocked)}
                />
              )}
            </AnimatePresence>

          </div>
        )}
      </div>
    </div>
  );
}

// ─── INDIVIDUAL CARD COMPONENT ────────────────────────────────────────────────
function VirtualCard({ card, userProfile, onToggleLock }) {
  const [reveal, setReveal]   = useState(false);
  const [copied, setCopied]   = useState(false);
  const [flipped, setFlipped] = useState(false);

  const fullName = `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim().toUpperCase() || 'VALUED CUSTOMER';
  const maskedNumber = `•••• •••• •••• ${card.cardNumber.slice(-4)}`;
  const spentPct = Math.min((card.spent / card.limit) * 100, 100);
  
  // Isolate transactions specific to this card
  const cardTransactions = card.cardTransactions || [];

  function copyCardNumber() {
    if (card.isLocked) return;
    navigator.clipboard.writeText(card.cardNumber.replace(/\s/g, '')).catch(() => {});
    setCopied(true); 
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24 }}
    >
      
      {/* --- LEFT: INTERACTIVE CARD --- */}
      <div>
        {/* 3D Flipping Card Container */}
        <div 
          onClick={() => setFlipped(f => !f)}
          style={{ width: '100%', aspectRatio: '1.586', position: 'relative', cursor: 'pointer', marginBottom: 20, perspective: 1000, transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: card.isLocked 
              ? 'linear-gradient(135deg, #1e293b, #0f172a)' 
              : 'linear-gradient(135deg, #431407 0%, #7c2d12 45%, #9a3412 100%)',
            padding: 'clamp(20px,4vw,32px)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
            boxShadow: card.isLocked ? '0 10px 30px rgba(0,0,0,0.1)' : '0 20px 40px rgba(234,88,12,0.2)',
            transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            backfaceVisibility: 'hidden', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden',
          }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,146,60,0.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
            
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Leaf size={16} color="#fb923c" fill="#fb923c" />
                <span style={{ fontSize: 16, fontWeight: 800, color: '#fb923c', letterSpacing: '0.05em' }}>MIDFIRST</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 16, fontWeight: 800, color: '#fff', letterSpacing: '0.05em', opacity: 0.9 }}>{card.brand}</p>
                {card.isLocked && <p style={{ fontSize: 11, color: '#f87171', fontWeight: 700, marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><Lock size={10} /> Locked</p>}
              </div>
            </div>

            <div style={{ position: 'relative' }}>
              <div style={{ width: 44, height: 32, borderRadius: 6, background: 'linear-gradient(135deg, #fcd34d, #d97706)', marginBottom: 20 }} />
              <p style={{ fontFamily: 'monospace', fontSize: 'clamp(16px, 4vw, 22px)', color: '#fff', letterSpacing: '0.15em', fontWeight: 500, textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>
                {reveal && !card.isLocked ? card.cardNumber : maskedNumber}
              </p>
            </div>

            <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 4 }}>CARDHOLDER</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', letterSpacing: '0.05em' }}>{fullName}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.1em', marginBottom: 4 }}>EXPIRES</p>
                <p style={{ fontSize: 15, fontWeight: 600, color: '#fff', fontFamily: 'monospace' }}>{card.expiry}</p>
              </div>
            </div>
          </div>

          {/* Back of Card */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 24,
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            display: 'flex', flexDirection: 'column', justifyContent: 'center',
            transform: flipped ? 'rotateY(0deg)' : 'rotateY(-180deg)',
            backfaceVisibility: 'hidden', transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)', overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <div style={{ background: '#000', height: 50, marginBottom: 24, width: '100%' }} />
            <div style={{ padding: '0 24px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1, height: 40, background: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 2px, transparent 2px, transparent 6px)', borderRadius: 6 }} />
              <div style={{ background: '#fff', borderRadius: 8, padding: '8px 16px', minWidth: 60, textAlign: 'center' }}>
                <p style={{ fontSize: 15, fontWeight: 800, color: '#0f172a', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
                  {reveal && !card.isLocked ? card.cvv : '•••'}
                </p>
              </div>
            </div>
            <p style={{ textAlign: 'right', paddingRight: 36, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, fontWeight: 600 }}>CVV</p>
          </div>
        </div>
        
        <p style={{ fontSize: 12, color: '#64748b', textAlign: 'center', marginBottom: 20, fontWeight: 500 }}>Tap card to flip</p>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          <CardAction 
            icon={reveal ? <EyeOff size={18}/> : <Eye size={18}/>} 
            label={reveal ? 'Hide' : 'Reveal'}  
            onClick={() => !card.isLocked && setReveal(v=>!v)} 
            disabled={card.isLocked}
          />
          <CardAction 
            icon={copied ? <Check size={18} color="#ea580c"/> : <Copy size={18}/>} 
            label={copied ? 'Copied' : 'Copy'}  
            onClick={copyCardNumber} 
            active={copied} 
            disabled={card.isLocked}
          />
          <CardAction 
            icon={card.isLocked ? <Lock size={18} color="#dc2626"/> : <Unlock size={18}/>} 
            label={card.isLocked ? 'Unlock' : 'Lock'} 
            onClick={() => { onToggleLock(); setReveal(false); }} 
            danger={card.isLocked} 
          />
        </div>
      </div>

      {/* --- RIGHT: DETAILS & HISTORY --- */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Spending Limit */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>Monthly Limit</span>
            <span style={{ fontSize: 14, fontWeight: 800, color: '#ea580c' }}>{fmt(card.spent)} / {fmt(card.limit)}</span>
          </div>
          <div style={{ height: 10, borderRadius: 99, background: '#f1f5f9', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${spentPct}%`, borderRadius: 99, background: spentPct > 80 ? '#ef4444' : '#ea580c', transition: 'width 1s cubic-bezier(.22,1,.36,1)' }} />
          </div>
          <p style={{ fontSize: 12, color: '#64748b', marginTop: 10, fontWeight: 500 }}>{(100-spentPct).toFixed(0)}% remaining this month</p>
        </div>

        {/* Card Info */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Card Details</p>
          {[
            ['Status', card.isLocked ? 'Locked' : 'Active', card.isLocked ? '#ef4444' : '#ea580c'],
            ['Network', card.brand, '#0f172a'],
            ['Type', card.type, '#475569'],
            ['Issued', new Date(card.createdAt).toLocaleDateString(), '#475569']
          ].map(([k,v,c]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: c, display: 'flex', alignItems: 'center', gap: 6 }}>
                {k === 'Status' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: c }} />}
                {v}
              </span>
            </div>
          ))}
        </div>

        {/* ISOLATED CARD TRANSACTIONS */}
        <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 16 }}>Card Charges</p>
          
          {cardTransactions.length === 0 ? (
            <p style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', padding: '20px 0', fontWeight: 500 }}>No charges on this card yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {cardTransactions.map(t => {
                return (
                  <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#475569' }}>
                      {t.merchant?.charAt(0)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{t.merchant}</p>
                      <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{fmtD(t.date)}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>
                      -{fmt(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </motion.div>
  );
}

// --- REUSABLE BUTTON COMPONENT ---
function CardAction({ icon, label, onClick, active, danger, disabled }) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      style={{
        padding: '16px 12px', borderRadius: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
        background: disabled ? '#f1f5f9' : danger ? '#fef2f2' : active ? '#fff7ed' : '#f8fafc',
        border: `1px solid ${disabled ? '#e2e8f0' : danger ? '#fecaca' : active ? '#fed7aa' : '#e2e8f0'}`,
        color: disabled ? '#94a3b8' : danger ? '#dc2626' : active ? '#ea580c' : '#475569',
        cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.2s',
        boxShadow: disabled ? 'none' : '0 2px 4px rgba(0,0,0,0.02)'
      }}
    >
      {icon}
      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
    </button>
  );
}