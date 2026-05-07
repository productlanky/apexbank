import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Ticket, Plus, ChevronLeft, Send, MessageSquare, 
  Clock, CheckCircle2, AlertCircle, Loader2, LifeBuoy 
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { collection, query, where, onSnapshot, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const CATEGORIES = ['Account Issue', 'Transfer/Wire', 'Card Management', 'Security', 'Other'];

const STATUS_CONFIG = {
  Open: { bg: '#eff6ff', text: '#3b82f6', icon: <Clock size={14} /> },
  'In Progress': { bg: '#fef9c3', text: '#ca8a04', icon: <Loader2 size={14} /> },
  Closed: { bg: '#f1f5f9', text: '#64748b', icon: <CheckCircle2 size={14} /> }
};

const pageVariants = {
  initial: { opacity: 0, y: 15 },
  in: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  out: { opacity: 0, y: -15, transition: { duration: 0.2, ease: 'easeIn' } }
};

export default function SupportTickets() {
  const { currentUser, userProfile } = useApp();
  
  const [view, setView] = useState('list'); // 'list', 'create', 'detail'
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState('');
  const [replyText, setReplyText] = useState('');

  // --- FETCH TICKETS (REAL-TIME) ---
  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'tickets'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      
      // Sort by newest update
      fetched.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
      setTickets(fetched);
      
      // Update selected ticket live if currently viewing it
      if (selectedTicket) {
        const updatedSelected = fetched.find(t => t.id === selectedTicket.id);
        if (updatedSelected) setSelectedTicket(updatedSelected);
      }
      
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, selectedTicket?.id]);

  // --- HANDLERS ---
  const handleCreateTicket = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    
    setIsSubmitting(true);
    try {
      const ticketId = 'TKT-' + Math.floor(100000 + Math.random() * 900000);
      
      await addDoc(collection(db, 'tickets'), {
        userId: currentUser.uid,
        userName: `${userProfile?.firstName || ''} ${userProfile?.lastName || ''}`.trim() || 'User',
        ticketId,
        subject,
        category,
        status: 'Open',
        messages: [{
          sender: 'user',
          text: message,
          timestamp: new Date().toISOString()
        }],
        createdAt: serverTimestamp(),
        updatedAt: new Date().toISOString()
      });
      
      setSubject('');
      setMessage('');
      setCategory(CATEGORIES[0]);
      setView('list');
    } catch (error) {
      console.error("Error creating ticket:", error);
      alert("Failed to create ticket.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSubmitting(true);
    try {
      const updatedMessages = [
        ...selectedTicket.messages,
        { sender: 'user', text: replyText, timestamp: new Date().toISOString() }
      ];

      await updateDoc(doc(db, 'tickets', selectedTicket.id), {
        messages: updatedMessages,
        status: 'Open', // Reopen if they reply
        updatedAt: new Date().toISOString()
      });

      setReplyText('');
    } catch (error) {
      console.error("Error sending reply:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <div style={{ minHeight: '100%', paddingBottom: 100 }}>
      {/* PAGE HEADER */}
      <div style={{ padding: '24px clamp(20px, 4vw, 32px)', marginBottom: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0f172a', marginBottom: 4, letterSpacing: '-0.5px' }}>Help & Support</h1>
        <p style={{ fontSize: 14, color: '#64748b', fontWeight: 500 }}>Manage your support requests</p>
      </div>

      <div style={{ padding: '0 clamp(20px, 4vw, 32px)', maxWidth: 800, margin: '0 auto' }}>
        <AnimatePresence mode="wait">

          {/* ========================================== */}
          {/* VIEW: LIST TICKETS                         */}
          {/* ========================================== */}
          {view === 'list' && (
            <motion.div key="list" variants={pageVariants} initial="initial" animate="in" exit="out">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Your Tickets</h2>
                <button 
                  onClick={() => setView('create')}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px', background: '#0f172a', color: '#fff', borderRadius: 12, fontSize: 14, fontWeight: 600, border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(15,23,42,0.15)' }}
                >
                  <Plus size={16} /> New Ticket
                </button>
              </div>

              {isLoading ? (
                <div style={{ padding: '60px', display: 'flex', justifyContent: 'center' }}>
                  <Loader2 size={32} color="#cbd5e1" className="animate-spin" />
                </div>
              ) : tickets.length === 0 ? (
                <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '60px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{ width: 64, height: 64, background: '#f1f5f9', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                    <LifeBuoy size={32} color="#94a3b8" />
                  </div>
                  <p style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', marginBottom: 8 }}>No active tickets</p>
                  <p style={{ fontSize: 14, color: '#64748b', maxWidth: 300, lineHeight: 1.5, marginBottom: 24 }}>If you need assistance with a transaction or your account, our team is here to help.</p>
                  <button onClick={() => setView('create')} style={{ padding: '12px 24px', background: '#f8fafc', color: '#0f172a', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Create a Ticket</button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {tickets.map(ticket => {
                    const status = STATUS_CONFIG[ticket.status] || STATUS_CONFIG['Open'];
                    return (
                      <motion.button
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        key={ticket.id}
                        onClick={() => { setSelectedTicket(ticket); setView('detail'); }}
                        style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', transition: 'border 0.2s' }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', fontFamily: 'monospace' }}>{ticket.ticketId}</span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8' }}>• {ticket.category}</span>
                            </div>
                            <p style={{ fontSize: 16, fontWeight: 700, color: '#0f172a' }}>{ticket.subject}</p>
                          </div>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: status.bg, color: status.text, padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                            {status.icon} {ticket.status}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginTop: 4 }}>
                          <p style={{ fontSize: 13, color: '#64748b', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <MessageSquare size={14} /> {ticket.messages.length} message{ticket.messages.length !== 1 && 's'}
                          </p>
                          <p style={{ fontSize: 12, color: '#94a3b8', fontWeight: 500 }}>Updated {fmtDate(ticket.updatedAt)}</p>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================== */}
          {/* VIEW: CREATE TICKET                        */}
          {/* ========================================== */}
          {view === 'create' && (
            <motion.form key="create" onSubmit={handleCreateTicket} variants={pageVariants} initial="initial" animate="in" exit="out" style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, padding: '32px 24px', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
                <button type="button" onClick={() => setView('list')} style={{ background: '#f8fafc', border: 'none', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}><ChevronLeft size={20} /></button>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0f172a' }}>Submit a Request</h2>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Category</label>
                  <select 
                    value={category} onChange={e => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: 15, fontWeight: 500, color: '#0f172a', outline: 'none' }}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Subject</label>
                  <input 
                    required placeholder="Briefly describe the issue..." value={subject} onChange={e => setSubject(e.target.value)}
                    style={{ width: '100%', padding: '14px 16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 15, fontWeight: 500, color: '#0f172a', outline: 'none' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 8 }}>Details</label>
                  <textarea 
                    required placeholder="Provide as much detail as possible..." value={message} onChange={e => setMessage(e.target.value)}
                    style={{ width: '100%', padding: '16px', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 15, color: '#0f172a', outline: 'none', minHeight: 140, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5 }}
                  />
                </div>
              </div>

              <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                <button type="button" onClick={() => setView('list')} style={{ padding: '14px 24px', fontSize: 15, fontWeight: 600, color: '#64748b', background: 'transparent', border: 'none', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" disabled={isSubmitting} style={{ padding: '14px 28px', fontSize: 15, fontWeight: 700, color: '#fff', background: '#ea580c', borderRadius: 12, border: 'none', cursor: isSubmitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(234, 88, 12, 0.2)' }}>
                  {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  Submit Ticket
                </button>
              </div>
            </motion.form>
          )}

          {/* ========================================== */}
          {/* VIEW: TICKET DETAILS & CHAT                */}
          {/* ========================================== */}
          {view === 'detail' && selectedTicket && (
            <motion.div key="detail" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)', background: '#fff', border: '1px solid #e2e8f0', borderRadius: 24, overflow: 'hidden', boxShadow: '0 12px 32px -8px rgba(0,0,0,0.05)' }}>
              
              {/* Chat Header */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <button onClick={() => setView('list')} style={{ background: '#fff', border: '1px solid #e2e8f0', width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#0f172a' }}><ChevronLeft size={20} /></button>
                  <div>
                    <h2 style={{ fontSize: 16, fontWeight: 800, color: '#0f172a', marginBottom: 2 }}>{selectedTicket.subject}</h2>
                    <p style={{ fontSize: 12, color: '#64748b', fontWeight: 600, fontFamily: 'monospace' }}>{selectedTicket.ticketId}</p>
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: STATUS_CONFIG[selectedTicket.status]?.bg || '#f1f5f9', color: STATUS_CONFIG[selectedTicket.status]?.text || '#64748b', padding: '6px 12px', borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                  {selectedTicket.status}
                </span>
              </div>

              {/* Messages Area */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
                {selectedTicket.messages.map((msg, idx) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                      <div style={{ 
                        maxWidth: '80%', padding: '14px 18px', borderRadius: 18, fontSize: 14, lineHeight: 1.5,
                        background: isUser ? '#ea580c' : '#f1f5f9', // Updated to Brand Orange
                        color: isUser ? '#fff' : '#0f172a',
                        borderBottomRightRadius: isUser ? 4 : 18,
                        borderBottomLeftRadius: isUser ? 18 : 4
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: 11, color: '#94a3b8', marginTop: 6, fontWeight: 500 }}>
                        {isUser ? 'You' : 'Support Agent'} • {fmtDate(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Reply Input Area */}
              {selectedTicket.status !== 'Closed' ? (
                <form onSubmit={handleReply} style={{ padding: '16px 24px', borderTop: '1px solid #f1f5f9', background: '#fff', display: 'flex', gap: 12 }}>
                  <input 
                    placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)}
                    style={{ flex: 1, padding: '14px 20px', borderRadius: 99, background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: 14, color: '#0f172a', outline: 'none' }}
                  />
                  <button type="submit" disabled={isSubmitting || !replyText.trim()} style={{ width: 48, height: 48, borderRadius: '50%', background: replyText.trim() ? '#ea580c' : '#cbd5e1', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: replyText.trim() ? 'pointer' : 'default', transition: 'background 0.2s', flexShrink: 0 }}>
                    {isSubmitting ? <Loader2 size={20} color="#fff" className="animate-spin" /> : <Send size={20} color="#fff" style={{ marginLeft: -2 }} />}
                  </button>
                </form>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', background: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                  <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>This ticket has been closed. Please open a new ticket if you need further assistance.</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}