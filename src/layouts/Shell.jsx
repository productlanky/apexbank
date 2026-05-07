import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext";
import SidebarLight from "../components/SidebarLight"; // Adjust path if needed
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, ArrowLeftRight, CreditCard, Send as SendIcon,
  Download, Bell, Search, X, CheckCircle2, AlertCircle, AlertTriangle, Info
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import "../index.css";

const BOTTOM_TABS = [
  { id: "dashboard", icon: LayoutDashboard, label: "Home" },
  { id: "transactions", icon: ArrowLeftRight, label: "Activity" },
  { id: "send", icon: SendIcon, label: "Send" },
  { id: "receive", icon: Download, label: "Receive" },
  { id: "cards", icon: CreditCard, label: "Cards" },
];

export default function Shell() {
  const { userProfile, currentUser } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState(false);

  const currentPath = location.pathname.split("/").pop() || "dashboard";
  const SidebarComponent = SidebarLight;

  // Updated to MidFirst Brand Orange
  const mobileActiveColor = "#ea580c";
  const mobileInactiveColor = "#94a3b8";

  const firstName = userProfile?.firstName || "User";
  const initials = firstName.charAt(0).toUpperCase();

  // --- NOTIFICATION LOGIC ---
  // We use the "notifications" array we created in the Admin CRM
  const notifications = userProfile?.notifications || [];
  const unreadCount = notifications.filter(n => !n.read).length;
  const hasUnreadAlerts = unreadCount > 0;

  const handleMarkAllAsRead = async () => {
    if (!currentUser || unreadCount === 0) return;
    
    // Set all to read
    const updatedNotifs = notifications.map(n => ({ ...n, read: true }));
    
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        notifications: updatedNotifs
      });
    } catch (error) {
      console.error("Failed to mark notifications as read:", error);
    }
  };

  // Helper to get alert styles based on type (Keeping semantic colors for alerts)
  const getAlertStyle = (type) => {
    switch (type) {
      case 'danger': return { icon: AlertCircle, color: '#dc2626', bg: '#fef2f2', border: '#fecaca' };
      case 'warning': return { icon: AlertTriangle, color: '#d97706', bg: '#fffbeb', border: '#fde68a' };
      default: return { icon: Info, color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' };
    }
  };

  return (
    <div style={{ display: "flex", height: "100dvh", width: "100vw", overflow: "hidden", background: "#f8fafc" }}>
      
      <div className="hidden lg:block">
        <SidebarComponent active={currentPath} onNav={(id) => navigate(`/app/${id}`)} />
      </div>
      
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
        
        {/* --- PREMIUM FROSTED HEADER --- */}
        <motion.header
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 24 }}
          style={{
            position: "absolute", top: 0, left: 0, right: 0,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 28px", background: "rgba(255, 255, 255, 0.85)",
            backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
            borderBottom: "1px solid rgba(0,0,0,0.04)", zIndex: 50, gap: 20,
          }}
        >
          {/* 1. Left: Mobile Avatar & Greeting */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              className="md:hidden"
              style={{
                width: 44, height: 44, borderRadius: "50%",
                background: "linear-gradient(135deg, #ea580c, #f97316)", // Brand Orange
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16, fontWeight: 700, color: "#fff",
                boxShadow: "0 4px 12px rgba(234, 88, 12, 0.25)", // Brand Orange Shadow
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

          {/* 3. Right: Bell Notification Trigger */}
          <div style={{ display: "flex", alignItems: "center" }}>
            <motion.button
              onClick={() => setIsAlertDrawerOpen(true)}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              style={{
                position: "relative", display: "flex", alignItems: "center", justifyContent: "center",
                width: 44, height: 44, borderRadius: "50%", background: "#ffffff",
                border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(0,0,0,0.02)", cursor: "pointer",
              }}
            >
              <Bell size={19} color="#475569" strokeWidth={2.2} />
              
              {/* Dynamic Red Dot */}
              {hasUnreadAlerts && (
                <span style={{ position: "absolute", top: 11, right: 12, width: 8, height: 8, background: "#ef4444", borderRadius: "50%", boxShadow: "0 0 0 2.5px #ffffff" }} />
              )}
            </motion.button>
          </div>
        </motion.header>

        {/* --- MAIN SCROLL AREA --- */}
        <main className="main-padded" style={{ flex: 1, overflowY: "auto", overflowX: "hidden", paddingTop: 90 }}>
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
                    background: active ? "linear-gradient(135deg, #ea580c, #f97316)" : "#f1f5f9", // Brand Orange
                    border: "4px solid #ffffff", display: "flex", alignItems: "center", justifyContent: "center",
                    boxShadow: active ? "0 8px 20px rgba(234, 88, 12, 0.35)" : "none", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                >
                  <Icon size={20} color={active ? "#fff" : "#ea580c"} strokeWidth={2.5} />
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

      {/* --- NOTIFICATION DRAWER --- */}
      <AnimatePresence>
        {isAlertDrawerOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAlertDrawerOpen(false)}
              style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.3)", backdropFilter: "blur(4px)", zIndex: 100 }}
            />

            {/* Slide-out Panel */}
            <motion.div
              initial={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }} 
              animate={{ x: 0, boxShadow: "-20px 0 50px rgba(0,0,0,0.15)" }} 
              exit={{ x: "100%", boxShadow: "-20px 0 50px rgba(0,0,0,0)" }} 
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100vw", maxWidth: 400, background: "#f8fafc", zIndex: 110, display: "flex", flexDirection: "column" }}
            >
              {/* Drawer Header */}
              <div style={{ padding: "24px", background: "#fff", borderBottom: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: "#0f172a", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Bell size={20} color="#fff" />
                  </div>
                  <div>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", letterSpacing: "-0.5px" }}>Notifications</h2>
                    <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                      {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsAlertDrawerOpen(false)} style={{ background: "#f1f5f9", border: "none", width: 36, height: 36, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <X size={18} color="#475569" />
                </button>
              </div>

              {/* Drawer Content / Alert List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
                {notifications.length === 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", opacity: 0.5 }}>
                    <CheckCircle2 size={48} color="#94a3b8" style={{ marginBottom: 16 }} />
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#475569" }}>You're all caught up!</p>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    {notifications.map((notif) => {
                      const style = getAlertStyle(notif.type);
                      const IconComponent = style.icon;

                      return (
                        <motion.div 
                          key={notif.id}
                          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                          style={{
                            background: "#fff", padding: "16px", borderRadius: 16,
                            border: `1px solid ${notif.read ? "#e2e8f0" : style.border}`,
                            boxShadow: notif.read ? "none" : `0 4px 12px ${style.bg}`,
                            position: "relative", overflow: "hidden"
                          }}
                        >
                          {!notif.read && <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 4, background: style.color }} />}
                          
                          <div style={{ display: "flex", gap: 12 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: style.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <IconComponent size={18} color={style.color} />
                            </div>
                            <div>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                                <h3 style={{ fontSize: 14, fontWeight: 700, color: "#0f172a", paddingRight: 10 }}>{notif.title}</h3>
                                <span style={{ fontSize: 11, fontWeight: 500, color: "#94a3b8", whiteSpace: "nowrap" }}>
                                  {new Date(notif.date).toLocaleDateString()}
                                </span>
                              </div>
                              <p style={{ fontSize: 13, color: "#475569", lineHeight: 1.5 }}>{notif.message}</p>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Drawer Footer (Mark Read) */}
              {hasUnreadAlerts && (
                <div style={{ padding: "20px", background: "#fff", borderTop: "1px solid #e2e8f0" }}>
                  <button 
                    onClick={handleMarkAllAsRead}
                    style={{ width: "100%", padding: "14px", background: "#f8fafc", color: "#0f172a", border: "1px solid #e2e8f0", borderRadius: 12, fontSize: 14, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}
                  >
                    <CheckCircle2 size={18} color="#ea580c" />
                    Mark all as read
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