import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Activity,
  DollarSign,
  AlertOctagon,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ShieldAlert,
  TrendingUp,
  RefreshCcw,
  Loader2,
} from "lucide-react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import { db } from "../../lib/firebase";
import { useNavigate } from "react-router-dom";

const fmtAmt = (n) =>
  "$" +
  Number(n).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const fmtNum = (n) => Number(n).toLocaleString("en-US");

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

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    frozenUsers: 0,
    totalAUM: 0,
    volume24h: 0,
  });
  const [recentTxns, setRecentTxns] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FIREBASE REAL-TIME METRICS ---
  useEffect(() => {
    // 1. Listen to all Users for AUM and Status counts
    const unsubUsers = onSnapshot(collection(db, "users"), (snapshot) => {
      let usersCount = 0;
      let frozenCount = 0;
      let totalLiquidity = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.role === "admin" || data.role === "Administrator") return; // Exclude admins from metrics

        usersCount++;

        const status = (data.status || data.accountStatus || "").toLowerCase();
        if (status === "frozen" || status === "suspended") {
          frozenCount++;
        }

        // Sum up USD balances for AUM (Simplified to USD for the top-level metric)
        const usdBalance = Number(data.balances?.USD) || 0;
        totalLiquidity += usdBalance;
      });

      setStats((prev) => ({
        ...prev,
        totalUsers: usersCount,
        frozenUsers: frozenCount,
        totalAUM: totalLiquidity,
      }));
    });

    // 2. Listen to Transactions for 24h Volume & Recent Feed
    const txnsQuery = query(
      collection(db, "transactions"),
      orderBy("date", "desc"),
      limit(50),
    );
    const unsubTxns = onSnapshot(txnsQuery, (snapshot) => {
      let vol = 0;
      const fetchedTxns = [];

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedTxns.push({ id: doc.id, ...data });

        // Calculate 24h volume
        const txDate = new Date(data.date);
        if (txDate > yesterday) {
          vol += Number(data.amount || 0);
        }
      });

      setRecentTxns(fetchedTxns.slice(0, 8)); // Keep top 8 for the recent list
      setStats((prev) => ({ ...prev, volume24h: vol }));
      setIsLoading(false);
    });

    return () => {
      unsubUsers();
      unsubTxns();
    };
  }, []);

  if (isLoading) {
    return (
      <div
        style={{
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        padding: "24px clamp(20px, 4vw, 32px)",
        paddingBottom: 100,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 32 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0f172a",
            letterSpacing: "-0.5px",
            marginBottom: 4,
          }}
        >
          Command Center
        </h1>
        <p style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}>
          Live overview of platform activity and liquidity.
        </p>
      </div>

      {/* --- TOP METRICS GRID --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 20,
          marginBottom: 32,
        }}
      >
        <MetricCard
          title="Assets Under Mgt (USD)"
          value={fmtAmt(stats.totalAUM)}
          icon={<DollarSign size={20} color="#059669" />}
          trend="+2.4% this week"
          trendColor="#059669"
        />

        <MetricCard
          title="24h Transfer Volume"
          value={fmtAmt(stats.volume24h)}
          icon={<Activity size={20} color="#3b82f6" />}
          trend="Live active data"
          trendColor="#3b82f6"
        />

        <MetricCard
          title="Total Active Clients"
          value={fmtNum(stats.totalUsers - stats.frozenUsers)}
          icon={<Users size={20} color="#6366f1" />}
          subtitle={`Out of ${stats.totalUsers} registered accounts`}
        />

        <MetricCard
          title="Frozen / Flagged"
          value={fmtNum(stats.frozenUsers)}
          icon={<ShieldAlert size={20} color="#dc2626" />}
          trend={
            stats.frozenUsers > 0 ? "Requires review" : "All systems normal"
          }
          trendColor={stats.frozenUsers > 0 ? "#dc2626" : "#64748b"}
          isAlert={stats.frozenUsers > 0}
        />
      </div>

      {/* --- BOTTOM DASHBOARD SPLIT --- */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 24,
        }}
      >
        {/* RECENT TRANSACTIONS */}
        <motion.div
          variants={itemVariants}
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 24,
            padding: 24,
            boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <h2 style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>
              Live Platform Ledger
            </h2>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontSize: 12,
                fontWeight: 600,
                color: "#059669",
                background: "#ecfdf5",
                padding: "6px 12px",
                borderRadius: 99,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                }}
              />{" "}
              Live
            </div>
          </div>

          {recentTxns.length === 0 ? (
            <p
              style={{
                fontSize: 14,
                color: "#64748b",
                textAlign: "center",
                padding: "40px 0",
              }}
            >
              No recent transactions.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {recentTxns.map((t) => {
                const isEx = t.type === "exchange";
                const isOut = t.type === "debit";
                const Icon = isEx
                  ? RefreshCcw
                  : isOut
                    ? ArrowUpRight
                    : ArrowDownRight;
                const color = isEx ? "#3b82f6" : isOut ? "#dc2626" : "#059669";
                const bg = isEx ? "#eff6ff" : isOut ? "#fef2f2" : "#ecfdf5";

                return (
                  <div
                    key={t.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      paddingBottom: 16,
                      borderBottom: "1px solid #f1f5f9",
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 12 }}
                    >
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: bg,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Icon size={18} color={color} />
                      </div>
                      <div>
                        <p
                          style={{
                            fontSize: 14,
                            fontWeight: 700,
                            color: "#0f172a",
                          }}
                        >
                          {t.name}
                        </p>
                        <p
                          style={{
                            fontSize: 12,
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          {t.category} • {t.currency}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: "#0f172a",
                        }}
                      >
                        {fmtAmt(t.amount)}
                      </p>
                      <p
                        style={{
                          fontSize: 11,
                          color: "#94a3b8",
                          fontWeight: 500,
                        }}
                      >
                        {new Date(t.date).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* SYSTEM STATUS / QUICK ACTIONS */}
        <motion.div
          variants={itemVariants}
          style={{ display: "flex", flexDirection: "column", gap: 24 }}
        >
          {/* Quick Actions */}
          <div
            style={{
              background: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: 24,
              padding: 24,
              boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
            }}
          >
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#0f172a",
                marginBottom: 16,
              }}
            >
              Quick Actions
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 12,
              }}
            >
              <ActionBtn
                title="Manage Users"
                desc="Edit balances & limits"
                icon={Users}
                color="#0f172a"
                onClick={() => navigate("/controls/users")}
              />
              <ActionBtn
                title="System Rates"
                desc="Update live FX rates"
                icon={TrendingUp}
                color="#3b82f6"
                onClick={() => navigate("/controls/settings")}
              />
              <ActionBtn
                title="Support Desk"
                desc="View active tickets"
                icon={AlertOctagon}
                color="#ca8a04"
                onClick={() => navigate("/controls/support")}
              />
              <ActionBtn
                title="Create Account"
                desc="Generate new client"
                icon={ShieldAlert}
                color="#059669"
                onClick={() => navigate("/controls/create")}
              />
            </div>
          </div>

          {/* System Status */}
          <div
            style={{
              background: "#0f172a",
              borderRadius: 24,
              padding: 24,
              color: "#fff",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: -30,
                right: -30,
                opacity: 0.1,
              }}
            >
              <AlertOctagon size={140} />
            </div>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 700,
                marginBottom: 20,
                position: "relative",
              }}
            >
              System Health
            </h2>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                position: "relative",
              }}
            >
              <StatusRow label="Core Banking Ledger" status="Operational" />
              <StatusRow label="FX Rate Engine" status="Operational" />
              <StatusRow label="Wire Transmissions" status="Operational" />
              <StatusRow label="Email Gateway" status="Operational" />
            </div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}

// --- SUB COMPONENTS ---

function MetricCard({
  title,
  value,
  icon,
  trend,
  trendColor,
  subtitle,
  isAlert,
}) {
  return (
    <motion.div
      variants={itemVariants}
      style={{
        background: "#fff",
        padding: 24,
        borderRadius: 24,
        border: `1px solid ${isAlert ? "#fecaca" : "#e2e8f0"}`,
        boxShadow: isAlert
          ? "0 4px 12px rgba(220, 38, 38, 0.1)"
          : "0 2px 4px rgba(0,0,0,0.02)",
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 16,
        }}
      >
        <p
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#64748b",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {title}
        </p>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: isAlert ? "#fef2f2" : "#f8fafc",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </div>
      </div>
      <p
        style={{
          fontSize: 32,
          fontWeight: 800,
          color: isAlert ? "#dc2626" : "#0f172a",
          letterSpacing: "-1px",
          marginBottom: 8,
        }}
      >
        {value}
      </p>
      {trend && (
        <p style={{ fontSize: 13, fontWeight: 600, color: trendColor }}>
          {trend}
        </p>
      )}
      {subtitle && (
        <p style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>
          {subtitle}
        </p>
      )}
    </motion.div>
  );
}

function ActionBtn({ title, desc, icon: Icon, color, onClick }) {
  return (
    <button
      onClick={onClick} // <-- Added onClick here
      style={{
        textAlign: "left",
        padding: 16,
        background: "#f8fafc",
        border: "1px solid #e2e8f0",
        borderRadius: 16,
        cursor: "pointer",
        transition: "border 0.2s, background 0.2s",
      }}
    >
      <Icon size={20} color={color} style={{ marginBottom: 12 }} />
      <p
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#0f172a",
          marginBottom: 2,
        }}
      >
        {title}
      </p>
      <p style={{ fontSize: 12, color: "#64748b", fontWeight: 500 }}>{desc}</p>
    </button>
  );
}

function StatusRow({ label, status }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <p style={{ fontSize: 14, color: "#cbd5e1", fontWeight: 500 }}>{label}</p>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: "#10b981",
            boxShadow: "0 0 8px #10b981",
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: "#10b981" }}>
          {status}
        </span>
      </div>
    </div>
  );
}
