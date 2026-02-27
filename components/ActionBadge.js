'use client';

function ActionBadge({ direction, opacity, hasReply }) {
  const config = {
    right: { label: "READ", color: "#A0775A", glow: "rgba(160,119,90,0.3)" },
    left: { label: "SNOOZE", color: "#B8963E", glow: "rgba(184,150,62,0.3)" },
    up: { label: hasReply ? "SEND" : "REPLY", color: "#7A8C6E", glow: "rgba(122,140,110,0.3)" },
    down: { label: "DELETE", color: "#B07070", glow: "rgba(176,112,112,0.3)" },
  };
  const c = config[direction];
  if (!c) return null;
  return (
    <div style={{
      position: "absolute",
      top: direction === "down" ? "auto" : "24px",
      bottom: direction === "down" ? "24px" : "auto",
      left: direction === "right" ? "24px" : direction === "left" ? "auto" : "50%",
      right: direction === "left" ? "24px" : "auto",
      transform: direction === "up" || direction === "down" ? "translateX(-50%)" : `rotate(${direction === "right" ? "12" : "-12"}deg)`,
      opacity: Math.min(opacity, 1), transition: "opacity 0.1s", zIndex: 10, pointerEvents: "none",
    }}>
      <div style={{
        border: `2px solid ${c.color}`, borderRadius: "10px", padding: "8px 20px",
        color: c.color, fontWeight: 700, fontSize: "18px", letterSpacing: "2.5px",
        fontFamily: "'Playfair Display', Georgia, serif",
        background: "rgba(253,251,249,0.92)", backdropFilter: "blur(12px)",
        boxShadow: `0 0 24px ${c.glow}`,
      }}>{c.label}</div>
    </div>
  );
}

export default ActionBadge;
