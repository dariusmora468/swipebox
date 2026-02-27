'use client';
import { useEffect, useState } from 'react';

function CelebrationOverlay({ celebration, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!celebration) return null;

  // Confetti particles
  const confetti = Array.from({ length: 20 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.6}s`,
    color: ["#4F46E5", "#7C3AED", "#10B981", "#F59E0B", "#EC4899", "#3B82F6"][i % 6],
    size: 5 + Math.random() * 5,
  }));

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.88)", backdropFilter: "blur(12px)",
        opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
        cursor: "pointer",
      }}
    >
      {/* Confetti */}
      {confetti.map((c, i) => (
        <div key={i} style={{
          position: "absolute", top: "-10px", left: c.left,
          width: `${c.size}px`, height: `${c.size}px`, borderRadius: "50%",
          background: c.color,
          animation: `confettiFall 2s ease-in ${c.delay} forwards`,
        }} />
      ))}

      {/* Content */}
      <div style={{
        textAlign: "center", padding: "32px",
        animation: "fadeInScale 0.4s ease",
      }}>
        <div style={{ fontSize: "56px", marginBottom: "16px" }}>{"\u{1F389}"}</div>
        <div style={{ fontSize: "26px", fontWeight: 900, color: "#1A1A2E", marginBottom: "6px", letterSpacing: "-0.5px" }}>
          HALFWAY THERE!
        </div>
        <div style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.5 }}>
          You're crushing it — keep going!
        </div>
      </div>
    </div>
  );
}

export default CelebrationOverlay;
