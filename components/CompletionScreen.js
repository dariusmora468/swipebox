'use client';

function CompletionScreen({ stats, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "rgba(122,140,110,0.12)", border: "1px solid rgba(122,140,110,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "32px", marginBottom: "24px" }}>{"\u{1F389}"}</div>
      <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "28px", fontWeight: 700, margin: "0 0 8px", color: "#2C2520" }}>Inbox Zero!</h2>
      <p style={{ fontSize: "14px", color: "#9C8E82", margin: "0 0 36px" }}>You crushed it. Every email handled.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", width: "100%", maxWidth: "300px", marginBottom: "36px" }}>
        {[
          { label: "Replied", count: stats.sent, color: "#7A8C6E", icon: "\u2192" },
          { label: "Read", count: stats.read, color: "#A0775A", icon: "\u2713" },
          { label: "Snoozed", count: stats.snoozed, color: "#B8963E", icon: "\u23F0" },
          { label: "Unsubbed", count: stats.unsubscribed, color: "#B07070", icon: "\u{1F515}" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px", borderRadius: "14px", background: `${s.color}0A`, border: `1px solid ${s.color}15` }}>
            <div style={{ fontSize: "26px", fontWeight: 700, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "11px", color: "#9C8E82", fontWeight: 600, marginTop: "4px" }}>{s.icon} {s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onRefresh} style={{ padding: "14px 36px", borderRadius: "14px", border: "none", background: "#A0775A", color: "#FDFBF9", fontSize: "14px", fontWeight: 600, cursor: "pointer", boxShadow: "0 4px 16px rgba(160,119,90,0.2)" }}>
        Check for New Emails
      </button>
    </div>
  );
}

export default CompletionScreen;
