'use client';

function CompletionScreen({ stats, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", marginBottom: "24px", animation: "glow 2s ease-in-out infinite" }}>{"\u{1F389}"}</div>
      <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #34d399, #4F46E5)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inbox Zero!</h2>
      <p style={{ fontSize: "15px", color: "#9CA3AF", margin: "0 0 36px" }}>You crushed it. Every email handled.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "36px" }}>
        {[
          { label: "Replied", count: stats.sent, color: "#10B981", icon: "\u2192" },
          { label: "Read", count: stats.read, color: "#D97706", icon: "\u2713" },
          { label: "Snoozed", count: stats.snoozed, color: "#4F46E5", icon: "\u23F0" },
          { label: "Unsubbed", count: stats.unsubscribed, color: "#7C3AED", icon: "\u{1F515}" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "18px", borderRadius: "16px", background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "12px", color: "#9CA3AF", fontWeight: 600, marginTop: "4px" }}>{s.icon} {s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onRefresh} style={{ padding: "14px 36px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #4F46E5, #7C3AED)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
        Check for New Emails
      </button>
    </div>
  );
}

export default CompletionScreen;
