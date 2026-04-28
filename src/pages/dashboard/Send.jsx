import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2, Zap, ArrowRight, Check, ArrowDownUp,
  RotateCcw, Delete, ShieldCheck, AlertCircle, Smartphone, Loader2, ChevronDown,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../../lib/firebase";

const CURRENCY_SYMBOLS = { USD: "$", EUR: "€", GBP: "£", CAD: "$", AUD: "$" };

const BANKS = [
  "Chase", "Bank of America", "Wells Fargo", "Citibank",
  "U.S. Bank", "Capital One", "Goldman Sachs", "PNC Bank",
  "TD Bank", "Ally Bank", "Discover Bank", "Navy Federal",
  "Charles Schwab", "American Express", "Other",
];

const STEPS = ["Type", "Details", "Review", "OTP", "Done"];

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: "blur(4px)" },
  in: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } },
  out: { opacity: 0, y: -15, filter: "blur(4px)", transition: { duration: 0.2, ease: "easeIn" } },
};

export default function Send({ onNav }) {
  const { send, userProfile, currentUser } = useApp();

  const [step, setStep] = useState(0);
  const [type, setType] = useState(null);
  const [currency, setCurrency] = useState("USD");
  const [bankName, setBankName] = useState("");
  const [showBanks, setShowBanks] = useState(false);
  const [bankSearch, setBankSearch] = useState("");
  const [holderName, setHolderName] = useState("");
  const [routing, setRouting] = useState("");
  const [accountNum, setAccountNum] = useState("");
  const [acctType, setAcctType] = useState("checking");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");

  const [isGeneratingOtp, setIsGeneratingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [countdown, setCountdown] = useState(0);
  const [txId] = useState(() => "APX" + Math.random().toString(36).slice(2, 10).toUpperCase());
  const bankRef = useRef(null);

  // --- DYNAMIC FEES STATE ---
  const [systemFees, setSystemFees] = useState({ ach: 0, wire: 15 });

  useEffect(() => {
    async function fetchSystemFees() {
      try {
        const feeDoc = await getDoc(doc(db, "system", "fees"));
        if (feeDoc.exists()) {
          const data = feeDoc.data();
          setSystemFees({
            ach: data.achTransfer !== undefined ? Number(data.achTransfer) : 0,
            wire: data.wireTransfer !== undefined ? Number(data.wireTransfer) : 15,
          });
        }
      } catch (error) {
        console.error("Failed to fetch system fees:", error);
      }
    }
    fetchSystemFees();
  }, []);

  const activeTransferTypes = [
    { id: "ach", label: "ACH Transfer", icon: <Building2 size={24} />, fee: systemFees.ach, time: "1–2 business days", desc: "Standard bank-to-bank transfer. Best for non-urgent payments." },
    { id: "wire", label: "Wire Transfer", icon: <Zap size={24} />, fee: systemFees.wire, time: "Same day (by 4 PM ET)", desc: "Faster, direct transfer. Guaranteed same-day delivery." },
  ];

  // --- FREEZE CHECK ---
  const userStatus = (userProfile?.status || userProfile?.accountStatus || "").toLowerCase();
  const isFrozen = userStatus === "frozen" || userStatus === "suspended" || userStatus === "hold";

  const availableBalance = Number(userProfile?.balances?.[currency]) || 0;
  const num = parseFloat(amount) || 0;
  const selectedType = activeTransferTypes.find((t) => t.id === type);
  const fee = selectedType ? selectedType.fee : 0;
  const total = num + fee;
  const filteredBanks = BANKS.filter((b) => b.toLowerCase().includes(bankSearch.toLowerCase()));
  const sym = CURRENCY_SYMBOLS[currency] || "$";

  const fmt = (n) => `${sym}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function canAdvance() {
    if (isFrozen) return false; // Hard stop if frozen
    if (step === 0) return !!type;
    if (step === 1) return bankName && holderName && routing.length === 9 && accountNum.length >= 4 && num > 0 && total <= availableBalance;
    if (step === 2) return true;
    return false;
  }

  async function generateAndSendOtp() {
    setIsGeneratingOtp(true);
    try {
      const code = String(Math.floor(100000 + Math.random() * 900000));
      await updateDoc(doc(db, "users", currentUser.uid), { activeTransferOtp: code });
      setOtpCode(code);
      setOtp("");
      setOtpError(false);
      setCountdown(30);
      setStep(3);
    } catch (error) {
      console.error("Failed to generate OTP:", error);
      alert("Failed to secure connection. Please try again.");
    } finally {
      setIsGeneratingOtp(false);
    }
  }

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  function handleOtpKey(k) {
    if (isVerifyingOtp) return;
    if (k === "del") {
      setOtp((p) => p.slice(0, -1));
      setOtpError(false);
      return;
    }
    if (otp.length >= 6) return;
    const next = otp + k;
    setOtp(next);
    setOtpError(false);

    if (next.length === 6) {
      setIsVerifyingOtp(true);
      setTimeout(async () => {
        if (next === otpCode) {
          try {
            await send(
              { name: holderName, avatar: holderName.slice(0, 2).toUpperCase() },
              total,
              memo || `${type === "ach" ? "ACH" : "Wire"} to ${bankName}`,
              currency
            );
            await updateDoc(doc(db, "users", currentUser.uid), { activeTransferOtp: null });
            setStep(4);
          } catch (error) {
            console.error("Transaction failed:", error);
            alert(error.message);
            setOtp("");
          } finally {
            setIsVerifyingOtp(false);
          }
        } else {
          setOtpError(true);
          setOtp("");
          setIsVerifyingOtp(false);
        }
      }, 1000);
    }
  }

  function reset() {
    setStep(0); setType(null); setBankName(""); setHolderName("");
    setRouting(""); setAccountNum(""); setAmount(""); setMemo("");
    setOtp(""); setOtpError(false); setCurrency("USD"); setIsVerifyingOtp(false);
  }

  if (step === 4)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "40px 24px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 16px rgba(16,185,129,0.1)", marginBottom: 28 }}>
          <Check size={44} color="#fff" strokeWidth={3} />
        </motion.div>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 8, textAlign: "center" }}>Transfer Initiated</p>
        <p style={{ fontSize: 15, color: "#64748b", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>
          Your {type === "ach" ? "ACH" : "wire"} transfer of <strong style={{ color: "#0f172a" }}>{fmt(num)}</strong> to <strong style={{ color: "#0f172a" }}>{holderName}</strong> is being processed.
        </p>
        <div style={{ width: "100%", maxWidth: 420, borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", padding: "24px", marginBottom: 24, boxShadow: "0 4px 12px rgba(0,0,0,0.03)" }}>
          {[
            ["Transaction ID", txId],
            ["Recipient", holderName],
            ["Bank", bankName],
            ["Amount", fmt(num)],
            ["Fee", fee ? fmt(fee) : "Free"],
            ["Status", "Processing"],
          ].map(([k, v]) => (
            <div key={`receipt-${k}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, marginBottom: 12, borderBottom: "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 14, color: "#64748b" }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: k === "Transaction ID" ? "monospace" : "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 420 }}>
          <button onClick={reset} style={{ flex: 1, padding: "16px", fontSize: 15, fontWeight: 600, color: "#475569", background: "#f1f5f9", borderRadius: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}>
            <RotateCcw size={18} /> New Transfer
          </button>
          {onNav && (
            <button onClick={() => onNav("dashboard")} style={{ flex: 1, padding: "16px", fontSize: 15, fontWeight: 700, color: "#fff", background: "#059669", borderRadius: 14, border: "none", cursor: "pointer", transition: "background 0.2s" }}>
              Dashboard
            </button>
          )}
        </div>
      </motion.div>
    );

  return (
    <div style={{ minHeight: "100%", paddingBottom: 100 }}>
      <div style={{ padding: "24px clamp(20px, 4vw, 32px)", marginBottom: 10 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.5px" }}>Send Money</h1>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Domestic bank transfer</p>
      </div>

      {isFrozen && (
        <div style={{ padding: "0 clamp(20px, 4vw, 32px)", maxWidth: 700, margin: "0 auto 24px" }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <AlertCircle color="#dc2626" size={24} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 2 }}>Account Frozen</p>
              <p style={{ fontSize: 13, color: "#b91c1c", lineHeight: 1.4 }}>Outgoing transactions are currently disabled for your account. Please contact support for assistance.</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 clamp(20px, 4vw, 32px)", maxWidth: 700, margin: "0 auto", opacity: isFrozen ? 0.5 : 1, pointerEvents: isFrozen ? "none" : "auto" }}>
        
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, position: "relative" }}>
          <div style={{ position: "absolute", top: 16, left: 20, right: 20, height: 2, background: "#e2e8f0", zIndex: 0 }} />
          {STEPS.slice(0, 4).map((s, i) => {
            const done = step > i;
            const active = step === i;
            return (
              <div key={`step-indicator-${s}`} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, zIndex: 1, width: 60 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", background: done ? "#059669" : active ? "#0f172a" : "#fff", border: `2px solid ${done ? "#059669" : active ? "#0f172a" : "#cbd5e1"}`, fontSize: 13, fontWeight: 700, color: done || active ? "#fff" : "#94a3b8", transition: "all 0.3s ease" }}>
                  {done ? <Check size={16} strokeWidth={3} /> : i + 1}
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: active ? "#0f172a" : done ? "#059669" : "#94a3b8" }}>{s}</span>
              </div>
            );
          })}
        </div>

        <div style={{ position: "relative", overflow: "hidden" }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0" variants={pageVariants} initial="initial" animate="in" exit="out">
                <p style={{ fontSize: 18, fontWeight: 700, color: "#0f172a", marginBottom: 20 }}>Select delivery speed</p>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16, marginBottom: 32 }}>
                  {activeTransferTypes.map((t) => {
                    const isSelected = type === t.id;
                    return (
                      <motion.button whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} key={`transfer-type-${t.id}`} onClick={() => setType(t.id)} style={{ textAlign: "left", padding: "24px", borderRadius: 20, cursor: "pointer", background: isSelected ? "#ecfdf5" : "#fff", border: `2px solid ${isSelected ? "#10b981" : "#e2e8f0"}`, boxShadow: isSelected ? "0 4px 12px rgba(16,185,129,0.1)" : "0 2px 8px rgba(0,0,0,0.02)", transition: "background 0.2s, border 0.2s", position: "relative" }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: isSelected ? "#10b981" : "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: isSelected ? "#fff" : "#64748b", marginBottom: 16 }}>{t.icon}</div>
                        <p style={{ fontSize: 16, fontWeight: 800, color: "#0f172a", marginBottom: 6 }}>{t.label}</p>
                        <p style={{ fontSize: 13, color: "#64748b", lineHeight: 1.5, marginBottom: 16 }}>{t.desc}</p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: isSelected ? "#dcfce7" : "#f1f5f9", color: isSelected ? "#059669" : "#475569" }}>{t.fee === 0 ? "Free" : `Fee: $${t.fee}`}</span>
                          <span style={{ fontSize: 12, fontWeight: 600, padding: "4px 10px", borderRadius: 8, background: "#f1f5f9", color: "#64748b" }}>{t.time}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
                <button disabled={!type} onClick={() => setStep(1)} style={{ width: "100%", padding: "16px", fontSize: 16, fontWeight: 700, color: "#fff", background: type ? "#059669" : "#cbd5e1", borderRadius: 14, border: "none", cursor: type ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>
                  Continue <ArrowRight size={18} />
                </button>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out">
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ position: "relative" }} ref={bankRef}>
                    <label style={labelStyle}>Recipient's Bank</label>
                    <button onClick={() => { setShowBanks((v) => !v); setBankSearch(""); }} style={{ width: "100%", padding: "16px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", color: bankName ? "#0f172a" : "#94a3b8", fontSize: 15, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}>
                      {bankName || "Select bank…"}
                      <ChevronDown size={18} color="#94a3b8" style={{ transform: showBanks ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    </button>
                    <AnimatePresence>
                      {showBanks && (
                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} style={{ position: "absolute", top: "105%", left: 0, right: 0, zIndex: 10, borderRadius: 16, background: "#fff", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)" }}>
                          <div style={{ padding: 12, borderBottom: "1px solid #f1f5f9" }}>
                            <input value={bankSearch} onChange={(e) => setBankSearch(e.target.value)} placeholder="Search banks…" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, background: "#f8fafc", border: "1px solid #e2e8f0", color: "#0f172a", fontSize: 14, outline: "none" }} autoFocus />
                          </div>
                          <div style={{ maxHeight: 240, overflowY: "auto" }}>
                            {filteredBanks.map((b) => (
                              <button key={`bank-${b}`} onClick={() => { setBankName(b); setShowBanks(false); }} style={{ width: "100%", textAlign: "left", padding: "14px 16px", fontSize: 14, fontWeight: 500, color: bankName === b ? "#059669" : "#334155", background: bankName === b ? "#ecfdf5" : "#fff", cursor: "pointer", border: "none" }}>{b}</button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                    <Field label="Account Holder Name" value={holderName} onChange={setHolderName} placeholder="Full legal name" />
                    <div>
                      <label style={labelStyle}>Account Type</label>
                      <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: "1px solid #e2e8f0", background: "#f8fafc", padding: 4 }}>
                        {["checking", "savings"].map((t) => (
                          <button key={`acct-type-${t}`} onClick={() => setAcctType(t)} style={{ flex: 1, padding: "10px", fontSize: 14, fontWeight: 600, cursor: "pointer", border: "none", borderRadius: 8, textTransform: "capitalize", background: acctType === t ? "#fff" : "transparent", color: acctType === t ? "#0f172a" : "#64748b", boxShadow: acctType === t ? "0 1px 3px rgba(0,0,0,0.1)" : "none", transition: "all 0.2s ease" }}>{t}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                    <Field label="Routing Number" value={routing} onChange={(v) => setRouting(v.replace(/\D/g, "").slice(0, 9))} placeholder="9 digits" mono hint={routing.length > 0 && routing.length < 9 ? `${routing.length}/9 digits` : null} />
                    <Field label="Account Number" value={accountNum} onChange={(v) => setAccountNum(v.replace(/\D/g, ""))} placeholder="Account digits" mono />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 20 }}>
                    <div>
                      <label style={{ ...labelStyle, display: "flex", justifyContent: "space-between" }}>
                        Transfer Amount
                        <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={{ border: "none", background: "transparent", outline: "none", color: "#0f172a", fontWeight: 700, cursor: "pointer" }}>
                          {Object.keys(CURRENCY_SYMBOLS).map((c) => <option key={`curr-${c}`} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 14, background: "#fff", border: `2px solid ${num > availableBalance ? "#ef4444" : "#e2e8f0"}`, boxShadow: "0 1px 2px rgba(0,0,0,0.02)", transition: "border 0.2s" }}>
                        <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{sym}</span>
                        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ flex: 1, fontSize: 24, fontWeight: 800, color: "#0f172a", background: "transparent", border: "none", outline: "none", letterSpacing: "-0.5px" }} />
                      </div>
                      <p style={{ fontSize: 12, color: "#64748b", marginTop: 8, fontWeight: 500 }}>Available: {sym}{availableBalance.toLocaleString()} · Total with fee: {fmt(total)}</p>
                      {num > availableBalance && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>Insufficient funds in {currency}</p>}
                    </div>
                    <Field label="Memo (Optional)" value={memo} onChange={setMemo} placeholder="What's this for?" />
                  </div>
                </div>
                <div style={{ marginTop: 32, display: "flex", gap: 12 }}>
                  <button onClick={() => setStep(0)} style={{ padding: "16px 24px", fontSize: 15, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 14, border: "none", cursor: "pointer" }}>Back</button>
                  <button disabled={!canAdvance()} onClick={() => setStep(2)} style={{ flex: 1, padding: "16px", fontSize: 16, fontWeight: 700, color: "#fff", background: canAdvance() ? "#059669" : "#cbd5e1", borderRadius: 14, border: "none", cursor: canAdvance() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "background 0.2s" }}>Review Transfer <ArrowRight size={18} /></button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out">
                <div style={{ borderRadius: 24, background: "#fff", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "40px 24px", background: "linear-gradient(135deg, #0f172a, #1e293b)", textAlign: "center" }}>
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>{type === "ach" ? "ACH Transfer" : "Wire Transfer"}</p>
                    <p style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px" }}>{fmt(num)}</p>
                    {fee > 0 && <p style={{ fontSize: 13, color: "#cbd5e1", marginTop: 8 }}>+{fmt(fee)} fee</p>}
                  </div>
                  <div style={{ padding: "24px" }}>
                    {[
                      ["Recipient", holderName],
                      ["Bank", bankName],
                      ["Routing", `•••••${routing.slice(-4)}`],
                      ["Account", `•••••${accountNum.slice(-4)}`],
                      ["Ledger", currency],
                      ["Total Deducted", fmt(total)],
                    ].map(([k, v]) => (
                      <div key={`review-${k}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{k}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: k === "Total Deducted" ? "#059669" : "#0f172a" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 12 }}>
                  <button disabled={isGeneratingOtp} onClick={() => setStep(1)} style={{ padding: "16px 24px", fontSize: 15, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 14, border: "none", cursor: "pointer" }}>Edit</button>
                  <button disabled={isGeneratingOtp} onClick={generateAndSendOtp} style={{ flex: 1, padding: "16px", fontSize: 16, fontWeight: 700, color: "#fff", background: "#0f172a", borderRadius: 14, border: "none", cursor: isGeneratingOtp ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {isGeneratingOtp ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={18} /></motion.div> : <ShieldCheck size={18} />}
                    {isGeneratingOtp ? "Securing..." : "Confirm with OTP"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "2px solid #e2e8f0" }}>
                  <Smartphone size={32} color="#0f172a" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Verify Identity</p>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
                  Enter the 6-digit code sent to<br /><strong style={{ color: "#0f172a" }}>•••• {userProfile?.phone?.slice(-4) || "7823"}</strong>
                </p>

                <div style={{ display: "flex", gap: 16, marginBottom: otpError ? 12 : 40 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <motion.div key={`otp-dot-${i}`} animate={otpError ? { x: [-5, 5, -5, 5, 0], borderColor: "#ef4444", backgroundColor: "#fef2f2" } : { scale: i < otp.length ? 1.2 : 1, backgroundColor: i < otp.length ? "#0f172a" : "#f1f5f9", borderColor: i < otp.length ? "#0f172a" : "#cbd5e1" }} transition={otpError ? { duration: 0.4 } : { duration: 0.2 }} style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid" }} />
                  ))}
                </div>

                {otpError && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, padding: "8px 16px", background: "#fef2f2", borderRadius: 8 }}>
                    <AlertCircle size={14} color="#ef4444" />
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#ef4444" }}>Incorrect code. Try again.</p>
                  </motion.div>
                )}

                <AnimatePresence mode="wait">
                  {isVerifyingOtp ? (
                    <motion.div key="loading-state" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 260 }}>
                      <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}>
                        <Loader2 size={40} color="#0f172a" />
                      </motion.div>
                      <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Verifying secure code...</p>
                    </motion.div>
                  ) : (
                    <motion.div key="keypad-state" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, width: "100%", maxWidth: 300, marginBottom: 24 }}>
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "del"].map((k, idx) => (
                          k === "" ? <div key={`pad-empty-${idx}`} /> : (
                            <motion.button key={`pad-key-${k}`} whileTap={{ scale: 0.9 }} onClick={() => handleOtpKey(k)} style={{ height: 64, borderRadius: 16, fontSize: k === "del" ? 16 : 24, fontWeight: 600, color: k === "del" ? "#64748b" : "#0f172a", background: "#f8fafc", border: "1px solid #e2e8f0", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.02)" }}>
                              {k === "del" ? <Delete size={20} /> : k}
                            </motion.button>
                          )
                        ))}
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", width: "100%" }}>
                        {countdown > 0 ? (
                          <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                            Resend code in <span style={{ color: "#0f172a", fontWeight: 700 }}>00:{countdown.toString().padStart(2, "0")}</span>
                          </p>
                        ) : (
                          <button onClick={generateAndSendOtp} disabled={isGeneratingOtp} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: "#059669", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
                            {isGeneratingOtp ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={16} /></motion.div> : <RotateCcw size={16} />}
                            Resend Code
                          </button>
                        )}
                        <button onClick={() => { setStep(2); setOtp(""); setOtpError(false); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel Transfer</button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

const labelStyle = { fontSize: 13, fontWeight: 700, color: "#475569", display: "block", marginBottom: 8 };

function Field({ label, value, onChange, placeholder, mono, hint }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <input
        value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        style={{ width: "100%", padding: "16px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", outline: "none", color: "#0f172a", fontSize: 15, fontWeight: 500, fontFamily: mono ? "monospace" : "inherit", letterSpacing: mono ? "0.1em" : "inherit", transition: "border 0.2s", boxShadow: "0 1px 2px rgba(0,0,0,0.02)" }}
        onFocus={(e) => (e.target.style.borderColor = "#059669")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
      {hint && <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 6, fontWeight: 500 }}>{hint}</p>}
    </div>
  );
}