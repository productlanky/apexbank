import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, ArrowRight, Check, ChevronDown,
  RotateCcw, Delete, ShieldCheck, AlertCircle, Smartphone, Building, Loader2
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

const STEPS = ["Details", "Review", "OTP", "Done"];

const pageVariants = {
  initial: { opacity: 0, x: 20, filter: "blur(4px)" },
  in: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.3, ease: "easeOut" } },
  out: { opacity: 0, x: -20, filter: "blur(4px)", transition: { duration: 0.2, ease: "easeIn" } },
};

export default function WireTransfer({ onNav }) {
  const { send, userProfile, currentUser } = useApp();

  const [step, setStep] = useState(0);
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
  const [txId] = useState(() => "WR" + Math.random().toString(36).slice(2, 10).toUpperCase());
  const bankRef = useRef(null);

  // --- DYNAMIC FEE STATE ---
  const [wireFee, setWireFee] = useState(15); // Fallback default

  useEffect(() => {
    async function fetchSystemFees() {
      try {
        const feeDoc = await getDoc(doc(db, "system", "fees"));
        if (feeDoc.exists() && feeDoc.data().wireTransfer !== undefined) {
          setWireFee(Number(feeDoc.data().wireTransfer));
        }
      } catch (error) {
        console.error("Failed to fetch system fees:", error);
      }
    }
    fetchSystemFees();
  }, []);

  // --- FREEZE CHECK ---
  const userStatus = (userProfile?.status || userProfile?.accountStatus || "").toLowerCase();
  const isFrozen = userStatus === "frozen" || userStatus === "suspended" || userStatus === "hold";

  const availableBalance = Number(userProfile?.balances?.[currency]) || 0;
  const num = parseFloat(amount) || 0;
  const total = num + wireFee;
  const filteredBanks = BANKS.filter((b) => b.toLowerCase().includes(bankSearch.toLowerCase()));
  const sym = CURRENCY_SYMBOLS[currency] || "$";

  const fmt = (n) => `${sym}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  function canAdvance() {
    if (isFrozen) return false;
    if (step === 0) return bankName && holderName && routing.length === 9 && accountNum.length >= 4 && num > 0 && total <= availableBalance;
    if (step === 1) return true;
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
      setStep(2);
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
              memo || `Wire transfer to ${bankName}`,
              currency
            );
            await updateDoc(doc(db, "users", currentUser.uid), { activeTransferOtp: null });
            setStep(3);
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
    setStep(0); setBankName(""); setHolderName("");
    setRouting(""); setAccountNum(""); setAmount(""); setMemo("");
    setOtp(""); setOtpError(false); setIsVerifyingOtp(false); setCurrency("USD");
  }

  if (step === 3)
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "80vh", padding: "40px 24px" }}>
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 20 }} style={{ width: 88, height: 88, borderRadius: "50%", background: "linear-gradient(135deg, #059669, #10b981)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 0 16px rgba(16,185,129,0.1)", marginBottom: 28 }}>
          <Zap size={44} color="#fff" strokeWidth={2.5} />
        </motion.div>
        <p style={{ fontSize: 28, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px", marginBottom: 8, textAlign: "center" }}>Wire Initiated</p>
        <p style={{ fontSize: 15, color: "#64748b", textAlign: "center", maxWidth: 320, lineHeight: 1.6, marginBottom: 32 }}>
          Your wire transfer of <strong style={{ color: "#0f172a" }}>{fmt(num)}</strong> to <strong style={{ color: "#0f172a" }}>{holderName}</strong> has been securely transmitted.
        </p>
        <div style={{ width: "100%", maxWidth: 420, borderRadius: 20, background: "#fff", border: "1px solid #e2e8f0", padding: "24px", marginBottom: 24, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          {[
            ["Reference ID", txId],
            ["Recipient", holderName],
            ["Bank", bankName],
            ["Amount Sent", fmt(num)],
            ["Wire Fee", fmt(wireFee)],
            ["Est. Arrival", "Today by 5:00 PM ET"],
          ].map(([k, v]) => (
            <div key={`receipt-${k}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: 12, marginBottom: 12, borderBottom: k === "Est. Arrival" ? "none" : "1px solid #f1f5f9" }}>
              <span style={{ fontSize: 14, color: "#64748b" }}>{k}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", fontFamily: k === "Reference ID" ? "monospace" : "inherit" }}>{v}</span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 420 }}>
          <button onClick={reset} style={{ flex: 1, padding: "16px", fontSize: 15, fontWeight: 600, color: "#475569", background: "#f1f5f9", borderRadius: 14, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, transition: "background 0.2s" }}>
            <RotateCcw size={18} /> New Wire
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
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={20} color="#38bdf8" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Wire Transfer</h1>
        </div>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500, marginLeft: 48 }}>Guaranteed same-day domestic delivery.</p>
      </div>

      {isFrozen && (
        <div style={{ padding: "0 clamp(20px, 4vw, 32px)", maxWidth: 700, margin: "0 auto 24px" }}>
          <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 16, padding: "16px 20px", display: "flex", gap: 12, alignItems: "center" }}>
            <AlertCircle color="#dc2626" size={24} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#991b1b", marginBottom: 2 }}>Account Frozen</p>
              <p style={{ fontSize: 13, color: "#b91c1c", lineHeight: 1.4 }}>Outgoing wire transfers are currently disabled for your account. Please contact support for assistance.</p>
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: "0 clamp(20px, 4vw, 32px)", maxWidth: 700, margin: "0 auto", opacity: isFrozen ? 0.5 : 1, pointerEvents: isFrozen ? "none" : "auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 40, position: "relative", padding: "0 10px" }}>
          <div style={{ position: "absolute", top: 16, left: 30, right: 30, height: 2, background: "#e2e8f0", zIndex: 0 }} />
          {STEPS.map((s, i) => {
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
                <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
                  <div style={{ position: "relative" }} ref={bankRef}>
                    <label style={labelStyle}>Receiving Institution</label>
                    <button onClick={() => { setShowBanks((v) => !v); setBankSearch(""); }} style={{ width: "100%", padding: "16px", borderRadius: 14, background: "#fff", border: "1px solid #e2e8f0", color: bankName ? "#0f172a" : "#94a3b8", fontSize: 15, fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Building size={18} color={bankName ? "#0f172a" : "#94a3b8"} />
                        {bankName || "Select bank…"}
                      </div>
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
                    <Field label="Beneficiary Name" value={holderName} onChange={setHolderName} placeholder="Full legal name" />
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
                    <Field label="ABA Routing Number" value={routing} onChange={(v) => setRouting(v.replace(/\D/g, "").slice(0, 9))} placeholder="9 digits" mono hint={routing.length > 0 && routing.length < 9 ? `${routing.length}/9 digits` : null} />
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
                      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 16px", borderRadius: 14, background: "#fff", border: `2px solid ${num > availableBalance ? "#ef4444" : "#e2e8f0"}`, transition: "border 0.2s" }}>
                        <span style={{ color: "#0f172a", fontSize: 20, fontWeight: 700 }}>{sym}</span>
                        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" style={{ flex: 1, fontSize: 24, fontWeight: 800, color: "#0f172a", background: "transparent", border: "none", outline: "none", letterSpacing: "-0.5px" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                        <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Total with fee: <strong style={{ color: "#0f172a" }}>{fmt(total)}</strong></p>
                        <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>Available: {fmt(availableBalance)}</p>
                      </div>
                      {num > availableBalance && <p style={{ fontSize: 12, color: "#ef4444", marginTop: 4, fontWeight: 600 }}>Insufficient {currency} funds</p>}
                    </div>
                    <Field label="Message to Beneficiary" value={memo} onChange={setMemo} placeholder="Invoice #, reason, etc." />
                  </div>
                </div>

                <div style={{ marginTop: 32 }}>
                  <button disabled={!canAdvance()} onClick={() => setStep(1)} style={{ width: "100%", padding: "18px", fontSize: 16, fontWeight: 700, color: "#fff", background: canAdvance() ? "#0f172a" : "#cbd5e1", borderRadius: 16, border: "none", cursor: canAdvance() ? "pointer" : "not-allowed", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: canAdvance() ? "0 8px 20px rgba(15, 23, 42, 0.2)" : "none", transition: "all 0.2s" }}>
                    Review Wire Details <ArrowRight size={18} />
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="step1" variants={pageVariants} initial="initial" animate="in" exit="out">
                <div style={{ borderRadius: 24, background: "#fff", border: "1px solid #e2e8f0", overflow: "hidden", marginBottom: 24, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.05)" }}>
                  <div style={{ padding: "40px 24px", background: "linear-gradient(135deg, #0a0f1c, #1e293b)", textAlign: "center", position: "relative", overflow: "hidden" }}>
                    <Zap size={140} color="rgba(255,255,255,0.03)" style={{ position: "absolute", right: -20, bottom: -20, transform: "rotate(-15deg)" }} />
                    <p style={{ fontSize: 14, fontWeight: 600, color: "#38bdf8", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12, position: "relative" }}>Outgoing Wire Transfer</p>
                    <p style={{ fontSize: 48, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", position: "relative" }}>{fmt(num)}</p>
                    <p style={{ fontSize: 13, color: "#94a3b8", marginTop: 8, position: "relative" }}>+ {fmt(wireFee)} flat wire fee</p>
                  </div>
                  <div style={{ padding: "24px" }}>
                    {[
                      ["Beneficiary", holderName],
                      ["Institution", bankName],
                      ["ABA Routing", routing],
                      ["Account No.", `•••••${accountNum.slice(-4)}`],
                      ["Ledger", currency],
                      ["Total Deducted", fmt(total)],
                    ].map(([k, v]) => (
                      <div key={`review-${k}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: k === "Total Deducted" ? "none" : "1px solid #f1f5f9" }}>
                        <span style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>{k}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: k === "Total Deducted" ? "#0f172a" : "#0f172a" }}>{v}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={{ padding: "16px", borderRadius: 14, background: "#fffbeb", border: "1px solid #fef08a", display: "flex", gap: 12, marginBottom: 24 }}>
                  <AlertCircle size={20} color="#d97706" style={{ flexShrink: 0 }} />
                  <p style={{ fontSize: 13, color: "#b45309", lineHeight: 1.5, fontWeight: 500 }}>
                    Wire transfers are final and cannot be canceled once initiated. Please verify the ABA Routing and Account Number.
                  </p>
                </div>

                <div style={{ display: "flex", gap: 12 }}>
                  <button disabled={isGeneratingOtp} onClick={() => setStep(0)} style={{ padding: "18px 24px", fontSize: 15, fontWeight: 700, color: "#475569", background: "#f1f5f9", borderRadius: 16, border: "none", cursor: "pointer" }}>Edit</button>
                  <button disabled={isGeneratingOtp} onClick={generateAndSendOtp} style={{ flex: 1, padding: "18px", fontSize: 16, fontWeight: 700, color: "#fff", background: "#059669", borderRadius: 16, border: "none", cursor: isGeneratingOtp ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, boxShadow: "0 8px 20px rgba(5,150,105,0.2)" }}>
                    {isGeneratingOtp ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }}><Loader2 size={18} /></motion.div> : <ShieldCheck size={18} />}
                    {isGeneratingOtp ? "Securing..." : "Authenticate Wire"}
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={pageVariants} initial="initial" animate="in" exit="out" style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24, border: "2px solid #e2e8f0" }}>
                  <Smartphone size={32} color="#0f172a" />
                </div>
                <p style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 8 }}>Wire Authorization</p>
                <p style={{ fontSize: 14, color: "#64748b", marginBottom: 32, textAlign: "center", lineHeight: 1.6 }}>
                  Enter the security code sent to<br /><strong style={{ color: "#0f172a" }}>•••• {userProfile?.phone?.slice(-4) || "7823"}</strong>
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
                      <p style={{ marginTop: 16, fontSize: 15, fontWeight: 600, color: "#0f172a" }}>Verifying wire transfer...</p>
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
                        <button onClick={() => { setStep(1); setOtp(""); setOtpError(false); }} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>Cancel Wire</button>
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
        onFocus={(e) => (e.target.style.borderColor = "#0f172a")}
        onBlur={(e) => (e.target.style.borderColor = "#e2e8f0")}
      />
      {hint && <p style={{ fontSize: 12, color: "#f59e0b", marginTop: 6, fontWeight: 500 }}>{hint}</p>}
    </div>
  );
}