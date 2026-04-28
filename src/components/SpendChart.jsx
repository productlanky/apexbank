import { spendingByMonth } from '../data/mockData';

export default function SpendChart() {
  const max = Math.max(...spendingByMonth.map(d => d.amount));
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 100, padding: '0 4px' }}>
      {spendingByMonth.map((d, i) => {
        const isLast = i === spendingByMonth.length - 1;
        const pct = (d.amount / max) * 100;
        return (
          <div key={d.month} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end' }}>
              <div title={`$${d.amount.toLocaleString()}`} style={{
                width: '100%', height: `${pct}%`, borderRadius: '6px 6px 3px 3px',
                background: isLast ? 'linear-gradient(180deg, #10b981, #059669)' : 'rgba(255,255,255,0.07)',
                transition: 'height 0.5s cubic-bezier(.22,1,.36,1)',
                position: 'relative',
              }}>
                {isLast && (
                  <div style={{ position: 'absolute', top: -26, left: '50%', transform: 'translateX(-50%)', background: '#059669', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 6, whiteSpace: 'nowrap' }}>
                    ${d.amount.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
            <span style={{ fontSize: 11, color: isLast ? '#34d399' : '#374151', fontWeight: isLast ? 600 : 400 }}>{d.month}</span>
          </div>
        );
      })}
    </div>
  );
}
