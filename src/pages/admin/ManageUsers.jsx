import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Edit3, X, Save, AlertCircle, ShieldAlert,
  CheckCircle2, DollarSign, UserX, Loader2, Mail,
  Activity, BellRing, Send, Info, AlertTriangle, PlusCircle,
  ArrowDownRight, ArrowUpRight, CreditCard, Lock, Unlock
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, query, where, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useApp } from "../../context/AppContext";

const CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"];
const TX_CATEGORIES = ["Deposit", "Withdrawal", "Fee", "Refund", "Correction", "Bonus"];

// Helper to format currency
const fmt = n => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function ManageUsers() {
  const { currentUser } = useApp();

  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Drawer State
  const [selectedUser, setSelectedUser] = useState(null);
  const [activeTab, setActiveTab] = useState("overview"); // overview, cards, transactions, addTx, alerts
  
  // Tab 1: Edit State (Overview)
  const [editStatus, setEditStatus] = useState("active");
  const [suspendReason, setSuspendReason] = useState(""); 
  const [editBalances, setEditBalances] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Tab 3: User Transactions State (Bank Ledger)
  const [userTxns, setUserTxns] = useState([]);
  const [isTxnsLoading, setIsTxnsLoading] = useState(false);

  // Tab 5: Alert State
  const [alertConfig, setAlertConfig] = useState({ title: '', message: '', type: 'info' });
  const [isSendingAlert, setIsSendingAlert] = useState(false);

  // Tab 4: Add Transaction State
  const [txType, setTxType] = useState('credit');
  const [txAmount, setTxAmount] = useState('');
  const [txCurrency, setTxCurrency] = useState('USD');
  const [txName, setTxName] = useState('');
  const [txCategory, setTxCategory] = useState('Deposit');
  const [isCreatingTx, setIsCreatingTx] = useState(false);

  // --- FETCH ALL USERS ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "users"), (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        // Comment out if you want to see admins in the list
        if (data.role !== "admin" && data.role !== "Administrator") {
          fetched.push({ uid: doc.id, ...data });
        }
      });
      setUsers(fetched);
      setIsLoading(false);

      // Keep drawer data fresh
      if (selectedUser) {
        const liveUser = fetched.find((u) => u.uid === selectedUser.uid);
        if (liveUser && !isSaving && !isSendingAlert && !isCreatingTx) {
          setSelectedUser(liveUser);
        }
      }
    });
    return () => unsub();
  }, [selectedUser?.uid, isSaving, isSendingAlert, isCreatingTx]);

  // --- FETCH SELECTED USER TRANSACTIONS (BANK LEDGER) ---
  useEffect(() => {
    if (!selectedUser || activeTab !== 'transactions') return;
    setIsTxnsLoading(true);
    
    const q = query(collection(db, 'transactions'), where('userId', '==', selectedUser.uid));
    const unsub = onSnapshot(q, (snapshot) => {
      const txns = [];
      snapshot.forEach(d => txns.push({ id: d.id, ...d.data() }));
      txns.sort((a, b) => new Date(b.date) - new Date(a.date));
      setUserTxns(txns);
      setIsTxnsLoading(false);
    });

    return () => unsub();
  }, [selectedUser?.uid, activeTab]);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    const name = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const email = (u.email || "").toLowerCase();
    return name.includes(q) || email.includes(q);
  });

  const openEditDrawer = (user) => {
    setSelectedUser(user);
    setActiveTab("overview");
    const s = (user.status || user.accountStatus || "active").toLowerCase();
    setEditStatus(s);
    setSuspendReason(user.suspensionReason || ""); 

    const currentBalances = user.balances || {};
    if (user.balance !== undefined && !currentBalances.USD) {
      currentBalances.USD = user.balance;
    }

    const initBalances = {};
    CURRENCIES.forEach((c) => {
      initBalances[c] = currentBalances[c] || 0;
    });
    setEditBalances(initBalances);

    setTxType('credit');
    setTxAmount('');
    setTxCurrency('USD');
    setTxName('');
    setTxCategory('Deposit');
  };

  const handleSaveOverview = async () => {
    setIsSaving(true);
    try {
      const sanitizedBalances = {};
      Object.keys(editBalances).forEach((k) => {
        sanitizedBalances[k] = Number(editBalances[k]) || 0;
      });

      const updatePayload = {
        status: editStatus,
        accountStatus: editStatus, 
        balances: sanitizedBalances,
        balance: sanitizedBalances.USD, 
      };

      if (editStatus === 'suspended') {
        updatePayload.suspensionReason = suspendReason;
      } else {
        updatePayload.suspensionReason = null;
      }

      await updateDoc(doc(db, "users", selectedUser.uid), updatePayload);
      alert("Account updated successfully.");
    } catch (error) {
      console.error("Failed to update user:", error);
      alert("Error saving user changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendAlert = async (e) => {
    e.preventDefault();
    if (!alertConfig.title || !alertConfig.message) return;
    
    setIsSendingAlert(true);
    try {
      const newNotif = {
        id: Date.now().toString(),
        title: alertConfig.title,
        message: alertConfig.message,
        type: alertConfig.type,
        date: new Date().toISOString(),
        read: false
      };

      const currentNotifs = selectedUser.notifications || [];
      
      await updateDoc(doc(db, 'users', selectedUser.uid), {
        notifications: [newNotif, ...currentNotifs],
        dashboardAlert: newNotif
      });

      setAlertConfig({ title: '', message: '', type: 'info' });
      alert("Alert pushed to user successfully!");
    } catch (error) {
      console.error("Failed to send alert:", error);
      alert("Failed to push alert.");
    } finally {
      setIsSendingAlert(false);
    }
  };

  const handleCreateTransaction = async (e) => {
    e.preventDefault();
    if (!txAmount || !txName) return;

    setIsCreatingTx(true);
    try {
      const numAmount = Number(txAmount);
      if (numAmount <= 0) throw new Error("Amount must be greater than zero.");

      const currentBal = Number(selectedUser.balances?.[txCurrency]) || 0;
      const newBal = txType === 'credit' ? currentBal + numAmount : currentBal - numAmount;

      const newBalances = {
        ...selectedUser.balances,
        [txCurrency]: newBal
      };

      await addDoc(collection(db, "transactions"), {
        userId: selectedUser.uid,
        type: txType,
        name: txName,
        avatar: txName.charAt(0).toUpperCase(),
        amount: numAmount,
        currency: txCurrency,
        date: new Date().toISOString(),
        category: txCategory,
        status: 'Completed', 
        timestamp: serverTimestamp(),
        adminCreated: true
      });

      await updateDoc(doc(db, "users", selectedUser.uid), {
        balances: newBalances,
        balance: newBalances.USD 
      });

      setTxAmount('');
      setTxName('');
      setActiveTab('transactions');

    } catch (error) {
      console.error("Failed to create transaction:", error);
      alert(error.message || "Failed to process transaction.");
    } finally {
      setIsCreatingTx(false);
    }
  };

  const getStatusUI = (status) => {
    const s = (status || "active").toLowerCase();
    if (s === "suspended") return { label: "Suspended", color: "#dc2626", bg: "#fef2f2", icon: UserX };
    if (s === "frozen" || s === "hold") return { label: "Frozen", color: "#d97706", bg: "#fffbeb", icon: ShieldAlert };
    return { label: "Active", color: "#059669", bg: "#ecfdf5", icon: CheckCircle2 };
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100%", paddingBottom: 100 }}>
      {/* Header & Search */}
      <div style={{ padding: "24px clamp(20px, 4vw, 32px)", marginBottom: 20 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.5px" }}>User CRM</h1>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Manage client accounts, balances, cards, and transactions.</p>

        <div style={{ marginTop: 24, display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", boxShadow: "0 2px 4px rgba(0,0,0,0.02)", maxWidth: 500 }}>
          <Search size={18} color="#94a3b8" />
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            style={{ flex: 1, fontSize: 15, fontWeight: 500, color: "#0f172a", background: "transparent", border: "none", outline: "none" }}
          />
        </div>
      </div>

      {/* User Table */}
      <div style={{ padding: "0 clamp(20px, 4vw, 32px)", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}>
              <thead style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                <tr>
                  <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Client</th>
                  <th style={{ padding: "16px 24px", textAlign: "left", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Contact</th>
                  <th style={{ padding: "16px 24px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>USD Balance</th>
                  <th style={{ padding: "16px 24px", textAlign: "center", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                  <th style={{ padding: "16px 24px", textAlign: "right", fontSize: 12, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "#94a3b8", fontWeight: 500 }}>No clients found.</td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => {
                    const sUI = getStatusUI(u.status);
                    const StatusIcon = sUI.icon;
                    const usdBal = Number(u.balances?.USD || u.balance || 0);

                    return (
                      <motion.tr key={u.uid} whileHover={{ backgroundColor: "#f8fafc" }} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}>
                        <td style={{ padding: "16px 24px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0f172a", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14 }}>
                              {u.firstName ? u.firstName.charAt(0) : "U"}
                            </div>
                            <div>
                              <p style={{ fontSize: 14, fontWeight: 700, color: "#0f172a" }}>{`${u.firstName || "Unknown"} ${u.lastName || ""}`.trim()}</p>
                              <p style={{ fontSize: 12, color: "#64748b", fontFamily: "monospace" }}>{u.accountNumber || u.uid.slice(0, 8)}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "16px 24px" }}>
                          <p style={{ fontSize: 14, color: "#475569", fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                            <Mail size={14} color="#94a3b8" /> {u.email}
                          </p>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>${usdBal.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "center" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: sUI.bg, color: sUI.color, padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700 }}>
                            <StatusIcon size={14} /> {sUI.label}
                          </span>
                        </td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          <button
                            onClick={() => openEditDrawer(u)}
                            style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 700, color: "#0f172a", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6, boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}
                          >
                            <Edit3 size={14} /> Manage
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- SLIDE-OUT EDIT DRAWER --- */}
      <AnimatePresence>
        {selectedUser && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSaving && !isCreatingTx && setSelectedUser(null)}
              style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.5)", backdropFilter: "blur(4px)", zIndex: 100 }}
            />

            <motion.div
              initial={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }} 
              animate={{ x: 0, boxShadow: "-20px 0 50px rgba(0,0,0,0.15)" }} 
              exit={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }} 
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100vw", maxWidth: 540, background: "#fff", zIndex: 110, display: "flex", flexDirection: "column" }}
            >
              {/* Drawer Header */}
              <div style={{ padding: "24px 24px 0", background: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
                  <div>
                    <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}>{`${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim()}</h2>
                    <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{selectedUser.email}</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} style={{ background: "#fff", border: "1px solid #e2e8f0", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                    <X size={20} color="#64748b" />
                  </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid #e2e8f0', overflowX: 'auto', scrollbarWidth: 'none' }}>
                  <TabBtn active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} icon={ShieldAlert} label="Overview" />
                  <TabBtn active={activeTab === 'cards'} onClick={() => setActiveTab('cards')} icon={CreditCard} label="Cards" />
                  <TabBtn active={activeTab === 'transactions'} onClick={() => setActiveTab('transactions')} icon={Activity} label="Bank Feed" />
                  <TabBtn active={activeTab === 'addTx'} onClick={() => setActiveTab('addTx')} icon={PlusCircle} label="Add Entry" />
                  <TabBtn active={activeTab === 'alerts'} onClick={() => setActiveTab('alerts')} icon={BellRing} label="Alerts" />
                </div>
              </div>

              {/* Drawer Content */}
              <div style={{ flex: 1, overflowY: "auto", padding: "24px", background: (activeTab === 'transactions' || activeTab === 'cards') ? '#f8fafc' : '#fff' }}>
                
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'overview' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ marginBottom: 40 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                        <ShieldAlert size={16} color="#3b82f6" /> Security Status
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
                        <StatusOption title="Active" desc="Normal operations allowed." val="active" current={editStatus} onSelect={setEditStatus} color="#059669" bg="#ecfdf5" icon={CheckCircle2} />
                        <StatusOption title="Frozen" desc="Blocks outgoing wires and transfers." val="frozen" current={editStatus} onSelect={setEditStatus} color="#d97706" bg="#fffbeb" icon={AlertCircle} />
                        <StatusOption title="Suspended" desc="Complete lockout. Cannot log in." val="suspended" current={editStatus} onSelect={setEditStatus} color="#dc2626" bg="#fef2f2" icon={UserX} />
                      </div>

                      <AnimatePresence>
                        {editStatus === 'suspended' && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            style={{ overflow: 'hidden', marginTop: 12 }}
                          >
                            <label style={{ display: "block", fontSize: 12, fontWeight: 700, color: "#dc2626", marginBottom: 6 }}>Reason for Suspension (Stored securely)</label>
                            <textarea
                              value={suspendReason}
                              onChange={(e) => setSuspendReason(e.target.value)}
                              placeholder="e.g. Suspected fraudulent activity. Under review."
                              style={{ width: "100%", padding: "12px", borderRadius: 12, border: "1px solid #fecaca", background: "#fff", fontSize: 14, color: "#0f172a", outline: "none", resize: "vertical", minHeight: 80, fontFamily: "inherit" }}
                              onFocus={(e) => (e.target.style.borderColor = "#dc2626")} onBlur={(e) => (e.target.style.borderColor = "#fecaca")}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 800, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 16 }}>
                        <DollarSign size={16} color="#3b82f6" /> Direct Balance Editor
                      </label>
                      <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>For proper audit trails, prefer using the "Add Entry" tab instead of overriding balances directly.</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                        {CURRENCIES.map((c) => (
                          <div key={c}>
                            <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 6 }}>{c} Ledger</label>
                            <div style={{ position: "relative" }}>
                              <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "#94a3b8" }}>
                                {c === "EUR" ? "€" : c === "GBP" ? "£" : "$"}
                              </span>
                              <input
                                type="number" min="0" step="0.01" value={editBalances[c]} onChange={(e) => setEditBalances((p) => ({ ...p, [c]: e.target.value }))}
                                style={{ width: "100%", padding: "14px 16px 14px 40px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                                onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* TAB 2: VIRTUAL CARDS */}
                {activeTab === 'cards' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {!selectedUser.cards || selectedUser.cards.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '60px 0' }}>
                        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                          <CreditCard size={28} color="#94a3b8" />
                        </div>
                        <p style={{ color: '#0f172a', fontSize: 16, fontWeight: 800, marginBottom: 8 }}>No Virtual Cards</p>
                        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500, maxWidth: 280, margin: '0 auto' }}>This user has not been issued any virtual debit cards yet.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                        {selectedUser.cards.map(card => (
                          <div key={card.id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 20, overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}>
                            
                            {/* Card Header */}
                            <div style={{ padding: '20px 24px', background: card.isLocked ? '#fef2f2' : '#0f172a', color: card.isLocked ? '#dc2626' : '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <CreditCard size={20} />
                                <div>
                                  <p style={{ fontWeight: 800, fontFamily: 'monospace', letterSpacing: 2, fontSize: 16 }}>•••• {card.cardNumber.slice(-4)}</p>
                                  <p style={{ fontSize: 12, opacity: 0.8, marginTop: 2 }}>{card.brand} • Exp {card.expiry}</p>
                                </div>
                              </div>
                              <span style={{ fontSize: 12, fontWeight: 800, padding: '4px 10px', borderRadius: 8, background: card.isLocked ? '#fecaca' : 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {card.isLocked ? <><Lock size={12} /> LOCKED</> : <><Unlock size={12} /> ACTIVE</>}
                              </span>
                            </div>

                            {/* Card Stats */}
                            <div style={{ padding: '20px 24px', borderBottom: '1px solid #f1f5f9', background: '#f8fafc' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 13 }}>
                                <span style={{ color: '#64748b', fontWeight: 600 }}>Monthly Limit Utilization</span>
                                <span style={{ color: '#0f172a', fontWeight: 800 }}>{fmt(card.spent)} / {fmt(card.limit)}</span>
                              </div>
                              <div style={{ height: 6, borderRadius: 99, background: '#e2e8f0', overflow: 'hidden' }}>
                                <div style={{ height: '100%', width: `${Math.min((card.spent/card.limit)*100, 100)}%`, background: card.isLocked ? '#ef4444' : '#059669', borderRadius: 99 }} />
                              </div>
                            </div>

                            {/* Card Txns */}
                            <div style={{ padding: '20px 24px' }}>
                              <p style={{ fontSize: 13, fontWeight: 800, color: '#0f172a', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Card Charges Ledger</p>
                              {(!card.cardTransactions || card.cardTransactions.length === 0) ? (
                                <p style={{ fontSize: 14, color: '#94a3b8', fontStyle: 'italic' }}>No charges have been made on this card.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                  {card.cardTransactions.map(tx => (
                                    <div key={tx.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <div style={{ width: 32, height: 32, borderRadius: 8, background: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#475569' }}>
                                          {tx.merchant?.charAt(0)}
                                        </div>
                                        <div>
                                          <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{tx.merchant}</p>
                                          <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{new Date(tx.date).toLocaleDateString()}</p>
                                        </div>
                                      </div>
                                      <p style={{ fontSize: 14, fontWeight: 800, color: '#0f172a' }}>-{fmt(tx.amount)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 3: BANK TRANSACTIONS FEED */}
                {activeTab === 'transactions' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    {isTxnsLoading ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '40px 0' }}><Loader2 className="animate-spin" color="#94a3b8" /></div>
                    ) : userTxns.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <Activity size={32} color="#cbd5e1" style={{ margin: '0 auto 12px' }} />
                        <p style={{ color: '#64748b', fontSize: 14, fontWeight: 500 }}>No bank transactions found.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {userTxns.map(t => {
                          const isCredit = t.type === 'credit';
                          return (
                            <div key={t.id} style={{ background: '#fff', padding: 16, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div>
                                <p style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>{t.name}</p>
                                <p style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{new Date(t.date).toLocaleDateString()} • {t.category}</p>
                              </div>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: 15, fontWeight: 800, color: isCredit ? '#059669' : '#0f172a' }}>
                                  {isCredit ? '+' : '-'}{t.currency === 'EUR' ? '€' : t.currency === 'GBP' ? '£' : '$'}{Number(t.amount).toLocaleString('en-US', {minimumFractionDigits:2})}
                                </p>
                                <p style={{ fontSize: 11, fontWeight: 700, color: t.status === 'Completed' ? '#059669' : '#d97706', textTransform: 'uppercase', marginTop: 2 }}>{t.status}</p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </motion.div>
                )}

                {/* TAB 4: ADD TRANSACTION (LEDGER ENTRY) */}
                {activeTab === 'addTx' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>
                      Create an official ledger entry. This instantly updates the user's bank balance and appears in their main transaction history.
                    </p>

                    <form onSubmit={handleCreateTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Transaction Flow</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <TypeBtn type="credit" label="Money In (+)" current={txType} onClick={() => setTxType('credit')} icon={ArrowDownRight} color="#059669" />
                          <TypeBtn type="debit" label="Money Out (-)" current={txType} onClick={() => setTxType('debit')} icon={ArrowUpRight} color="#dc2626" />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 12 }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Currency</label>
                          <select
                            value={txCurrency} onChange={e => setTxCurrency(e.target.value)}
                            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, fontWeight: 700, color: "#0f172a", outline: "none" }}
                          >
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div style={{ flex: 2 }}>
                          <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Amount</label>
                          <input
                            type="number" required min="0.01" step="0.01" value={txAmount} onChange={e => setTxAmount(e.target.value)}
                            placeholder="0.00"
                            style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                            onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Description (Visible to User)</label>
                        <input
                          required value={txName} onChange={e => setTxName(e.target.value)}
                          placeholder="e.g. Wire Reversal, Sign-up Bonus"
                          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Category</label>
                        <select
                          value={txCategory} onChange={e => setTxCategory(e.target.value)}
                          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, color: "#0f172a", outline: "none" }}
                        >
                          {TX_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>

                      <button 
                        type="submit" disabled={isCreatingTx} 
                        style={{ width: '100%', padding: '16px', background: '#0f172a', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: isCreatingTx ? 'not-allowed' : 'pointer', marginTop: 8 }}
                      >
                        {isCreatingTx ? <Loader2 size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                        Process Transaction
                      </button>
                    </form>
                  </motion.div>
                )}

                {/* TAB 5: ALERTS */}
                {activeTab === 'alerts' && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <p style={{ fontSize: 14, color: '#64748b', lineHeight: 1.5, marginBottom: 24 }}>
                      Push a custom notification or warning banner directly to this user's dashboard.
                    </p>

                    <form onSubmit={handleSendAlert} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Alert Type</label>
                        <div style={{ display: 'flex', gap: 10 }}>
                          <TypeBtn type="info" label="Info" current={alertConfig.type} onClick={() => setAlertConfig(p => ({...p, type: 'info'}))} icon={Info} color="#3b82f6" />
                          <TypeBtn type="warning" label="Warning" current={alertConfig.type} onClick={() => setAlertConfig(p => ({...p, type: 'warning'}))} icon={AlertTriangle} color="#d97706" />
                          <TypeBtn type="danger" label="Urgent" current={alertConfig.type} onClick={() => setAlertConfig(p => ({...p, type: 'danger'}))} icon={AlertCircle} color="#dc2626" />
                        </div>
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Alert Title</label>
                        <input
                          required value={alertConfig.title} onChange={e => setAlertConfig(p => ({...p, title: e.target.value}))}
                          placeholder="e.g. Account Verification Required"
                          style={{ width: "100%", padding: "14px 16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                        />
                      </div>

                      <div>
                        <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#475569", marginBottom: 8 }}>Message Body</label>
                        <textarea
                          required value={alertConfig.message} onChange={e => setAlertConfig(p => ({...p, message: e.target.value}))}
                          placeholder="Provide details to the user..."
                          style={{ width: "100%", padding: "16px", borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", fontSize: 14, color: "#0f172a", outline: "none", minHeight: 120, resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.5, transition: "border 0.2s" }}
                          onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
                        />
                      </div>

                      <button 
                        type="submit" disabled={isSendingAlert} 
                        style={{ width: '100%', padding: '16px', background: '#0f172a', color: '#fff', borderRadius: 14, fontSize: 15, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', cursor: isSendingAlert ? 'not-allowed' : 'pointer', marginTop: 8 }}
                      >
                        {isSendingAlert ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                        Push Notification to User
                      </button>
                    </form>
                  </motion.div>
                )}

              </div>

              {/* Drawer Footer (Only visible on Overview) */}
              {activeTab === 'overview' && (
                <div style={{ padding: "20px 24px", borderTop: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", gap: 12 }}>
                  <button disabled={isSaving} onClick={handleSaveOverview} style={{ flex: 1, padding: "16px", background: "#0f172a", border: "none", borderRadius: 14, fontSize: 15, fontWeight: 700, color: "#fff", cursor: isSaving ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 4px 12px rgba(15,23,42,0.15)" }}>
                    {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />} Save Changes
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// UI Sub-components
function TabBtn({ active, onClick, icon: Icon, label }) {
  return (
    <button 
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 0 16px 0', border: 'none', background: 'transparent', cursor: 'pointer', position: 'relative', color: active ? '#0f172a' : '#94a3b8', whiteSpace: 'nowrap' }}
    >
      <Icon size={16} />
      <span style={{ fontSize: 14, fontWeight: 700 }}>{label}</span>
      {active && <motion.div layoutId="tabLine" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 2, background: '#0f172a', borderRadius: '2px 2px 0 0' }} />}
    </button>
  );
}

function TypeBtn({ type, label, current, onClick, icon: Icon, color }) {
  const active = type === current;
  return (
    <button 
      type="button" onClick={onClick}
      style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px', borderRadius: 12, border: `2px solid ${active ? color : '#e2e8f0'}`, background: active ? `${color}10` : '#fff', cursor: 'pointer', transition: 'all 0.2s' }}
    >
      <Icon size={20} color={active ? color : '#94a3b8'} />
      <span style={{ fontSize: 13, fontWeight: 700, color: active ? color : '#64748b' }}>{label}</span>
    </button>
  );
}

function StatusOption({ title, desc, val, current, onSelect, color, bg, icon: Icon }) {
  const isSelected = current === val;
  return (
    <div onClick={() => onSelect(val)} style={{ padding: "16px", borderRadius: 16, border: `2px solid ${isSelected ? color : "#e2e8f0"}`, background: isSelected ? bg : "#fff", cursor: "pointer", display: "flex", alignItems: "center", gap: 16, transition: "all 0.2s" }}>
      <div style={{ width: 24, height: 24, borderRadius: "50%", border: `6px solid ${isSelected ? color : "#e2e8f0"}`, background: "#fff", flexShrink: 0, transition: "border 0.2s" }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 15, fontWeight: 800, color: isSelected ? color : "#0f172a", marginBottom: 2 }}>{title}</p>
        <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{desc}</p>
      </div>
      {isSelected && <Icon size={20} color={color} />}
    </div>
  );
}