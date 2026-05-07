import { useState } from 'react';
import { Copy, Check, Share2, Loader2, Building2, Zap, ArrowDownToLine } from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from '../../context/AppContext';

// --- NATIVE QR CODE GENERATOR ---
function QR({ data, color = '#0f172a' }) {
  const size = 200, cells = 25, cs = size / cells;
  function fill(r, c) {
    if (r < 7 && c < 7) return finder(r, c, 0, 0);
    if (r < 7 && c >= cells-7) return finder(r, c, 0, cells-7);
    if (r >= cells-7 && c < 7) return finder(r, c, cells-7, 0);
    return ((r*31 + c*17 + data.charCodeAt(r % data.length)) % 3) === 0;
  }
  function finder(r, c, or_, oc) {
    const row = r-or_, col = c-oc;
    if (row===0||row===6||col===0||col===6) return true;
    return row>=2&&row<=4&&col>=2&&col<=4;
  }
  const rects = [];
  for (let r=0; r<cells; r++) {
    for (let c=0; c<cells; c++) {
      if (fill(r,c)) rects.push(<rect key={`${r}-${c}`} x={c*cs} y={r*cs} width={cs+0.5} height={cs+0.5} rx={2} fill={color} />);
    }
  }
  return <svg width="100%" height="100%" viewBox={`0 0 ${size} ${size}`} style={{ display: 'block' }}>{rects}</svg>;
}

// --- ANIMATION VARIANTS ---
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
};

export default function Receive() {
  const { userProfile, loadingAuth } = useApp(); // Pulls live data from Firebase
  
  const [tab, setTab] = useState('tag');
  const [copied, setCopied] = useState('');
  
  function copy(text, key) {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopied(key); 
    setTimeout(() => setCopied(''), 2500);
  }

  // Show a spinner while Firebase fetches the session
  if (loadingAuth || !userProfile) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  // --- DYNAMIC FIREBASE DATA ---
  const firstName = userProfile.firstName || 'User';
  const lastName = userProfile.lastName || '';
  const fullName = `${firstName} ${lastName}`.trim();
  const acctNum = userProfile.accountNumber || '0000000000';
  // Generates e.g. @jane9182
  const userTag = `@${firstName.toLowerCase()}${acctNum.slice(-4)}`;
  const routingNum = "021000021"; // Static MidFirst platform routing

  return (
    <div style={{ minHeight: '100%', paddingBottom: 100, fontFamily: "'Inter', sans-serif" }}>
      
      {/* Page Header */}
      <div style={{ padding: '24px clamp(20px, 4vw, 32px)', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ArrowDownToLine size={20} color="#ea580c" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', letterSpacing: '-0.5px' }}>Receive Money</h1>
        </div>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500, marginLeft: 48 }}>Share your details to get paid instantly.</p>
      </div>

      <div style={{ padding: '0 clamp(20px, 4vw, 32px)', maxWidth: 1000, margin: '0 auto' }}>
        
        {/* Responsive Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 340px), 1fr))', gap: 24 }}>
          
          {/* --- LEFT: DYNAMIC QR CARD --- */}
          <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
            
            {/* Tab Switcher */}
            <div style={{ display: 'flex', background: '#f8fafc', borderRadius: 14, padding: 6, marginBottom: 32, width: '100%', border: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => setTab('tag')} 
                style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'tag' ? '#fff' : 'transparent', color: tab === 'tag' ? '#0f172a' : '#64748b', boxShadow: tab === 'tag' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Zap size={16} color={tab === 'tag' ? '#ea580c' : '#94a3b8'} /> MidFirst Tag
              </button>
              <button 
                onClick={() => setTab('account')} 
                style={{ flex: 1, padding: '10px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: 'pointer', border: 'none', background: tab === 'account' ? '#fff' : 'transparent', color: tab === 'account' ? '#0f172a' : '#64748b', boxShadow: tab === 'account' ? '0 2px 4px rgba(0,0,0,0.04)' : 'none', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
              >
                <Building2 size={16} color={tab === 'account' ? '#f97316' : '#94a3b8'} /> Bank Details
              </button>
            </div>

            {/* QR Display */}
            <div style={{ position: 'relative', padding: 20, borderRadius: 24, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 24, width: 220, height: 220 }}>
              <QR data={tab === 'tag' ? userTag : acctNum} color={tab === 'tag' ? '#ea580c' : '#0f172a'} />
              {/* Corner Accents */}
              {[['top','left'],['top','right'],['bottom','left'],['bottom','right']].map(([v,h], i) => (
                <div key={i} style={{ position: 'absolute', [v]: -1, [h]: -1, width: 24, height: 24, borderColor: tab === 'tag' ? '#ea580c' : '#0f172a', borderStyle: 'solid', borderTopWidth: v==='top'?3:0, borderBottomWidth: v==='bottom'?3:0, borderLeftWidth: h==='left'?3:0, borderRightWidth: h==='right'?3:0, borderRadius: v==='top'&&h==='left'?'20px 0 0 0':v==='top'&&h==='right'?'0 20px 0 0':v==='bottom'&&h==='left'?'0 0 0 20px':'0 0 20px 0', transition: 'border-color 0.3s' }} />
              ))}
            </div>

            <p style={{ fontSize: 20, fontWeight: 800, color: '#0f172a', marginBottom: 6, letterSpacing: '-0.5px' }}>
              {tab === 'tag' ? userTag : 'Bank Transfer'}
            </p>
            <p style={{ fontSize: 14, color: '#64748b', textAlign: 'center', marginBottom: 24, maxWidth: 220 }}>
              {tab === 'tag' ? 'Scan to pay instantly via MidFirst.' : 'Scan for routing and account info.'}
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: 12, width: '100%' }}>
              <button 
                onClick={() => copy(tab === 'tag' ? userTag : `${routingNum} / ${acctNum}`, tab)}
                style={{ flex: 1, padding: '14px', borderRadius: 14, background: '#0f172a', color: '#fff', fontSize: 14, fontWeight: 700, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}
              >
                {copied === tab ? <><Check size={16}/> Copied!</> : <><Copy size={16}/> Copy Info</>}
              </button>
              <button style={{ padding: '14px', borderRadius: 14, background: '#f1f5f9', color: '#475569', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Share2 size={18} />
              </button>
            </div>
          </motion.div>

          {/* --- RIGHT: ACCOUNT DETAILS --- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Tag Details */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={18} color="#ea580c" />
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>MidFirst Tag</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '4px 10px', borderRadius: 8 }}>Instant</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginBottom: 4 }}>Your Tag</p>
                  <p style={{ fontSize: 18, fontWeight: 800, color: '#ea580c', letterSpacing: '-0.5px' }}>{userTag}</p>
                </div>
                <button onClick={() => copy(userTag, 'tag2')} style={{ width: 40, height: 40, borderRadius: 10, background: copied === 'tag2' ? '#ea580c' : '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                  {copied === 'tag2' ? <Check size={18} color="#fff" /> : <Copy size={18} color="#64748b" />}
                </button>
              </div>
              <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 12, fontWeight: 500 }}>Works within the MidFirst network. The recipient must have an active account.</p>
            </motion.div>

            {/* Bank Details */}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.2 }} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '28px', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Building2 size={18} color="#f97316" />
                  <p style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>Bank Transfer</p>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#ea580c', background: '#fff7ed', padding: '4px 10px', borderRadius: 8 }}>ACH / Wire</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  ['Account Holder', fullName, 'name'],
                  ['Routing Number', routingNum, 'routing'],
                  ['Account Number', acctNum, 'acct'],
                  ['Account Type', 'Checking', '']
                ].map(([label, value, copyKey]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 16, borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{label}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', fontFamily: copyKey && copyKey !== 'name' ? 'monospace' : 'inherit' }}>
                        {value}
                      </span>
                      {copyKey && (
                        <button 
                          onClick={() => copy(value, copyKey)} 
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: copied === copyKey ? '#ea580c' : '#94a3b8', transition: 'color 0.2s' }}
                        >
                          {copied === copyKey ? <Check size={16} /> : <Copy size={16} />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 20, padding: '16px', borderRadius: 16, background: '#f8fafc', border: '1px solid #e2e8f0', display: 'flex', gap: 12 }}>
                 <div style={{ width: 4, borderRadius: 4, background: '#ea580c' }} />
                 <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.6, fontWeight: 500 }}>
                   <strong style={{ color: '#0f172a' }}>ACH transfers</strong> arrive in 1–2 business days. <strong style={{ color: '#0f172a' }}>Wire transfers</strong> arrive same-day if initiated before 4:00 PM ET.
                 </p>
              </div>
            </motion.div>

          </div>
        </div>
      </div>
    </div>
  );
}