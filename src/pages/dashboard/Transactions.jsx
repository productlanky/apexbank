import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const CURRENCY_SYMBOLS = { USD: '$', EUR: '€', GBP: '£', CAD: '$', AUD: '$' };

const fmtAmt = n => Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtD   = s => {
  if (!s) return 'N/A';
  return new Date(s).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const FILTERS = ['All', 'Money In', 'Money Out', 'Exchange'];

// Page load animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

// Dynamic Styling Helpers
const getStatusStyles = (status) => {
  const s = (status || 'pending').toLowerCase();
  // Keeping semantic colors for status
  if (s === 'completed') return { bg: '#dcfce7', text: '#16a34a', label: 'Completed' };
  if (s === 'failed') return { bg: '#fee2e2', text: '#dc2626', label: 'Failed' };
  return { bg: '#fef9c3', text: '#ca8a04', label: 'Pending' };
};

const getTypeStyles = (type) => {
  // Keeping semantic Green/Red for Credit/Debit, using Brand Orange for Exchange
  if (type === 'credit') return { bg: '#ecfdf5', text: '#059669', label: 'CR', sign: '+' };
  if (type === 'exchange') return { bg: '#fff7ed', text: '#ea580c', label: 'EX', sign: '' }; // MidFirst Orange
  return { bg: '#fef2f2', text: '#dc2626', label: 'DR', sign: '-' }; // default debit
};

export default function Transactions() {
  // Use real Firebase transactions, defaulting to an empty array
  const { transactions = [] } = useApp();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [searchFocused, setSearchFocused] = useState(false); // Track focus for brand styling

  // Filter logic
  const list = transactions.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || (t.name || '').toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q);
    const matchFilter = filter === 'All' 
                     || (filter === 'Money In' && t.type === 'credit') 
                     || (filter === 'Money Out' && t.type === 'debit')
                     || (filter === 'Exchange' && t.type === 'exchange');
    return matchSearch && matchFilter;
  });

  // Calculate summaries (We ignore 'exchange' for total In/Out since it's just moving money between internal ledgers)
  const totalIn  = list.filter(t => t.type === 'credit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = list.filter(t => t.type === 'debit').reduce((s, t) => s + Number(t.amount || 0), 0);
  const net      = totalIn - totalOut;

  return (
    <motion.div 
      variants={containerVariants} initial="hidden" animate="visible"
      style={{ 
        height: '100%', display: 'flex', flexDirection: 'column', 
        padding: '0 clamp(16px, 4vw, 32px) 20px', paddingBottom: 100 
      }}
    >
      {/* 1. Page Header */}
      <motion.div variants={itemVariants} style={{ flexShrink: 0, paddingTop: 24, marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.5px' }}>Activity</h1>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>{list.length} transactions found</p>
      </motion.div>

      {/* 2. Summary Cards */}
      <motion.div variants={itemVariants} style={{ flexShrink: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 24 }}>
        <SummaryCard label="Money In" value={`+$${fmtAmt(totalIn)}`} color="#059669" icon={<TrendingUp size={16} color="#059669" />} />
        <SummaryCard label="Money Out" value={`-$${fmtAmt(totalOut)}`} color="#dc2626" icon={<TrendingDown size={16} color="#dc2626" />} />
        <SummaryCard label="Net Flow" value={`${net >= 0 ? '+' : '-'}$${fmtAmt(Math.abs(net))}`} color={net >= 0 ? '#0f172a' : '#dc2626'} icon={<Activity size={16} color={net >= 0 ? '#0f172a' : '#dc2626'} />} />
      </motion.div>

      {/* 3. Search & Filters */}
      <motion.div variants={itemVariants} style={{ flexShrink: 0, display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        
        {/* Search Bar with Brand Focus State */}
        <div style={{ 
          flex: 1, minWidth: 220, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', 
          borderRadius: 14, background: '#fff', 
          border: `1px solid ${searchFocused ? '#ea580c' : '#e2e8f0'}`, 
          boxShadow: searchFocused ? '0 0 0 3px rgba(234, 88, 12, 0.1)' : '0 2px 4px rgba(0,0,0,0.02)', 
          transition: 'all 0.2s' 
        }}>
          <Search size={18} color={searchFocused ? '#ea580c' : '#94a3b8'} style={{ transition: 'color 0.2s' }} />
          <input 
            value={search} onChange={e => setSearch(e.target.value)} 
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search name or category…"
            style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#0f172a', background: 'transparent', border: 'none', outline: 'none' }} 
          />
        </div>

        {/* Filter Segmented Control */}
        <div style={{ display: 'flex', background: '#f1f5f9', padding: 4, borderRadius: 14, border: '1px solid #e2e8f0', overflowX: 'auto', scrollbarWidth: 'none' }}>
          {FILTERS.map(f => {
            const isActive = filter === f;
            return (
              <button 
                key={f} onClick={() => setFilter(f)} 
                style={{
                  position: 'relative', padding: '10px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: 'pointer', border: 'none', background: 'transparent',
                  color: isActive ? '#ea580c' : '#64748b', transition: 'color 0.2s', zIndex: 1, whiteSpace: 'nowrap'
                }}
              >
                {isActive && (
                  <motion.div
                    layoutId="filterTab"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    style={{ position: 'absolute', inset: 0, background: '#fff', borderRadius: 10, boxShadow: '0 2px 6px rgba(0,0,0,0.05)', zIndex: -1 }}
                  />
                )}
                {f}
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* 4. Transactions List Container */}
      <motion.div variants={itemVariants} style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: 300 }}>
        
        {/* DESKTOP TABLE */}
        <div className="hidden md:block" style={{ flex: 1, overflowY: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 800 }}>
            <thead style={{ position: 'sticky', top: 0, background: '#f8fafc', zIndex: 10 }}>
              <tr>
                {['Date', 'Description', 'Currency', 'Amount', 'Type', 'Status'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {list.length === 0 ? (
                  <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>No transactions match your criteria.</td>
                  </motion.tr>
                ) : list.map((t) => {
                  const typeConf = getTypeStyles(t.type);
                  const statusConf = getStatusStyles(t.status);
                  const sym = CURRENCY_SYMBOLS[t.currency] || '';
                  
                  return (
                    <motion.tr 
                      layout 
                      initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                      key={t.id} 
                      style={{ borderBottom: '1px solid #f1f5f9' }}
                      whileHover={{ backgroundColor: '#f8fafc' }}
                    >
                      <td style={{ padding: '16px 20px', fontSize: 14, color: '#64748b', whiteSpace: 'nowrap', fontWeight: 500 }}>{fmtD(t.date)}</td>
                      <td style={{ padding: '16px 20px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ width: 38, height: 38, borderRadius: 12, background: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: typeConf.text, flexShrink: 0 }}>
                            {t.avatar || (t.name ? t.name.charAt(0).toUpperCase() : 'T')}
                          </div>
                          <div>
                            <span style={{ display: 'block', fontSize: 14, fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap' }}>{t.name}</span>
                            <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>
                              {t.type === 'exchange' ? `Rate: 1 ${t.currency} = ${Number(t.rate).toFixed(4)} ${t.targetCurrency}` : t.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px 20px', fontSize: 14, fontWeight: 600, color: '#64748b' }}>{t.currency || 'USD'}</td>
                      <td style={{ padding: '16px 20px', fontSize: 15, fontWeight: 800, color: '#0f172a' }}>
                        {sym}{fmtAmt(t.amount)}
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: typeConf.text, background: typeConf.bg, padding: '6px 10px', borderRadius: 8 }}>
                          {typeConf.label}
                        </span>
                      </td>
                      <td style={{ padding: '16px 20px' }}>
                        <span style={{ fontSize: 12, fontWeight: 700, padding: '6px 12px', borderRadius: 99, background: statusConf.bg, color: statusConf.text }}>
                          {statusConf.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* MOBILE LIST */}
        <div className="md:hidden" style={{ flex: 1, overflowY: 'auto' }}>
          <AnimatePresence mode="popLayout">
            {list.length === 0 ? (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 15, fontWeight: 500 }}>
                No transactions match your criteria.
              </motion.p>
            ) : list.map((t) => {
              const typeConf = getTypeStyles(t.type);
              const statusConf = getStatusStyles(t.status);
              const sym = CURRENCY_SYMBOLS[t.currency] || '';

              return (
                <motion.div 
                  layout 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.2 }}
                  key={t.id} 
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}
                >
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: typeConf.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: typeConf.text, flexShrink: 0 }}>
                    {t.avatar || (t.name ? t.name.charAt(0).toUpperCase() : 'T')}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 15, fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{t.name}</p>
                    <p style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>{fmtD(t.date)} · {t.category}</p>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <span style={{ display: 'block', fontSize: 16, fontWeight: 800, color: typeConf.text }}>
                      {typeConf.sign}{sym}{fmtAmt(t.amount)}
                    </span>
                    <p style={{ fontSize: 12, color: statusConf.text, fontWeight: 700, marginTop: 2 }}>
                      {statusConf.label}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Sub-component for the top stats
function SummaryCard({ label, value, color, icon }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      style={{ 
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, 
        padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column'
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <p style={{ fontSize: 12, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <div style={{ padding: '6px', background: '#f8fafc', borderRadius: 8 }}>{icon}</div>
      </div>
      <p style={{ fontSize: 'clamp(20px, 3vw, 24px)', fontWeight: 800, color: color, letterSpacing: '-0.5px' }}>{value}</p>
    </motion.div>
  );
}