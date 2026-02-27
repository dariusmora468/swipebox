'use client';
import { SNOOZE_OPTIONS } from '../lib/constants';

function SnoozePicker({ onSelect, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(44,37,32,0.4)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.15s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "340px",
        background: "#FDFBF9",
        borderRadius: "20px", border: "1px solid rgba(120,100,80,0.1)",
        boxShadow: "0 24px 80px rgba(44,37,32,0.2)", padding: "24px",
        animation: "fadeInScale 0.2s ease",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "20px" }}>{"\u23F0"}</span>
          <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "18px", fontWeight: 700, color: "#2C2520", margin: 0 }}>Snooze Until</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
          {SNOOZE_OPTIONS.map((opt, i) => (
            <button key={i} onClick={() => onSelect(opt)} style={{
              padding: "13px 16px", borderRadius: "12px",
              background: i === 0 ? "rgba(184,150,62,0.06)" : "rgba(120,100,80,0.03)",
              border: i === 0 ? "1px solid rgba(184,150,62,0.15)" : "1px solid rgba(120,100,80,0.06)",
              cursor: "pointer", textAlign: "left", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: i === 0 ? "#B8963E" : "#2C2520" }}>{opt.label}</span>
              <span style={{ fontSize: "12px", color: "#9C8E82" }}>{opt.sublabel}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", marginTop: "12px", padding: "12px",
          borderRadius: "12px", border: "1px solid rgba(120,100,80,0.08)",
          background: "transparent", color: "#9C8E82", fontSize: "13px",
          fontWeight: 600, cursor: "pointer",
        }}>Cancel</button>
      </div>
    </div>
  );
}

export default SnoozePicker;
