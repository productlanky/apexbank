import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, MessageSquare, Clock, Loader2, CheckCircle2,
  AlertCircle, Send, User, ChevronLeft, MoreVertical, XCircle
} from "lucide-react";
import { collection, onSnapshot, doc, updateDoc, query, orderBy } from "firebase/firestore";
import { db } from "../../lib/firebase";

const STATUS_CONFIG = {
  Open: { bg: "#eff6ff", text: "#3b82f6", icon: Clock },
  "In Progress": { bg: "#fffbeb", text: "#d97706", icon: Loader2 },
  Closed: { bg: "#f1f5f9", text: "#64748b", icon: CheckCircle2 },
};

const FILTERS = ["All", "Open", "In Progress", "Closed"];

export default function ManageTickets() {
  const [tickets, setTickets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");

  // Inbox State
  const [selectedId, setSelectedId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const chatEndRef = useRef(null);

  // --- FETCH TICKETS (REAL-TIME) ---
  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("updatedAt", "desc"));
    const unsub = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((doc) => fetched.push({ id: doc.id, ...doc.data() }));
      setTickets(fetched);
      setIsLoading(false);
    });
    return () => unsub();
  }, []);

  // Scroll to bottom of chat when selecting a ticket or getting a new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedId, tickets]);

  // --- FILTER LOGIC ---
  const filteredTickets = tickets.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch =
      t.subject.toLowerCase().includes(q) ||
      t.ticketId.toLowerCase().includes(q) ||
      t.userName.toLowerCase().includes(q);
    const matchFilter = filter === "All" || t.status === filter;
    return matchSearch && matchFilter;
  });

  const selectedTicket = tickets.find((t) => t.id === selectedId);

  // --- HANDLERS ---
  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSending(true);
    try {
      const newMessage = {
        sender: "admin",
        text: replyText,
        timestamp: new Date().toISOString(),
      };

      // Automatically move 'Open' tickets to 'In Progress' when an admin replies
      const newStatus = selectedTicket.status === "Open" ? "In Progress" : selectedTicket.status;

      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        messages: [...selectedTicket.messages, newMessage],
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });

      setReplyText("");
    } catch (error) {
      console.error("Failed to send reply:", error);
      alert("Error sending message.");
    } finally {
      setIsSending(false);
    }
  };

  const handleChangeStatus = async (newStatus) => {
    if (!selectedTicket) return;
    try {
      await updateDoc(doc(db, "tickets", selectedTicket.id), {
        status: newStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const fmtDate = (iso) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  if (isLoading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <Loader2 size={32} color="#94a3b8" className="animate-spin" />
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column", padding: "24px clamp(20px, 4vw, 32px)" }}>
      
      {/* HEADER */}
      <div style={{ marginBottom: 20, flexShrink: 0 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: "#0f172a", marginBottom: 4, letterSpacing: "-0.5px" }}>Support Desk</h1>
        <p style={{ fontSize: 14, color: "#64748b", fontWeight: 500 }}>Resolve client issues and answer inquiries.</p>
      </div>

      {/* MAIN LAYOUT (Split View) */}
      <div style={{ flex: 1, display: "flex", gap: 24, overflow: "hidden", minHeight: 0 }}>
        
        {/* LEFT PANEL: INBOX LIST */}
        <div style={{ width: "380px", display: "flex", flexDirection: "column", background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", boxShadow: "0 4px 6px rgba(0,0,0,0.02)", flexShrink: 0 }}>
          
          {/* Search & Filters */}
          <div style={{ padding: 20, borderBottom: "1px solid #e2e8f0", background: "#f8fafc" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", borderRadius: 12, background: "#fff", border: "1px solid #e2e8f0", marginBottom: 16 }}>
              <Search size={16} color="#94a3b8" />
              <input
                value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search tickets..."
                style={{ flex: 1, fontSize: 14, color: "#0f172a", background: "transparent", border: "none", outline: "none" }}
              />
            </div>
            
            <div style={{ display: "flex", gap: 8, overflowX: "auto", scrollbarWidth: "none" }}>
              {FILTERS.map((f) => (
                <button
                  key={f} onClick={() => setFilter(f)}
                  style={{ padding: "6px 12px", borderRadius: 99, fontSize: 12, fontWeight: 700, border: "none", cursor: "pointer", whiteSpace: "nowrap", background: filter === f ? "#0f172a" : "#e2e8f0", color: filter === f ? "#fff" : "#475569", transition: "all 0.2s" }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Ticket List */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filteredTickets.length === 0 ? (
              <div style={{ padding: 40, textAlign: "center", color: "#94a3b8" }}>
                <MessageSquare size={32} style={{ margin: "0 auto 12px", opacity: 0.5 }} />
                <p style={{ fontSize: 14, fontWeight: 500 }}>No tickets found.</p>
              </div>
            ) : (
              filteredTickets.map((t) => {
                const isSelected = selectedId === t.id;
                const statusInfo = STATUS_CONFIG[t.status] || STATUS_CONFIG["Open"];
                
                return (
                  <div
                    key={t.id} onClick={() => setSelectedId(t.id)}
                    style={{ padding: 20, borderBottom: "1px solid #f1f5f9", background: isSelected ? "#f8fafc" : "#fff", cursor: "pointer", borderLeft: `4px solid ${isSelected ? "#0f172a" : "transparent"}`, transition: "background 0.2s" }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                      <span style={{ fontSize: 11, fontWeight: 800, color: "#64748b", fontFamily: "monospace" }}>{t.ticketId}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: statusInfo.text, background: statusInfo.bg, padding: "4px 8px", borderRadius: 6 }}>{t.status}</span>
                    </div>
                    <p style={{ fontSize: 15, fontWeight: 700, color: "#0f172a", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {t.subject}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <p style={{ fontSize: 13, color: "#64748b", fontWeight: 500 }}>{t.userName}</p>
                      <p style={{ fontSize: 11, color: "#94a3b8", fontWeight: 500 }}>{new Date(t.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANEL: ACTIVE CHAT */}
        <div style={{ flex: 1, background: "#fff", border: "1px solid #e2e8f0", borderRadius: 24, overflow: "hidden", display: "flex", flexDirection: "column", boxShadow: "0 4px 6px rgba(0,0,0,0.02)" }}>
          
          {!selectedTicket ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "#94a3b8" }}>
              <div style={{ width: 80, height: 80, background: "#f8fafc", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
                <MessageSquare size={32} />
              </div>
              <p style={{ fontSize: 16, fontWeight: 600 }}>Select a ticket to view details</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div style={{ padding: "24px", borderBottom: "1px solid #e2e8f0", background: "#f8fafc", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 800, color: "#0f172a", marginBottom: 4 }}>{selectedTicket.subject}</h2>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13, color: "#64748b", fontWeight: 500 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}><User size={14} /> {selectedTicket.userName}</span>
                    <span>•</span>
                    <span>{selectedTicket.category}</span>
                  </div>
                </div>

                {/* Status Controls */}
                <div style={{ display: "flex", gap: 8 }}>
                  {selectedTicket.status !== "Closed" && (
                    <button onClick={() => handleChangeStatus("Closed")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                      <XCircle size={14} /> Close Ticket
                    </button>
                  )}
                  {selectedTicket.status === "Closed" && (
                    <button onClick={() => handleChangeStatus("Open")} style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 16px", background: "#ecfdf5", color: "#059669", border: "1px solid #a7f3d0", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}>
                      Reopen
                    </button>
                  )}
                </div>
              </div>

              {/* Chat Messages */}
              <div style={{ flex: 1, padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: 24, background: "#fff" }}>
                {selectedTicket.messages.map((msg, idx) => {
                  const isAdmin = msg.sender === "admin";
                  return (
                    <div key={idx} style={{ display: "flex", flexDirection: "column", alignItems: isAdmin ? "flex-end" : "flex-start" }}>
                      <div
                        style={{
                          maxWidth: "75%", padding: "16px", borderRadius: 18, fontSize: 14, lineHeight: 1.6,
                          background: isAdmin ? "#0f172a" : "#f1f5f9",
                          color: isAdmin ? "#fff" : "#0f172a",
                          borderBottomRightRadius: isAdmin ? 4 : 18,
                          borderBottomLeftRadius: isAdmin ? 18 : 4,
                          boxShadow: "0 2px 4px rgba(0,0,0,0.02)"
                        }}
                      >
                        {msg.text}
                      </div>
                      <span style={{ fontSize: 11, color: "#94a3b8", marginTop: 6, fontWeight: 500, display: "flex", alignItems: "center", gap: 6 }}>
                        {isAdmin ? "You (Support)" : selectedTicket.userName} • {fmtDate(msg.timestamp)}
                      </span>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Reply Input */}
              <div style={{ padding: "20px", borderTop: "1px solid #e2e8f0", background: "#f8fafc" }}>
                {selectedTicket.status === "Closed" ? (
                  <p style={{ textAlign: "center", fontSize: 13, color: "#64748b", fontWeight: 600 }}>This ticket is closed. Reopen it to send a message.</p>
                ) : (
                  <form onSubmit={handleSendReply} style={{ display: "flex", gap: 12 }}>
                    <textarea
                      value={replyText} onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Type your response to the user..."
                      style={{ flex: 1, padding: "16px", borderRadius: 16, border: "1px solid #cbd5e1", background: "#fff", fontSize: 14, color: "#0f172a", outline: "none", resize: "none", minHeight: "80px", fontFamily: "inherit" }}
                      onFocus={(e) => (e.target.style.borderColor = "#0f172a")} onBlur={(e) => (e.target.style.borderColor = "#cbd5e1")}
                      onKeyDown={(e) => {
                        // Quick send on Cmd/Ctrl + Enter
                        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendReply(e);
                      }}
                    />
                    <button
                      type="submit" disabled={isSending || !replyText.trim()}
                      style={{ padding: "0 24px", background: replyText.trim() ? "#059669" : "#cbd5e1", color: "#fff", borderRadius: 16, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: replyText.trim() ? "pointer" : "not-allowed", transition: "background 0.2s" }}
                    >
                      {isSending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
                    </button>
                  </form>
                )}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}