import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext"; // Getting real Firebase context
import SidebarLight from "../components/SidebarLight";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  ArrowLeftRight,
  CreditCard,
  Send as SendIcon,
  Download,
  Bell,
  Search,
} from "lucide-react";
import "../index.css";

const BOTTOM_TABS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: ArrowLeftRight, label: "Activity" },
  { id: "send", icon: SendIcon, label: "Send" },
  { id: "receive", icon: Download, label: "Receive" },
  { id: "cards", icon: CreditCard, label: "Cards" },
];

export default function Shell() {
  // 1. Hook into our real Firebase user data
  const { userProfile } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const currentPath = location.pathname.split("/").pop() || "dashboard";
  const SidebarComponent = SidebarLight;

  const mobileActiveColor = "#059669";
  const mobileInactiveColor = "#94a3b8";

  // 2. Safe fallbacks for the UI while data loads
  const firstName = userProfile?.firstName || "User";
  const initials = firstName.charAt(0).toUpperCase();

  // Check if user has any unread alerts sent by the Admin
  const hasUnreadAlerts = userProfile?.alerts?.some(alert => !alert.read);

  return (
    <div
      style={{
        display: "flex",
        height: "100dvh",
        width: "100vw",
        overflow: "hidden",
        background: "#f8fafc", // Premium background
      }}
    >
      <div className="hidden lg:block">
        <SidebarComponent
          active={currentPath}
          onNav={(id) => navigate(`/app/${id}`)}
        />
      </div>
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        
        {/* --- PREMIUM FROSTED HEADER --- */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 28px",
            background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(0,0,0,0.04)",
            zIndex: 50,
            gap: 20,
          }}
        >
          {/* 1. Left: Mobile Avatar & Greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="md:hidden"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #1e40af, #3b82f6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.25)",
              }}
            >
              {initials}
            </div>

            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Good Evening
              </span>
              <h1 style={{ fontSize: 19, fontWeight: 700, color: "#0f172a", margin: 0, letterSpacing: "-0.02em" }}>
                {firstName}
              </h1>
            </div>
          </div>

          {/* 2. Middle: Global Search Bar */}
          <div className="hidden md:flex" style={{ flex: 1, maxWidth: 400, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", width: "100%", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 100, padding: "8px 16px", transition: "all 0.2s ease" }}>
              <Search size={16} color="#94a3b8" style={{ marginRight: 10 }} />
              <input type="text" placeholder="Search transactions, cards..." style={{ border: "none", background: "transparent", outline: "none", width: "100%", fontSize: 14, color: "#334155" }} />
            </div>
          </div>

          {/* 3. Right: Sleek Notifications (Now connected to Firebase) */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                width: 44, height: 44, borderRadius: "50%", background: "#ffffff",
                border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", cursor: "pointer",
              }}
            >
              <Bell size={19} color="#475569" strokeWidth={2.2} />
              
              {/* Only show the red dot if the Admin sent an alert! */}
              {hasUnreadAlerts && (
                <span
                  style={{
                    position: "absolute", top: 11, right: 12, width: 8, height: 8,
                    background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2.5px #ffffff",
                  }}
                />
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* --- MAIN SCROLL AREA --- */}
        <main
          className="main-padded"
          style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: 90 }}
        >
          <Outlet />
        </main>
      </div>

      {/* --- MOBILE BOTTOM NAV --- */}
      <nav
        className="bottom-nav lg:hidden"
        style={{
          display: "flex", justifyContent: "space-around", alignItems: "center",
          background: "rgba(255, 255, 255, 0.9)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid rgba(0,0,0,0.04)", padding: "8px 12px 24px", 
        }}
      >
        {BOTTOM_TABS.map(({ id, icon: Icon, label }) => {
          const active = currentPath === id;
          return (
            <button
              key={id} onClick={() => navigate(`/app/${id}`)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, padding: "6px 10px", minWidth: 60, border: "none", background: "transparent", cursor: "pointer" }}
            >
              {id === "send" ? (
                <div
                  style={{
                    width: 48, height: 48, borderRadius: 16, marginBottom: -8, marginTop: -20, 
                    background: active ? "linear-gradient(135deg, #059669, #10b981)" : "#f1f5f9",
                    border: "4px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? "0 8px 20px rgba(16,185,129,0.35)" : "none",
                    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Icon size={20} color={active ? "#fff" : "#059669"} strokeWidth={2.5} />
                </div>
              ) : (
                <Icon size={22} strokeWidth={active ? 2.5 : 2} color={active ? mobileActiveColor : mobileInactiveColor} />
              )}
              <span style={{ fontSize: 10, fontWeight: 700, color: active ? mobileActiveColor : mobileInactiveColor, marginTop: 4 }}>
                {label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}