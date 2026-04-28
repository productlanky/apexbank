import { LayoutDashboard, CreditCard, ArrowLeftRight, Send, Download, Settings, LogOut, Leaf } from 'lucide-react';
import { user } from '../data/mockData';

const NAV = [
  { id: 'dashboard',    label: 'Overview',     icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'cards',        label: 'Cards',        icon: CreditCard },
  { id: 'send',         label: 'Send Money',   icon: Send },
  { id: 'receive',      label: 'Receive',      icon: Download },
];

export default function Sidebar({ active, onNav }) {
  return (
    <aside className="sidebar" style={{
      width: 232, flexShrink: 0, height: '100vh',
      display: 'flex', flexDirection: 'column',
      background: '#0a0c12',
      borderRight: '1px solid rgba(255,255,255,0.055)',
      padding: '24px 14px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '2px 8px', marginBottom: 32 }}>
        <div style={{
          width: 32, height: 32, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, #059669, #10b981)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Leaf size={15} color="#fff" fill="#fff" />
        </div>
        <span style={{ fontSize: 17, fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>Apex</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', borderRadius: 6, padding: '2px 7px', marginLeft: -2 }}>BANK</span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: '#2d3748', letterSpacing: '0.09em', textTransform: 'uppercase', padding: '0 8px', marginBottom: 6 }}>Main</p>
        {NAV.map(({ id, label, icon: Icon }) => (
          <button key={id} className={`nav-item ${active === id ? 'active' : ''}`} onClick={() => onNav(id)}>
            <Icon size={16} strokeWidth={active === id ? 2.5 : 2} />
            {label}
          </button>
        ))}
      </nav>

      {/* Bottom */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <button className={`nav-item ${active === 'settings' ? 'active' : ''}`} onClick={() => onNav('settings')}>
          <Settings size={16} strokeWidth={2} /> Settings
        </button>
        <button className="nav-item" style={{ color: '#ef4444' }}>
          <LogOut size={16} strokeWidth={2} /> Sign Out
        </button>

        {/* User */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          marginTop: 12, padding: '10px 10px', borderRadius: 12,
          background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.055)',
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9, flexShrink: 0,
            background: 'linear-gradient(135deg, #059669, #10b981)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 800, color: '#fff',
          }}>{user.avatar}</div>
          <div style={{ minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
            <p style={{ fontSize: 10, color: '#4b5563' }}>{user.plan}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
