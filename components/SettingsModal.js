'use client';
import GoogleIcon from './GoogleIcon';

function SettingsModal({ accounts, onClose, onRemoveAccount }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(18, 18, 26, 0.97)", backdropFilter: "blur(40px)",
        borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", padding: "28px",
        animation: "fadeInScale 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
            color: "#94a3b8", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Connected Accounts */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "14px" }}>
            Connected Inboxes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((acc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: "14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                    border: "1px solid rgba(99,102,241,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                  }}>{"\u{1F4E7}"}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{acc.name || acc.email}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{acc.email}</div>
                  </div>
                </div>
                {accounts.length > 1 && (
                  <button onClick={() => onRemoveAccount(acc.email)} style={{
                    padding: "6px 14px", borderRadius: "8px",
                    border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.06)",
                    color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Account Button */}
        <a href="/api/auth/gmail" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          padding: "14px", borderRadius: "14px",
          border: "1.5px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)",
          color: "#94a3b8", fontSize: "14px", fontWeight: 600,
          textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
        }}>
          <GoogleIcon /> Add Gmail Account
        </a>

        <div style={{ fontSize: "12px", color: "#475569", marginTop: "16px", textAlign: "center", lineHeight: 1.5 }}>
          Connect multiple Gmail accounts to manage all your inboxes from one place.
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
