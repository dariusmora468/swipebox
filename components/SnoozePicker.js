'use client';
import { SNOOZE_OPTIONS } from '../lib/constants';

function SnoozePicker({ onSelect, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.15s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "340px",
        background: "rgba(18, 18, 26, 0.97)", backdropFilter: "blur(40px)",
        borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", padding: "24px",
        animation: "fadeInScale 0.2s ease",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "20px" }}>{"\u23F0"}</span>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Snooze Until</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SNOOZE_OPTIONS.map((opt, i) => (
            <button key={i} onClick={() => onSelect(opt)} style={{
              padding: "14px 18px", borderRadius: "14px",
              background: i === 0 ? "rgba(129, 140, 248, 0.1)" : "rgba(255,255,255,0.04)",
              border: i === 0 ? "1px solid rgba(129, 140, 248, 0.25)" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", textAlign: "left", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: i === 0 ? "#a5b4fc" : "#e2e8f0" }}>{opt.label}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{opt.sublabel}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", marginTop: "12px", padding: "12px",
          borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "#64748b", fontSize: "13px",
          fontWeight: 600, cursor: "pointer",
        }}>Cancel</button>
      </div>
    </div>
  );
}

export default SnoozePicker;
