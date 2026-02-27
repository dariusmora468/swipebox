'use client';
import GoogleIcon from './GoogleIcon';

function SettingsModal({ accounts, onClose, onRemoveAccount }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(44,37,32,0.4)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "#FDFBF9",
        borderRadius: "20px", border: "1px solid rgba(120,100,80,0.1)",
        boxShadow: "0 24px 80px rgba(44,37,32,0.2)", padding: "28px",
        animation: "fadeInScale 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "20px", fontWeight: 700, color: "#2C2520", margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(120,100,80,0.1)", background: "rgba(120,100,80,0.04)",
            color: "#9C8E82", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Connected Accounts */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "10px", fontWeight: 600, color: "#A0775A", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "14px" }}>
            Connected Inboxes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((acc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 16px", borderRadius: "14px",
                background: "rgba(120,100,80,0.03)", border: "1px solid rgba(120,100,80,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: "rgba(160,119,90,0.08)",
                    border: "1px solid rgba(160,119,90,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                  }}>{"\u{1F4E7}"}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#2C2520" }}>{acc.name || acc.email}</div>
                    <div style={{ fontSize: "12px", color: "#9C8E82" }}>{acc.email}</div>
                  </div>
                </div>
                {accounts.length > 1 && (
                  <button onClick={() => onRemoveAccount(acc.email)} style={{
                    padding: "6px 14px", borderRadius: "8px",
                    border: "1px solid rgba(176,112,112,0.15)", background: "rgba(176,112,112,0.06)",
                    color: "#B07070", fontSize: "12px", fontWeight: 600, cursor: "pointer",
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
          border: "1.5px dashed rgba(120,100,80,0.12)", background: "rgba(120,100,80,0.02)",
          color: "#6B5E54", fontSize: "14px", fontWeight: 600,
          textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
        }}>
          <GoogleIcon /> Add Gmail Account
        </a>

        <div style={{ fontSize: "12px", color: "#9C8E82", marginTop: "16px", textAlign: "center", lineHeight: 1.5 }}>
          Connect multiple Gmail accounts to manage all your inboxes from one place.
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;
