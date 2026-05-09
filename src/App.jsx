import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

// --- LAYOUTS ---
import Shell from "./layouts/Shell";
import AdminShell from "./layouts/AdminShell";

// --- PUBLIC PAGES ---
import LandingPage from "./pages/landing/LandingPage";
import Login from "./pages/auth/Login";
import Suspended from "./pages/auth/Suspended";

// --- USER PAGES ---
import DashboardLight from "./pages/dashboard/DashboardLight";
import Transactions from "./pages/dashboard/Transactions";
import Send from "./pages/dashboard/Send";
import Settings from "./pages/dashboard/Settings";
import WireTransfer from "./pages/dashboard/Wire";
import Exchange from "./pages/dashboard/Exchange";
import SupportTickets from "./pages/dashboard/SupportTickets";

// --- ADMIN PAGES ---
import AdminDashboard from "./pages/admin/AdminDashboard";
import ManageUsers from "./pages/admin/ManageUsers";
import SystemSettings from "./pages/admin/SystemSettings";
import CreateUser from "./pages/admin/Create";
import ManageTickets from "./pages/admin/ManageTickets";

import "./index.css";
import Receive from "./pages/dashboard/Receive";
import Cards from "./pages/dashboard/Cards";
import Register from "./pages/auth/Register";

// ─── PREMIUM LOADER COMPONENT ─────────────────────────────────────────────
function FullScreenLoader({ text }) {
  return (
    <div
      style={{
        height: "100vh",
        width: "100vw",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#f8fafc",
        fontFamily: "sans-serif",
      }}
    >
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
          boxShadow: [
            "0 0 0 0 rgba(16, 185, 129, 0)",
            "0 0 0 20px rgba(16, 185, 129, 0.1)",
            "0 0 0 0 rgba(16, 185, 129, 0)",
          ],
        }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: "#0f172a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
        }}
      >
        <Zap size={32} color="#38bdf8" fill="#38bdf8" />
      </motion.div>
      <motion.p
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#64748b",
          letterSpacing: "0.1em",
          textTransform: "uppercase",
        }}
      >
        {text}
      </motion.p>
    </div>
  );
}

// ─── ROUTE GUARDS ─────────────────────────────────────────────────────────

// 1. Protects standard user routes
function RequireAuth() {
  const { currentUser, userProfile, loadingAuth } = useApp(); // <-- Added userProfile here

  if (loadingAuth) return <FullScreenLoader text="Loading Session..." />;
  if (!currentUser) return <Navigate to="/login" replace />;

  // 🛑 REAL-TIME SUSPENSION TRIPWIRE
  const status = (
    userProfile?.status ||
    userProfile?.accountStatus ||
    ""
  ).toLowerCase();
  if (status === "suspended") {
    return (
      <Navigate
        to="/suspended"
        state={{ reason: userProfile?.suspensionReason }}
        replace
      />
    );
  }

  return <Outlet />;
}

// 2. Protects admin routes
function RequireAdmin() {
  const { currentUser, userProfile, loadingAuth } = useApp();

  if (loadingAuth) return <FullScreenLoader text="Verifying Permissions..." />;
  if (!currentUser) return <Navigate to="/login" replace />;

  // 🛑 REAL-TIME SUSPENSION TRIPWIRE
  const status = (
    userProfile?.status ||
    userProfile?.accountStatus ||
    ""
  ).toLowerCase();
  if (status === "suspended") {
    return (
      <Navigate
        to="/suspended"
        state={{ reason: userProfile?.suspensionReason }}
        replace
      />
    );
  }

  if (userProfile?.role !== "admin" && userProfile?.role !== "Administrator") {
    return <Navigate to="/app/dashboard" replace />;
  }

  return <Outlet />;
}
// ─── MAIN APP COMPONENT ───────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* --- PUBLIC ROUTES --- */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} /> 
          <Route path="/suspended" element={<Suspended />} />

          {/* --- PROTECTED USER ROUTES --- */}
          <Route element={<RequireAuth />}>
            <Route path="/app" element={<Shell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<DashboardLight />} />
              <Route path="exchange" element={<Exchange />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="wire" element={<WireTransfer />} />
              <Route path="send" element={<Send />} />
              <Route path="support" element={<SupportTickets />} />s
              <Route path="settings" element={<Settings />} />
              <Route path="receive" element={<Receive />} />
              <Route path="cards" element={<Cards />} />
            </Route>
          </Route>

          {/* --- PROTECTED ADMIN ROUTES --- */}
          <Route element={<RequireAdmin />}>
            <Route path="/controls" element={<AdminShell />}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="users" element={<ManageUsers />} />
              <Route path="support" element={<ManageTickets />} />
              <Route path="settings" element={<SystemSettings />} />
              <Route path="create" element={<CreateUser />} />
            </Route>
          </Route>

          {/* --- FALLBACK --- */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
