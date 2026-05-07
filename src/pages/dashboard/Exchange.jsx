import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Check,
  ArrowDownUp,
  RefreshCcw,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Loader2,
  ChevronDown,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import {
  doc,
  updateDoc,
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../lib/firebase";

const CURRENCIES = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "CAD", symbol: "$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "$", name: "Australian Dollar" },
];

const pageVariants = {
  initial: { opacity: 0, y: 15, filter: "blur(4px)" },
  in: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.3, ease: "easeOut" },
  },
  out: {
    opacity: 0,
    y: -15,
    filter: "blur(4px)",
    transition: { duration: 0.2, ease: "easeIn" },
  },
};

export default function Exchange({ onNav }) {
  const { userProfile, currentUser } = useApp();

  const [step, setStep] = useState(0);
  const [fromCurrency, setFromCurrency] = useState("USD");
  const [toCurrency, setToCurrency] = useState("CAD");
  const [amount, setAmount] = useState("");

  // Real-time Rates State
  const [rates, setRates] = useState(null);
  const [isLoadingRates, setIsLoadingRates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txId] = useState(
    () => "EXC" + Math.random().toString(36).slice(2, 10).toUpperCase(),
  );

  // --- 🔥 LIVE RATES (FIREBASE + API FALLBACK) 🔥 ---
  useEffect(() => {
    // Listen to Firebase first (in case the Admin wants to set custom rates/spreads)
    const unsub = onSnapshot(
      doc(db, "system", "rates"),
      async (docSnap) => {
        if (docSnap.exists() && Object.keys(docSnap.data()).length > 0) {
          // 1. Admin has set custom rates in Firebase
          setRates(docSnap.data());
          setIsLoadingRates(false);
        } else {
          // 2. No Admin rates? Fetch live market data from Free API
          try {
            const res = await fetch(
              "https://api.exchangerate-api.com/v4/latest/USD",
            );
            const data = await res.json();

            setRates({
              USD: data.rates.USD || 1,
              EUR: data.rates.EUR || 0.92,
              GBP: data.rates.GBP || 0.79,
              CAD: data.rates.CAD || 1.36,
              AUD: data.rates.AUD || 1.52,
            });
          } catch (err) {
            console.error("API fetch failed, using offline fallback", err);
            // Ultimate offline fallback just in case the API goes down
            setRates({ USD: 1, EUR: 0.92, GBP: 0.79, CAD: 1.36, AUD: 1.52 });
          } finally {
            setIsLoadingRates(false);
          }
        }
      },
      (error) => {
        console.error("Error fetching live rates:", error);
        setIsLoadingRates(false);
      },
    );

    return () => unsub();
  }, []);

  // --- CALCULATIONS ---
  const numAmount = parseFloat(amount) || 0;
  const availableBalance = Number(userProfile?.balances?.[fromCurrency]) || 0;

  let exchangeRate = 1;
  let convertedAmount = 0;

  if (rates) {
    const rateFrom = rates[fromCurrency];
    const rateTo = rates[toCurrency];
    exchangeRate = rateTo / rateFrom;
    convertedAmount = numAmount * exchangeRate;
  }

  const fromSym = CURRENCIES.find((c) => c.code === fromCurrency)?.symbol || "";
  const toSym = CURRENCIES.find((c) => c.code === toCurrency)?.symbol || "";

  const fmt = (n) =>
    `${fromSym}${Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const canAdvance =
    numAmount > 0 &&
    numAmount <= availableBalance &&
    fromCurrency !== toCurrency;

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const handleExchange = async () => {
    setIsProcessing(true);
    try {
      const currentFromBal = Number(userProfile?.balances?.[fromCurrency]) || 0;
      const currentToBal = Number(userProfile?.balances?.[toCurrency]) || 0;

      const newBalances = {
        ...(userProfile?.balances || {}),
        [fromCurrency]: currentFromBal - numAmount,
        [toCurrency]: currentToBal + convertedAmount,
      };

      await addDoc(collection(db, "transactions"), {
        userId: currentUser.uid,
        type: "exchange",
        name: `Converted ${fromCurrency} to ${toCurrency}`,
        avatar: "🔄",
        amount: numAmount,
        currency: fromCurrency,
        convertedAmount: convertedAmount,
        targetCurrency: toCurrency,
        rate: exchangeRate,
        date: new Date().toISOString(),
        category: "Exchange",
        status: "Completed",
        timestamp: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", currentUser.uid), {
        balances: newBalances,
      });

      setTimeout(() => {
        setIsProcessing(false);
        setStep(2);
      }, 1000);
    } catch (error) {
      console.error("Exchange failed:", error);
      alert("Failed to process exchange. Please try again.");
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setStep(0);
    setAmount("");
  };

  if (step === 2)
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "80vh",
          padding: "40px 24px",
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, #ea580c, #f97316)", // Updated color
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 0 16px rgba(234, 88, 12, 0.1)", // Updated shadow
            marginBottom: 28,
          }}
        >
          <Check size={44} color="#fff" strokeWidth={3} />
        </motion.div>
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          Exchange Complete
        </p>
        <p
          style={{
            fontSize: 15,
            color: "#64748b",
            textAlign: "center",
            maxWidth: 320,
            lineHeight: 1.6,
            marginBottom: 32,
          }}
        >
          You successfully converted{" "}
          <strong style={{ color: "#0f172a" }}>
            {fromSym}
            {numAmount.toLocaleString()} {fromCurrency}
          </strong>{" "}
          to{" "}
          <strong style={{ color: "#ea580c" }}> {/* Updated color */}
            {toSym}
            {convertedAmount.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}{" "}
            {toCurrency}
          </strong>
          .
        </p>

        <div
          style={{
            width: "100%",
            maxWidth: 420,
            borderRadius: 20,
            background: "#fff",
            border: "1px solid #e2e8f0",
            padding: "24px",
            marginBottom: 24,
            boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
          }}
        >
          {[
            ["Receipt ID", txId],
            [
              "Rate",
              `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`,
            ],
            [
              "Deducted",
              `${fromSym}${numAmount.toLocaleString()} ${fromCurrency}`,
            ],
            [
              "Credited",
              `${toSym}${convertedAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${toCurrency}`,
            ],
          ].map(([k, v]) => (
            <div
              key={`receipt-${k}`}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                paddingBottom: 12,
                marginBottom: 12,
                borderBottom: k === "Credited" ? "none" : "1px solid #f1f5f9",
              }}
            >
              <span style={{ fontSize: 14, color: "#64748b" }}>{k}</span>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  fontFamily: k === "Receipt ID" ? "monospace" : "inherit",
                }}
              >
                {v}
              </span>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 12, width: "100%", maxWidth: 420 }}>
          <button
            onClick={reset}
            style={{
              flex: 1,
              padding: "16px",
              fontSize: 15,
              fontWeight: 600,
              color: "#475569",
              background: "#f1f5f9",
              borderRadius: 14,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              transition: "background 0.2s",
            }}
          >
            <RotateCcw size={18} /> New Exchange
          </button>
          {onNav && (
            <button
              onClick={() => {
                window.location.href = "/app/dashboard";
              }}
              style={{
                flex: 1,
                padding: "16px",
                fontSize: 15,
                fontWeight: 700,
                color: "#fff",
                background: "#ea580c", // Updated color
                borderRadius: 14,
                border: "none",
                cursor: "pointer",
                transition: "background 0.2s",
              }}
            >
              Dashboard
            </button>
          )}
        </div>
      </motion.div>
    );

  return (
    <div style={{ minHeight: "100%", paddingBottom: 100 }}>
      {/* PAGE HEADER */}
      <div
        style={{
          padding: "24px clamp(20px, 4vw, 32px)",
          marginBottom: 20,
          display: "flex",
          flexWrap: "wrap",
          gap: 16,
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 800,
              color: "#0f172a",
              marginBottom: 4,
              letterSpacing: "-0.5px",
            }}
          >
            Exchange Money
          </h1>
          <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>
            Switch between currencies with ease
          </p>
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#f8fafc",
            border: "1px solid #e2e8f0",
            padding: "8px 14px",
            borderRadius: 99,
            color: "#475569",
            fontSize: 13,
            fontWeight: 700,
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          }}
        >
          {isLoadingRates ? (
            <Loader2 size={16} className="animate-spin" color="#94a3b8" />
          ) : (
            <TrendingUp size={16} color="#ea580c" /> // Updated color
          )}
          {isLoadingRates ? "Connecting to market..." : "Live Market Rates"}
        </div>
      </div>

      {/* WIDGET CONTAINER */}
      <div
        style={{
          padding: "0 clamp(20px, 4vw, 32px)",
          maxWidth: 480,
          margin: "0 auto",
          width: "100%",
        }}
      >
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="step0"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
            >
              <div
                style={{
                  background: "#fff",
                  borderRadius: 28,
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.08)",
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                {/* --- TOP HALF: YOU PAY --- */}
                <div
                  style={{
                    padding: "28px 24px 36px 24px",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      You Pay
                    </p>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      Balance: {fromSym}
                      {availableBalance.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </p>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div style={{ position: "relative" }}>
                      <select
                        value={fromCurrency}
                        onChange={(e) => setFromCurrency(e.target.value)}
                        style={{
                          appearance: "none",
                          background: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: "12px 36px 12px 16px",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          outline: "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={`from-${c.code}`} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        color="#64748b"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>

                    <input
                      type="number"
                      min="0"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{
                        flex: 1,
                        width: "100%",
                        fontSize: 40,
                        fontWeight: 800,
                        color:
                          numAmount > availableBalance ? "#ef4444" : "#0f172a",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        textAlign: "right",
                        letterSpacing: "-1px",
                      }}
                    />
                  </div>
                  {numAmount > availableBalance && (
                    <motion.p
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        color: "#ef4444",
                        fontWeight: 600,
                        marginTop: 12,
                        justifyContent: "flex-end",
                      }}
                    >
                      <AlertCircle size={14} /> Insufficient {fromCurrency}{" "}
                      balance
                    </motion.p>
                  )}
                </div>

                {/* --- DIVIDER & SWAP BUTTON --- */}
                <div
                  style={{
                    height: 1,
                    background: "#e2e8f0",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <motion.button
                    onClick={handleSwap}
                    className="active:scale-95"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      width: 44,
                      height: 44,
                      borderRadius: "50%",
                      background: "#fff",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                      zIndex: 20,
                    }}
                  >
                    <ArrowDownUp
                      className="hover:scale-105 hover:rotate-180 transition-transform active:rotate-180"
                      size={18}
                      color="#0f172a"
                    />
                  </motion.button>
                </div>

                {/* --- BOTTOM HALF: YOU RECEIVE --- */}
                <div
                  style={{
                    padding: "36px 24px 28px 24px",
                    background: "#f8fafc",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 15,
                        fontWeight: 700,
                        color: "#64748b",
                      }}
                    >
                      You Receive
                    </p>
                  </div>

                  <div
                    style={{ display: "flex", alignItems: "center", gap: 16 }}
                  >
                    <div style={{ position: "relative" }}>
                      <select
                        value={toCurrency}
                        onChange={(e) => setToCurrency(e.target.value)}
                        style={{
                          appearance: "none",
                          background: "#fff",
                          border: "1px solid #e2e8f0",
                          borderRadius: 16,
                          padding: "12px 36px 12px 16px",
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          outline: "none",
                          cursor: "pointer",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
                        }}
                      >
                        {CURRENCIES.map((c) => (
                          <option key={`to-${c.code}`} value={c.code}>
                            {c.code}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={16}
                        color="#64748b"
                        style={{
                          position: "absolute",
                          right: 12,
                          top: "50%",
                          transform: "translateY(-50%)",
                          pointerEvents: "none",
                        }}
                      />
                    </div>

                    <div style={{ flex: 1, textAlign: "right" }}>
                      {isLoadingRates ? (
                        <Loader2
                          size={24}
                          className="animate-spin"
                          style={{ color: "#94a3b8", display: "inline-block" }}
                        />
                      ) : (
                        <p
                          style={{
                            fontSize: 40,
                            fontWeight: 800,
                            color: "#0f172a",
                            letterSpacing: "-1px",
                            margin: 0,
                            opacity: convertedAmount > 0 ? 1 : 0.3,
                          }}
                        >
                          {convertedAmount > 0
                            ? convertedAmount.toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2,
                              })
                            : "0.00"}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RATE DISPLAY */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: 24,
                  marginBottom: 32,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    color: "#475569",
                  }}
                >
                  <RefreshCcw size={16} color="#ea580c" /> {/* Updated color */}
                  {rates
                    ? `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`
                    : "Fetching rate..."}
                </div>
              </div>

              <button
                disabled={!canAdvance || isLoadingRates}
                onClick={() => setStep(1)}
                style={{
                  width: "100%",
                  padding: "18px",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  background:
                    canAdvance && !isLoadingRates ? "#0f172a" : "#cbd5e1",
                  borderRadius: 16,
                  border: "none",
                  cursor:
                    canAdvance && !isLoadingRates ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  transition: "all 0.2s",
                  boxShadow: canAdvance
                    ? "0 8px 20px rgba(15,23,42,0.2)"
                    : "none",
                }}
              >
                Review Exchange <ArrowRight size={18} />
              </button>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="step1"
              variants={pageVariants}
              initial="initial"
              animate="in"
              exit="out"
            >
              <div
                style={{
                  borderRadius: 28,
                  background: "#fff",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  marginBottom: 24,
                  boxShadow: "0 12px 32px -8px rgba(0,0,0,0.08)",
                }}
              >
                <div
                  style={{
                    padding: "40px 24px",
                    background: "linear-gradient(135deg, #0f172a, #1e293b)",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 12,
                    }}
                  >
                    You Are Converting
                  </p>
                  <p
                    style={{
                      fontSize: 36,
                      fontWeight: 800,
                      color: "#fff",
                      letterSpacing: "-1.5px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                    }}
                  >
                    <span>
                      {fmt(numAmount)} {fromCurrency}
                    </span>
                    <ArrowDownUp size={24} color="#38bdf8" />
                    <span style={{ color: "#ea580c" }}> {/* Updated color */}
                      {toSym}
                      {convertedAmount.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{" "}
                      {toCurrency}
                    </span>
                  </p>
                </div>
                <div style={{ padding: "24px" }}>
                  {[
                    [
                      "Exchange Rate",
                      `1 ${fromCurrency} = ${exchangeRate.toFixed(4)} ${toCurrency}`,
                    ],
                    ["Platform Fee", "Free"],
                    ["Estimated Time", "Instant"],
                  ].map(([k, v]) => (
                    <div
                      key={`review-${k}`}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "16px 0",
                        borderBottom:
                          k === "Estimated Time" ? "none" : "1px solid #f1f5f9",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 15,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {k}
                      </span>
                      <span
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  disabled={isProcessing}
                  onClick={() => setStep(0)}
                  style={{
                    padding: "18px 24px",
                    fontSize: 15,
                    fontWeight: 700,
                    color: "#475569",
                    background: "#f1f5f9",
                    borderRadius: 16,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  Back
                </button>
                <button
                  disabled={isProcessing}
                  onClick={handleExchange}
                  style={{
                    flex: 1,
                    padding: "18px",
                    fontSize: 16,
                    fontWeight: 700,
                    color: "#fff",
                    background: "#ea580c", // Updated color
                    borderRadius: 16,
                    border: "none",
                    cursor: isProcessing ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: "0 8px 20px rgba(234, 88, 12, 0.2)", // Updated shadow
                  }}
                >
                  {isProcessing ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        repeat: Infinity,
                        duration: 1,
                        ease: "linear",
                      }}
                    >
                      <Loader2 size={18} />
                    </motion.div>
                  ) : (
                    <RefreshCcw size={18} />
                  )}
                  {isProcessing ? "Processing..." : "Confirm Exchange"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}