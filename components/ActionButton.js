'use client';
import { useState } from 'react';

function ActionButton({ icon, label, color, onClick, size = 56, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button onClick={onClick} disabled={disabled} title={label}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        border: `1.5px solid ${color}40`, background: hovered ? `${color}20` : "rgba(255,255,255,0.03)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: hovered ? `0 0 24px ${color}30` : "0 4px 12px rgba(0,0,0,0.2)",
        transform: hovered && !disabled ? "scale(1.12)" : "scale(1)",
        opacity: disabled ? 0.4 : 1, backdropFilter: "blur(12px)",
      }}>
      <span style={{ fontSize: size > 50 ? "22px" : "16px", lineHeight: 1 }}>{icon}</span>
    </button>
  );
}

export default ActionButton;
