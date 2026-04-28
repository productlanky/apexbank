import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp, Settings, DollarSign, Save, RefreshCw, Loader2, AlertCircle, CheckCircle2, Globe
} from "lucide-react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../lib/firebase";

const CURRENCIES = ["EUR", "GBP", "CAD", "AUD"]; // USD is the base currency (1.00)

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function SystemSettings() {
  const [isLoading, setIsLoading] = useState(true);
  
  // Rates State
  const [rates, setRates] = useState({ USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.52 });
  const [isSavingRates, setIsSavingRates] = useState(false);
  const [isFetchingMarket, setIsFetchingMarket] = useState(false);
  const [rateSuccess, setRateSuccess] = useState(false);

  // Fees State
  const [fees, setFees] = useState({ wireTransfer: 15, achTransfer: 0 });
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [feeSuccess, setFeeSuccess] = useState(false);

  // --- FETCH INITIAL SETTINGS ---
  useEffect(() => {
    async function fetchSystemData() {
      try {
        const ratesSnap = await getDoc(doc(db, "system", "rates"));
        if (ratesSnap.exists() && Object.keys(ratesSnap.data()).length > 0) {
          setRates(prev => ({ ...prev, ...ratesSnap.data() }));
        }

        const feesSnap = await getDoc(doc(db, "system", "fees"));
        if (feesSnap.exists()) {
          setFees(prev => ({ ...prev, ...feesSnap.data() }));
        }
      } catch (error) {
        console.error("Failed to fetch system settings:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchSystemData();
  }, []);

  // --- HANDLERS: RATES ---
  const handleRateChange = (currency, value) => {
    setRates(prev => ({ ...prev, [currency]: parseFloat(value) || 0 }));
    setRateSuccess(false);
  };

  const saveRates = async () => {
    setIsSavingRates(true);
    try {
      await setDoc(doc(db, "system", "rates"), {
        ...rates,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setRateSuccess(true);
      setTimeout(() => setRateSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save rates:", error);
      alert("Failed to save rates.");
    } finally {
      setIsSavingRates(false);
    }
  };

  const fetchLiveMarketRates = async () => {
    setIsFetchingMarket(true);
    setRateSuccess(false);
    try {
      const res = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
      const data = await res.json();
      
      setRates({
        USD: 1,
        EUR: data.rates.EUR || 0.92,
        GBP: data.rates.GBP || 0.79,
        CAD: data.rates.CAD || 1.36,
        AUD: data.rates.AUD || 1.52,
      });
    } catch (error) {
      console.error("Failed to fetch live rates:", error);
      alert("Could not connect to the live market API.");
    } finally {
      setIsFetchingMarket(false);
    }
  };

  // --- HANDLERS: FEES ---
  const handleFeeChange = (feeType, value) => {
    setFees(prev => ({ ...prev, [feeType]: parseFloat(value) || 0 }));
    setFeeSuccess(false);
  };

  const saveFees = async () => {
    setIsSavingFees(true);
    try {
      await setDoc(doc(db, "system", "fees"), {
        ...fees,
        updatedAt: serverTimestamp()
      }, { merge: true });
      setFeeSuccess(true);
      setTimeout(() => setFeeSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save fees:", error);
      alert("Failed to save fees.");
    } finally {
      setIsSavingFees(false);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants} initial="hidden" animate="visible"
      style={{ padding: "24px clamp(20px, 4vw, 32px)", paddingBottom: 100, maxWidth: 1000, margin: "0 auto" }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.5px" }}>System Settings</h1>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Control platform-wide variables, exchange rates, and global fees.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        
        {/* ========================================== */}
        {/* SECTION 1: FX RATES ENGINE                 */}
        {/* ========================================== */}
        <motion.div variants={itemVariants} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, flexWrap: "wrap", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <TrendingUp size={20} color="#3b82f6" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>FX Rate Engine</h2>
              </div>
              <p style={{ fontSize: 14, color: "#64748b", maxWidth: 400, lineHeight: 1.5 }}>
                Manually adjust the exchange spread for profit, or sync with the live market. Users' Exchange pages update instantly.
              </p>
            </div>
            
            <button 
              onClick={fetchLiveMarketRates} disabled={isFetchingMarket}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 16px", background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#0f172a", cursor: isFetchingMarket ? "not-allowed" : "pointer", transition: "all 0.2s" }}
            >
              {isFetchingMarket ? <Loader2 size={16} className="animate-spin" /> : <Globe size={16} color="#3b82f6" />}
              Sync Live Market Rates
            </button>
          </div>

          <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: "#64748b", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Base Currency: USD (1.00)
            </p>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              {CURRENCIES.map(curr => (
                <div key={curr}>
                  <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>
                    {curr} Rate
                    <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>1 USD =</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontWeight: 800, color: "#94a3b8" }}>{curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$'}</span>
                    <input 
                      type="number" step="0.0001" min="0"
                      value={rates[curr]} onChange={e => handleRateChange(curr, e.target.value)}
                      style={{ width: "100%", padding: "14px 16px 14px 40px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                      onFocus={(e) => (e.target.style.borderColor = "#3b82f6")} onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 24 }}>
            {rateSuccess && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#059669" }}>
                <CheckCircle2 size={16} /> Rates Published Live
              </motion.span>
            )}
            <button 
              onClick={saveRates} disabled={isSavingRates}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#0f172a", color: "#fff", borderRadius: 14, fontSize: 15, fontWeight: 700, border: "none", cursor: isSavingRates ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(15,23,42,0.15)" }}
            >
              {isSavingRates ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save & Publish Rates
            </button>
          </div>
        </motion.div>

        {/* ========================================== */}
        {/* SECTION 2: GLOBAL FEES                     */}
        {/* ========================================== */}
        <motion.div variants={itemVariants} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, padding: 32, boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: "#fef2f2", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Settings size={20} color="#dc2626" />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a" }}>Platform Fees</h2>
          </div>
          <p style={{ fontSize: 14, color: "#64748b", maxWidth: 500, lineHeight: 1.5, marginBottom: 24 }}>
            Adjust the flat fees applied to user transactions. (Note: Ensure your frontend code fetches these values dynamically if changed).
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 24, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 16, padding: 24 }}>
            
            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Wire Transfer Fee</label>
              <div style={{ position: "relative" }}>
                <DollarSign size={16} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="number" step="0.5" min="0"
                  value={fees.wireTransfer} onChange={e => handleFeeChange('wireTransfer', e.target.value)}
                  style={{ width: "100%", padding: "14px 16px 14px 40px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 13, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>ACH Transfer Fee</label>
              <div style={{ position: "relative" }}>
                <DollarSign size={16} color="#94a3b8" style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)" }} />
                <input 
                  type="number" step="0.5" min="0"
                  value={fees.achTransfer} onChange={e => handleFeeChange('achTransfer', e.target.value)}
                  style={{ width: "100%", padding: "14px 16px 14px 40px", borderRadius: 12, border: "1px solid #cbd5e1", background: "#fff", fontSize: 16, fontWeight: 700, color: "#0f172a", outline: "none", transition: "border 0.2s" }}
                  onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                />
              </div>
            </div>

          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 16, marginTop: 24 }}>
            {feeSuccess && (
              <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, color: "#059669" }}>
                <CheckCircle2 size={16} /> Fees Updated
              </motion.span>
            )}
            <button 
              onClick={saveFees} disabled={isSavingFees}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "14px 28px", background: "#dc2626", color: "#fff", borderRadius: 14, fontSize: 15, fontWeight: 700, border: "none", cursor: isSavingFees ? "not-allowed" : "pointer", boxShadow: "0 4px 12px rgba(220,38,38,0.2)" }}
            >
              {isSavingFees ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Update Fees
            </button>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}