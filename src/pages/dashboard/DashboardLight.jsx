import {
  Eye,
  EyeOff,
  TrendingUp,
  TrendingDown,
  CreditCard as CardIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";

const fmtD = (s) => {
  if (!s) return "N/A";
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const CURRENCY_SYMBOLS = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  CAD: "$",
  AUD: "$",
};

const STATUS_CHIP = {
  completed: { bg: "#dcfce7", color: "#16a34a", label: "Completed" },
  pending: { bg: "#fef9c3", color: "#ca8a04", label: "Pending" },
  failed: { bg: "#fee2e2", color: "#dc2626", label: "Failed" },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
};

export default function DashboardLight({ onNav }) {
  // Pulling real data from Firebase Context
  const { hideBalance, toggleHide, userProfile, transactions } = useApp();

  const txns = transactions || [];
  
  // Calculate Totals based on real data
  const totalIn = txns
    .filter((t) => t.type === "credit")
    .reduce((s, t) => s + Number(t.amount || 0), 0);
  const totalOut = txns
    .filter((t) => t.type === "debit")
    .reduce((s, t) => s + Number(t.amount || 0), 0);

  // Convert Firebase balances object into an array for the UI cards
  const rawBalances = userProfile?.balances || { USD: 0 };
  const currencies = Object.entries(rawBalances)
    .map(([code, balance]) => ({
      code,
      symbol: CURRENCY_SYMBOLS[code] || "$",
      balance: Number(balance),
    }))
    // Optional: Sort so USD always shows first
    .sort((a, b) => (a.code === "USD" ? -1 : b.code === "USD" ? 1 : 0));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "0 24px 20px",
        gap: 20,
      }}
    >
      {/* 1. Account Number & Hide Toggle */}
      <motion.div
        variants={itemVariants}
        style={{
          flexShrink: 0,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <p
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: 4,
            }}
          >
            Account Number
          </p>
          <p
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "0.04em",
              fontFamily: "monospace",
            }}
          >
            {hideBalance ? "•••• •••• ••••" : userProfile?.accountNumber || "N/A"}
          </p>
        </div>
        <button
          onClick={toggleHide}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 12px",
            background: "#e2e8f0",
            borderRadius: 8,
            border: "none",
            color: "#475569",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          {hideBalance ? <Eye size={14} /> : <EyeOff size={14} />}
          {hideBalance ? "Show" : "Hide"}
        </button>
      </motion.div>

      {/* 2. Premium Currency Cards */}
      <motion.div
        variants={itemVariants}
        style={{
          flexShrink: 0,
          display: "flex",
          gap: 14,
          overflowX: "auto",
          paddingBottom: 4,
          scrollbarWidth: "none", // Hides scrollbar on Firefox
        }}
      >
        {currencies.map((c, idx) => {
          const isPrimary = idx === 0;
          return (
            <motion.div
              whileHover={{ y: -2 }}
              key={c.code}
              style={{
                minWidth: 240,
                flex: "1 0 240px",
                background: isPrimary
                  ? "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)"
                  : "#ffffff",
                borderRadius: 14,
                border: isPrimary ? "none" : "1px solid #e2e8f0",
                padding: "20px",
                boxShadow: isPrimary
                  ? "0 8px 16px rgba(15, 23, 42, 0.15)"
                  : "0 2px 4px rgba(0,0,0,0.02)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {isPrimary && (
                <div
                  style={{
                    position: "absolute",
                    top: -30,
                    right: -30,
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.05)",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 16,
                  position: "relative",
                  zIndex: 1,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    color: isPrimary ? "#94a3b8" : "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {c.code} Balance
                </p>
                <CardIcon size={18} color={isPrimary ? "#cbd5e1" : "#94a3b8"} />
              </div>

              <p
                style={{
                  fontSize: 28,
                  fontWeight: 800,
                  color: isPrimary ? "#ffffff" : "#0f172a",
                  letterSpacing: "-0.5px",
                  position: "relative",
                  zIndex: 1,
                }}
              >
                {hideBalance
                  ? "••••••"
                  : `${c.symbol}${c.balance.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </p>
            </motion.div>
          );
        })}
      </motion.div>

      {/* 3. Stats Row */}
      <motion.div
        variants={itemVariants}
        style={{
          flexShrink: 0,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 14,
        }}
      >
        <StatBox
          label="Money In"
          value={`$${totalIn.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          accentColor="#059669"
          icon={<TrendingUp size={16} color="#059669" />}
        />
        <StatBox
          label="Money Out"
          value={`$${totalOut.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
          accentColor="#dc2626"
          icon={<TrendingDown size={16} color="#dc2626" />}
        />
      </motion.div>

      {/* 4. Transactions List */}
      <motion.div
        variants={itemVariants}
        style={{
          flex: 1, 
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          borderRadius: 14,
          border: "1px solid #e2e8f0",
          overflow: "hidden", 
          boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
          minHeight: 250, 
        }}
      >
        <div
          style={{
            flexShrink: 0,
            padding: "16px 20px",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <p style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
            Recent Transactions
          </p>
          <button
            onClick={() => onNav?.("transactions")}
            style={{
              fontSize: 12,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#059669",
              fontWeight: 700,
            }}
          >
            View All →
          </button>
        </div>

        {/* --- DESKTOP TABLE --- */}
        <div className="hidden md:block" style={{ flex: 1, overflowY: "auto" }}>
          <table
            style={{ width: "100%", borderCollapse: "collapse", minWidth: 800 }}
          >
            <thead
              style={{
                position: "sticky",
                top: 0,
                background: "#f8fafc",
                zIndex: 2,
              }}
            >
              <tr>
                {[
                  "Date",
                  "Description",
                  "Currency",
                  "Amount",
                  "Type",
                  "Status",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 20px",
                      textAlign: "left",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {txns.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    style={{
                      padding: "48px",
                      textAlign: "center",
                      color: "#94a3b8",
                      fontSize: 14,
                    }}
                  >
                    No transactions yet
                  </td>
                </tr>
              ) : (
                txns.map((t) => {
                  // Fallback to "completed" if status isn't provided by DB
                  const status = t.status ? t.status.toLowerCase() : "completed";
                  const chip = STATUS_CHIP[status] || STATUS_CHIP["completed"];
                  
                  return (
                    <tr
                      key={t.id}
                      style={{ borderBottom: "1px solid #f1f5f9" }}
                    >
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 13,
                          color: "#64748b",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmtD(t.date)}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              width: 32,
                              height: 32,
                              borderRadius: 8,
                              background:
                                t.type === "credit" ? "#ecfdf5" : "#fef2f2",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 13,
                              fontWeight: 700,
                              color:
                                t.type === "credit" ? "#059669" : "#dc2626",
                            }}
                          >
                            {t.avatar || (t.name ? t.name.charAt(0) : "T")}
                          </div>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: "#0f172a",
                            }}
                          >
                            {t.name || "Transaction"}
                          </span>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 13,
                          fontWeight: 600,
                          color: "#0f172a",
                        }}
                      >
                        {t.currency || "USD"}
                      </td>
                      <td
                        style={{
                          padding: "12px 20px",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {CURRENCY_SYMBOLS[t.currency] || "$"}{Number(t.amount).toFixed(2)}
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 800,
                            color: t.type === "credit" ? "#059669" : "#dc2626",
                            background:
                              t.type === "credit" ? "#ecfdf5" : "#fef2f2",
                            padding: "4px 8px",
                            borderRadius: 6,
                          }}
                        >
                          {t.type === "credit" ? "CR" : "DR"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 20px" }}>
                        <span
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: "4px 10px",
                            borderRadius: 99,
                            background: chip.bg,
                            color: chip.color,
                          }}
                        >
                          {chip.label}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* --- MOBILE LIST --- */}
        <div className="md:hidden" style={{ flex: 1, overflowY: "auto" }}>
          {txns.length === 0 ? (
            <p
              style={{
                padding: "40px",
                textAlign: "center",
                color: "#94a3b8",
                fontSize: 14,
              }}
            >
              No transactions yet
            </p>
          ) : (
            txns.map((t) => {
              const status = t.status ? t.status.toLowerCase() : "completed";
              const chip = STATUS_CHIP[status] || STATUS_CHIP["completed"];
              
              return (
                <div
                  key={t.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "14px 20px",
                    borderBottom: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      width: 38,
                      height: 38,
                      borderRadius: 10,
                      background: t.type === "credit" ? "#ecfdf5" : "#fef2f2",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 13,
                      fontWeight: 700,
                      color: t.type === "credit" ? "#059669" : "#dc2626",
                      flexShrink: 0,
                    }}
                  >
                    {t.avatar || (t.name ? t.name.charAt(0) : "T")}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#0f172a",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        marginBottom: 2,
                      }}
                    >
                      {t.name || "Transaction"}
                    </p>
                    <p style={{ fontSize: 11, color: "#64748b", fontWeight: 500 }}>
                      {fmtD(t.date)}
                    </p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: 14,
                        fontWeight: 800,
                        color: t.type === "credit" ? "#059669" : "#0f172a",
                      }}
                    >
                      {t.type === "credit" ? "+" : "-"}{CURRENCY_SYMBOLS[t.currency] || "$"}{Number(t.amount).toFixed(2)}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 600, color: chip.color }}>
                      {chip.label}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- STAT BOX ---
function StatBox({ label, value, accentColor, icon }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 14,
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <div style={{ padding: "16px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <p
            style={{
              fontSize: 11,
              color: "#64748b",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            {label}
          </p>
          {icon && <div style={{ opacity: 0.8 }}>{icon}</div>}
        </div>
        <p
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
          }}
        >
          {value}
        </p>
      </div>
      <div
        style={{
          height: 3,
          background: accentColor,
          opacity: 0.85,
          width: "100%",
        }}
      />
    </div>
  );
}