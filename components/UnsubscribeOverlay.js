'use client';
import { useState } from 'react';

function UnsubscribeOverlay({ url, sender, onClose }) {
  const [loading, setLoading] = useState(true);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(44,37,32,0.85)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid rgba(120,100,80,0.15)",
        background: "rgba(253,251,249,0.97)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>{"\u{1F515}"}</span>
          <div>
            <div style={{ color: "#2C2520", fontWeight: 600, fontSize: "14px" }}>Unsubscribe from {sender}</div>
            <div style={{ color: "#9C8E82", fontSize: "11px", marginTop: "2px" }}>Complete the unsubscribe on this page, then tap Done</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          padding: "10px 20px", borderRadius: "12px",
          background: "rgba(160,119,90,0.1)", border: "1px solid rgba(160,119,90,0.2)",
          color: "#A0775A", fontWeight: 600, fontSize: "14px", cursor: "pointer",
        }}>Done</button>
      </div>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "#9C8E82" }}>
          Loading unsubscribe page...
        </div>
      )}
      <iframe
        src={url}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          window.open(url, "_blank");
          onClose();
        }}
        style={{
          flex: 1, width: "100%", border: "none",
          background: "#fff", display: loading ? "none" : "block",
        }}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
      />
    </div>
  );
}

export default UnsubscribeOverlay;
