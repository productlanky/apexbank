import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf,
  ArrowRight,
  Send,
  Download,
  CreditCard,
  RefreshCw,
  PiggyBank,
  FileText,
  Shield,
  Globe,
  Clock,
  Users,
  TrendingUp,
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  Check,
  ChevronLeft,
  Menu,
  X,
} from "lucide-react";

const SLIDES = [
  {
    img: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=1600&q=80",
    heading: "Smart way to keep your\nmoney safe and secure.",
    sub: "Global transfers, multi-currency accounts, and competitive savings — all in one place.",
  },
  {
    img: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=1600&q=80",
    heading: "Grow your wealth with\nhigh-yield deposits.",
    sub: "Earn up to 45% annual returns with our flexible, secure fixed deposit plans.",
  },
  {
    img: "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1600&q=80",
    heading: "Fast and flexible loans\ntailored for you.",
    sub: "Personal, business, and mortgage loans with competitive rates starting from 5% p.a.",
  },
];

const SERVICES = [
  {
    icon: Send,
    title: "Money Transfer",
    desc: "Send money globally with low fees and lightning-fast delivery.",
  },
  {
    icon: Globe,
    title: "Multi Currency",
    desc: "Hold and manage multiple currencies in one seamless account.",
  },
  {
    icon: RefreshCw,
    title: "Exchange Currency",
    desc: "Real-time exchange rates with no hidden markups.",
  },
  {
    icon: PiggyBank,
    title: "Fixed Deposit",
    desc: "Grow your savings with competitive fixed deposit interest rates.",
  },
  {
    icon: FileText,
    title: "Apply for Loan",
    desc: "Fast, flexible loan products tailored to your financial goals.",
  },
  {
    icon: Download,
    title: "Payment Request",
    desc: "Request payments from anyone, anywhere, in seconds.",
  },
];

const STATS = [
  { value: "500+", label: "Services Offered" },
  { value: "5", label: "Global Branches" },
  { value: "1M+", label: "Total Transactions" },
  { value: "200+", label: "Supported Countries" },
];

const DEPOSIT_PLANS = [
  {
    name: "Starter",
    min: "$500",
    max: "$4,999",
    rate: "25%",
    term: "90 days",
    color: "#ea580c",
  },
  {
    name: "Growth",
    min: "$5,000",
    max: "$24,999",
    rate: "35%",
    term: "180 days",
    color: "#0284c7",
  },
  {
    name: "Premium",
    min: "$25,000",
    max: "No limit",
    rate: "45%",
    term: "365 days",
    color: "#7c3aed",
  },
];

const LOAN_PLANS = [
  {
    name: "Personal",
    range: "$1K – $50K",
    rate: "5%",
    term: "12–60 mo.",
    color: "#ea580c",
  },
  {
    name: "Business",
    range: "$10K – $500K",
    rate: "8%",
    term: "12–84 mo.",
    color: "#0284c7",
  },
  {
    name: "Mortgage",
    range: "$50K – $2M",
    rate: "12%",
    term: "Up to 30yr",
    color: "#7c3aed",
  },
];

const WHY = [
  {
    icon: Shield,
    title: "Bank-Grade Security",
    desc: "End-to-end encryption, 2FA, and FDIC-insured deposits up to $250,000.",
  },
  {
    icon: Clock,
    title: "24/7 Support",
    desc: "Our expert team is available around the clock for any banking need.",
  },
  {
    icon: TrendingUp,
    title: "Best Rates",
    desc: "Competitive interest rates that outperform traditional high-street banks.",
  },
  {
    icon: Users,
    title: "Trusted Globally",
    desc: "Over 50,000 customers worldwide trust MidFirst Bank with their finances.",
  },
];

const NAV_LINKS = ["Home", "About", "Services", "Plans", "Contact"];

// --- REUSABLE SCROLL ANIMATION ---
const FadeUp = ({ children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: "-50px" }}
    transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
  >
    {children}
  </motion.div>
);

export default function Landing() {
  const navigate = useNavigate();
  const [slide, setSlide] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Scroll listener for navbar
  useEffect(() => {
    const scroller = document.getElementById("landing-scroller");
    if (!scroller) return;

    const handleScroll = () => {
      // Check the scrollTop of the div instead of window.scrollY
      setIsScrolled(scroller.scrollTop > 20);
    };

    scroller.addEventListener("scroll", handleScroll);
    return () => scroller.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "unset";
  }, [isMenuOpen]);

  // Slideshow timer
  useEffect(() => {
    const t = setInterval(() => setSlide((s) => (s + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  const prev = () => setSlide((s) => (s - 1 + SLIDES.length) % SLIDES.length);
  const next = () => setSlide((s) => (s + 1) % SLIDES.length);

  return (
    <div
      className="w-full"
      id="landing-scroller"
      style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        color: "#0f172a",
        overflowX: "hidden",
        background: "#ffffff",
        scrollBehavior: "smooth",
      }}
    >
      {/* ── RESPONSIVE NAV (Fixed contrast) ── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          background: isScrolled ? "rgba(15, 23, 42, 0.95)" : "transparent",
          backdropFilter: isScrolled ? "blur(16px)" : "none",
          WebkitBackdropFilter: isScrolled ? "blur(16px)" : "none",
          borderBottom: isScrolled
            ? "1px solid rgba(255,255,255,0.08)"
            : "1px solid transparent",
          boxShadow: isScrolled ? "0 4px 20px rgba(0,0,0,0.1)" : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 clamp(20px, 5vw, 64px)",
          height: 80,
          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            cursor: "pointer",
            zIndex: 60,
          }}
          onClick={() => window.scrollTo(0, 0)}
        >
          <img src="/logo.png" alt="MidFirst Bank Logo" className="h-5 w-auto"/>
          {/* Logo text turns dark ONLY if the white mobile menu is open */}
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: isMenuOpen ? "#0f172a" : "#fff",
              letterSpacing: "-0.5px",
              transition: "color 0.3s",
            }}
          >
            MIDFIRST BANK
          </span>
        </div>

        {/* Desktop Links (Always light text, since nav is dark) */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 36 }}
        >
          {NAV_LINKS.map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#cbd5e1",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = "#fff")}
              onMouseLeave={(e) => (e.target.style.color = "#cbd5e1")}
            >
              {l}
            </a>
          ))}
        </div>

        {/* Desktop Buttons */}
        <div
          className="hidden md:flex"
          style={{ alignItems: "center", gap: 16 }}
        >
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 20px",
              borderRadius: 99,
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#f97316")}
            onMouseLeave={(e) => (e.target.style.color = "#fff")}
          >
            Sign In
          </button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/login")}
            style={{
              padding: "10px 24px",
              borderRadius: 99,
              fontSize: 14,
              fontWeight: 700,
              color: "#fff",
              background: "#ea580c",
              border: "none",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(234, 88, 12, 0.3)",
            }}
          >
            Get Started
          </motion.button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          style={{
            background: "transparent",
            border: "none",
            cursor: "pointer",
            zIndex: 60,
          }}
        >
          {isMenuOpen ? (
            <X size={28} color="#0f172a" />
          ) : (
            <Menu size={28} color="#fff" />
          )}
        </button>
      </nav>

      {/* ── MOBILE MENU OVERLAY ── */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 50,
              background: "#ffffff",
              paddingTop: 100,
              paddingLeft: 24,
              paddingRight: 24,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {NAV_LINKS.map((link) => (
                <a
                  key={link}
                  href={`#${link.toLowerCase()}`}
                  onClick={() => setIsMenuOpen(false)}
                  style={{
                    textDecoration: "none",
                    color: "#0f172a",
                    fontSize: 24,
                    fontWeight: 700,
                    borderBottom: "1px solid #f1f5f9",
                    paddingBottom: 16,
                  }}
                >
                  {link}
                </a>
              ))}
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/login");
                }}
                style={{
                  background: "#ea580c",
                  color: "#fff",
                  border: "none",
                  borderRadius: 16,
                  padding: "16px",
                  fontSize: 18,
                  fontWeight: 700,
                  cursor: "pointer",
                  marginTop: 16,
                  width: "100%",
                  boxShadow: "0 4px 12px rgba(234,88,12,0.2)",
                }}
              >
                Sign In / Get Started
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO SLIDESHOW ── */}
      <section
        id="home"
        style={{
          position: "relative",
          height: "100vh",
          minHeight: 600,
          overflow: "hidden",
          background: "#020617",
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={slide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeInOut" }}
            style={{ position: "absolute", inset: 0 }}
          >
            <img
              src={SLIDES[slide].img}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: "center",
              }}
            />
            {/* Cinematic Gradient Overlay */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.1) 100%)",
              }}
            />
          </motion.div>
        </AnimatePresence>

        {/* Text content */}
        <div
          style={{
            position: "relative",
            zIndex: 10,
            height: "100%",
            display: "flex",
            alignItems: "center",
            padding: "0 clamp(24px, 6vw, 96px)",
          }}
        >
          <div style={{ maxWidth: 700 }}>
            <AnimatePresence mode="wait">
              <motion.div
                key={slide}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
              >
                <h1
                  style={{
                    fontSize: "clamp(40px, 6vw, 72px)",
                    fontWeight: 800,
                    color: "#fff",
                    lineHeight: 1.1,
                    letterSpacing: "-1px",
                    marginBottom: 24,
                    whiteSpace: "pre-line",
                  }}
                >
                  {SLIDES[slide].heading}
                </h1>
                <p
                  style={{
                    fontSize: "clamp(16px, 2vw, 20px)",
                    color: "#cbd5e1",
                    lineHeight: 1.6,
                    marginBottom: 40,
                    maxWidth: 540,
                  }}
                >
                  {SLIDES[slide].sub}
                </p>
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate("/login")}
                    style={{
                      padding: "16px 32px",
                      borderRadius: 99,
                      fontSize: 16,
                      fontWeight: 700,
                      color: "#fff",
                      background: "#ea580c",
                      border: "none",
                      cursor: "pointer",
                      boxShadow: "0 8px 24px rgba(234,88,12,0.4)",
                    }}
                  >
                    Get Started
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    style={{
                      padding: "16px 32px",
                      borderRadius: 99,
                      fontSize: 16,
                      fontWeight: 600,
                      color: "#fff",
                      background: "rgba(255,255,255,0.1)",
                      border: "1px solid rgba(255,255,255,0.2)",
                      cursor: "pointer",
                      backdropFilter: "blur(8px)",
                    }}
                  >
                    Learn More
                  </motion.button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Slide Controls & Dots */}
        <div
          style={{
            position: "absolute",
            bottom: 40,
            right: "clamp(24px, 6vw, 96px)",
            display: "flex",
            gap: 12,
            zIndex: 10,
          }}
        >
          <button
            onClick={prev}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={next}
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              backdropFilter: "blur(8px)",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.2)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.1)")
            }
          >
            <ChevronRight size={24} />
          </button>
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 40,
            left: "clamp(24px, 6vw, 96px)",
            display: "flex",
            gap: 8,
            zIndex: 10,
            alignItems: "center",
          }}
        >
          {SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setSlide(i)}
              style={{
                width: i === slide ? 32 : 8,
                height: 8,
                borderRadius: 4,
                background: i === slide ? "#ea580c" : "rgba(255,255,255,0.3)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.3s ease",
                padding: 0,
              }}
            />
          ))}
        </div>
      </section>

      {/* ── STATS ── */}
      <section
        style={{
          background: "#fff",
          padding: "clamp(60px, 8vw, 80px) clamp(24px, 5vw, 64px)",
          borderBottom: "1px solid #f1f5f9",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 40,
          }}
        >
          {STATS.map((s, i) => (
            <FadeUp key={s.label} delay={i * 0.1}>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontSize: "clamp(40px, 5vw, 56px)",
                    fontWeight: 800,
                    color: "#0f172a",
                    letterSpacing: "-2px",
                    marginBottom: 8,
                  }}
                >
                  {s.value}
                </p>
                <p
                  style={{
                    fontSize: 15,
                    color: "#64748b",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {s.label}
                </p>
              </div>
            </FadeUp>
          ))}
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section
        id="about"
        style={{
          background: "#f8fafc",
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 5vw, 64px)",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(100%, 480px), 1fr))",
            gap: "clamp(60px, 8vw, 100px)",
            alignItems: "center",
          }}
        >
          <FadeUp>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  borderRadius: 32,
                  overflow: "hidden",
                  background: "#e2e8f0",
                  boxShadow: "0 24px 48px -12px rgba(0,0,0,0.15)",
                }}
              >
                <img
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1000&q=80"
                  alt="Modern banking"
                  style={{
                    width: "100%",
                    display: "block",
                    aspectRatio: "4/3",
                    objectFit: "cover",
                  }}
                />
              </div>
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 4,
                  ease: "easeInOut",
                }}
                style={{
                  position: "absolute",
                  bottom: -30,
                  right: -20,
                  background: "#fff",
                  borderRadius: 24,
                  padding: "24px 32px",
                  boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: "#64748b",
                    fontWeight: 600,
                    marginBottom: 4,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Active Users
                </p>
                <p
                  style={{
                    fontSize: 36,
                    fontWeight: 800,
                    color: "#ea580c",
                    letterSpacing: "-1px",
                  }}
                >
                  50,000+
                </p>
                <p style={{ fontSize: 13, color: "#94a3b8", fontWeight: 500 }}>
                  across 200+ countries
                </p>
              </motion.div>
            </div>
          </FadeUp>

          <FadeUp delay={0.2}>
            <div>
              <div
                style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  background: "#fff7ed",
                  borderRadius: 99,
                  color: "#ea580c",
                  fontSize: 13,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 24,
                }}
              >
                About MidFirst Bank
              </div>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: 1.1,
                  letterSpacing: "-1px",
                  marginBottom: 24,
                }}
              >
                Banking reimagined for the digital generation.
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 24,
                }}
              >
                MidFirst Bank was founded with a single mission: to make world-class
                financial services accessible to everyone. We combine
                cutting-edge technology with a human-first approach.
              </p>
              <p
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 40,
                }}
              >
                From instant global transfers to high-yield savings and flexible
                loan products, we offer everything you need to take control of
                your financial future.
              </p>
              <button
                onClick={() => navigate("/login")}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 32px",
                  borderRadius: 99,
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#fff",
                  background: "#0f172a",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 10px 24px rgba(15,23,42,0.2)",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                Open an Account <ArrowRight size={18} />
              </button>
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section
        id="services"
        style={{
          background: "#fff",
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 5vw, 64px)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ea580c",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}
              >
                What We Offer
              </p>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-1px",
                  marginBottom: 16,
                }}
              >
                Everything you need.
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  maxWidth: 600,
                  margin: "0 auto",
                }}
              >
                A complete suite of financial tools designed to help you manage,
                grow, and protect your money.
              </p>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {SERVICES.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.1}>
                <div
                  style={{
                    borderRadius: 24,
                    padding: 40,
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#fff";
                    e.currentTarget.style.borderColor = "#cbd5e1";
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow =
                      "0 20px 40px rgba(0,0,0,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#f8fafc";
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "#fff7ed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 24,
                    }}
                  >
                    <Icon size={24} color="#ea580c" />
                  </div>
                  <h3
                    style={{
                      fontSize: 20,
                      fontWeight: 800,
                      color: "#0f172a",
                      marginBottom: 12,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{
                      fontSize: 15,
                      color: "#64748b",
                      lineHeight: 1.6,
                      marginBottom: 20,
                    }}
                  >
                    {desc}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      color: "#ea580c",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    Learn more <ChevronRight size={16} />
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOSIT PLANS ── */}
      <section
        id="plans"
        style={{
          background: "#f8fafc",
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 5vw, 64px)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#ea580c",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}
              >
                Grow Your Savings
              </p>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-1px",
                  marginBottom: 16,
                }}
              >
                Fixed Deposit Plans
              </h2>
              <p
                style={{
                  fontSize: 18,
                  color: "#64748b",
                  maxWidth: 600,
                  margin: "0 auto",
                }}
              >
                Lock in competitive interest rates and watch your money grow
                securely.
              </p>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
              marginBottom: 80,
            }}
          >
            {DEPOSIT_PLANS.map((p, i) => (
              <FadeUp key={p.name} delay={i * 0.1}>
                <div
                  style={{
                    position: "relative",
                    borderRadius: 24,
                    background: "#fff",
                    border:
                      i === 1 ? `2px solid ${p.color}` : "1px solid #e2e8f0",
                    boxShadow:
                      i === 1
                        ? `0 24px 48px ${p.color}20`
                        : "0 4px 12px rgba(0,0,0,0.02)",
                    padding: 40,
                    transform: i === 1 ? "scale(1.02)" : "scale(1)",
                    zIndex: i === 1 ? 2 : 1,
                  }}
                >
                  {i === 1 && (
                    <div
                      style={{
                        position: "absolute",
                        top: -14,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: p.color,
                        color: "#fff",
                        padding: "4px 16px",
                        borderRadius: 99,
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                      }}
                    >
                      Most Popular
                    </div>
                  )}

                  <p
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 8,
                    }}
                  >
                    {p.name}
                  </p>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 4,
                      marginBottom: 32,
                    }}
                  >
                    <p
                      style={{
                        fontSize: 48,
                        fontWeight: 800,
                        color: "#0f172a",
                        letterSpacing: "-2px",
                      }}
                    >
                      {p.rate}
                    </p>
                    <p
                      style={{
                        fontSize: 16,
                        color: "#64748b",
                        fontWeight: 500,
                      }}
                    >
                      / year
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 16,
                      marginBottom: 40,
                    }}
                  >
                    {[
                      `Min: ${p.min}`,
                      `Max: ${p.max}`,
                      `Term: ${p.term}`,
                      "Monthly interest payout",
                    ].map((f) => (
                      <div
                        key={f}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            borderRadius: "50%",
                            background: "#f1f5f9",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <Check size={14} color="#0f172a" />
                        </div>
                        <span
                          style={{
                            fontSize: 15,
                            color: "#475569",
                            fontWeight: 500,
                          }}
                        >
                          {f}
                        </span>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate("/login")}
                    style={{
                      width: "100%",
                      padding: "16px",
                      borderRadius: 14,
                      fontSize: 16,
                      fontWeight: 700,
                      color: i === 1 ? "#fff" : "#0f172a",
                      background: i === 1 ? p.color : "#f1f5f9",
                      border: "none",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = 0.9)}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = 1)}
                  >
                    Start Earning
                  </button>
                </div>
              </FadeUp>
            ))}
          </div>

          {/* Loan Plans */}
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 40 }}>
              <h2
                style={{
                  fontSize: "clamp(28px, 4vw, 36px)",
                  fontWeight: 800,
                  color: "#0f172a",
                  letterSpacing: "-1px",
                  marginBottom: 12,
                }}
              >
                Flexible Loan Products
              </h2>
              <p style={{ fontSize: 16, color: "#64748b" }}>
                Financing solutions for every milestone.
              </p>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
                gap: 24,
              }}
            >
              {LOAN_PLANS.map((p, i) => (
                <div
                  key={p.name}
                  style={{
                    borderRadius: 24,
                    padding: 32,
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                  }}
                >
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 20 }}
                  >
                    <div
                      style={{
                        width: 56,
                        height: 56,
                        borderRadius: 16,
                        background: `${p.color}15`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <FileText size={24} color={p.color} />
                    </div>
                    <div>
                      <p
                        style={{
                          fontSize: 18,
                          fontWeight: 800,
                          color: "#0f172a",
                          marginBottom: 4,
                        }}
                      >
                        {p.name}
                      </p>
                      <p
                        style={{
                          fontSize: 14,
                          color: "#64748b",
                          fontWeight: 500,
                        }}
                      >
                        {p.range} · {p.term}
                      </p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p
                      style={{
                        fontSize: 13,
                        color: "#64748b",
                        fontWeight: 600,
                        textTransform: "uppercase",
                        marginBottom: 2,
                      }}
                    >
                      From
                    </p>
                    <p
                      style={{ fontSize: 24, fontWeight: 800, color: p.color }}
                    >
                      {p.rate}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section
        style={{
          background: "#0f172a",
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 5vw, 64px)",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <FadeUp>
            <div style={{ textAlign: "center", marginBottom: 80 }}>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#f97316",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginBottom: 12,
                }}
              >
                Why MidFirst Bank
              </p>
              <h2
                style={{
                  fontSize: "clamp(32px, 4vw, 48px)",
                  fontWeight: 800,
                  color: "#fff",
                  letterSpacing: "-1px",
                  marginBottom: 16,
                }}
              >
                Built for your financial success.
              </h2>
            </div>
          </FadeUp>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: 32,
            }}
          >
            {WHY.map(({ icon: Icon, title, desc }, i) => (
              <FadeUp key={title} delay={i * 0.1}>
                <div
                  style={{
                    padding: 32,
                    borderRadius: 24,
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 16,
                      background: "rgba(234, 88, 12, 0.1)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 24,
                    }}
                  >
                    <Icon size={24} color="#f97316" />
                  </div>
                  <h3
                    style={{
                      fontSize: 18,
                      fontWeight: 700,
                      color: "#fff",
                      marginBottom: 12,
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    style={{ fontSize: 15, color: "#94a3b8", lineHeight: 1.6 }}
                  >
                    {desc}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section
        style={{
          padding: "clamp(80px, 10vw, 120px) clamp(24px, 5vw, 64px)",
          background: "#fff",
        }}
      >
        <FadeUp>
          <div
            style={{
              maxWidth: 1000,
              margin: "0 auto",
              background: "linear-gradient(135deg, #ea580c, #c2410c)",
              borderRadius: 32,
              padding: "clamp(40px, 8vw, 80px) 24px",
              textAlign: "center",
              boxShadow: "0 24px 48px rgba(234, 88, 12, 0.2)",
            }}
          >
            <h2
              style={{
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-1px",
                marginBottom: 20,
              }}
            >
              Ready to take control?
            </h2>
            <p
              style={{
                fontSize: 18,
                color: "#ffedd5",
                lineHeight: 1.6,
                marginBottom: 40,
                maxWidth: 500,
                margin: "0 auto 40px",
              }}
            >
              Join over 50,000 customers already banking smarter with MidFirst. Open
              your free account in minutes.
            </p>
            <button
              onClick={() => navigate("/login")}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "18px 40px",
                borderRadius: 99,
                fontSize: 18,
                fontWeight: 800,
                color: "#ea580c",
                background: "#fff",
                border: "none",
                cursor: "pointer",
                transition: "transform 0.2s",
                boxShadow: "0 10px 24px rgba(0,0,0,0.1)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.transform = "scale(1.05)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.transform = "scale(1)")
              }
            >
              Get Started Now <ArrowRight size={20} />
            </button>
          </div>
        </FadeUp>
      </section>

      {/* ── FOOTER ── */}
      <footer
        id="contact"
        style={{
          background: "#f8fafc",
          padding: "clamp(60px, 8vw, 80px) clamp(24px, 5vw, 64px) 40px",
          borderTop: "1px solid #e2e8f0",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 48,
              marginBottom: 60,
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 20,
                }}
              >
                <img src="/logo.png" alt="MidFirst Bank Logo" className="h-6 w-auto"/>
                <span
                  style={{ fontSize: 20, fontWeight: 800, color: "#0f172a" }}
                >
                  MidFirst Bank
                </span>
              </div>
              <p
                style={{
                  fontSize: 15,
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 24,
                  maxWidth: 280,
                }}
              >
                Modern banking for the digital generation. Safe, fast, and built
                entirely around you.
              </p>
            </div>

            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 24,
                }}
              >
                Company
              </p>
              {["Home", "About Us", "Services", "Fixed Deposits", "FAQ"].map(
                (l) => (
                  <p
                    key={l}
                    style={{
                      fontSize: 15,
                      color: "#64748b",
                      marginBottom: 16,
                      cursor: "pointer",
                      fontWeight: 500,
                    }}
                    onMouseEnter={(e) => (e.target.style.color = "#ea580c")}
                    onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                  >
                    {l}
                  </p>
                ),
              )}
            </div>

            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 24,
                }}
              >
                Legal
              </p>
              {[
                "Privacy Policy",
                "Terms & Conditions",
                "Cookie Policy",
                "Compliance",
              ].map((l) => (
                <p
                  key={l}
                  style={{
                    fontSize: 15,
                    color: "#64748b",
                    marginBottom: 16,
                    cursor: "pointer",
                    fontWeight: 500,
                  }}
                  onMouseEnter={(e) => (e.target.style.color = "#ea580c")}
                  onMouseLeave={(e) => (e.target.style.color = "#64748b")}
                >
                  {l}
                </p>
              ))}
            </div>

            <div>
              <p
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: "#0f172a",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 24,
                }}
              >
                Contact
              </p>
              {[
                { icon: Phone, text: "+1 (800) 123-4567" },
                { icon: Mail, text: "support@midfirst.io" },
                { icon: MapPin, text: "350 Fifth Ave, New York" },
              ].map(({ icon: Icon, text }) => (
                <div
                  key={text}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <Icon size={16} color="#ea580c" />
                  <p
                    style={{ fontSize: 15, color: "#64748b", fontWeight: 500 }}
                  >
                    {text}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{
              borderTop: "1px solid #e2e8f0",
              paddingTop: 32,
              display: "flex",
              flexDirection: "column",
              md: { flexDirection: "row" },
              justifyContent: "space-between",
              alignItems: "center",
              gap: 16,
            }}
          >
            <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>
              © {new Date().getFullYear()} MidFirst Bank. All rights reserved.
              Member FDIC
            </p>
            <p style={{ fontSize: 14, color: "#94a3b8", fontWeight: 500 }}>
              Deposits insured up to $250,000
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}