'use client';

function ActionBadge({ direction, opacity, hasReply }) {
  const config = {
    right: { label: hasReply ? "SEND" : "DONE", color: "#34d399", glow: "rgba(52,211,153,0.3)" },
    left: { label: "READ", color: "#fb923c", glow: "rgba(251,146,60,0.3)" },
    up: { label: "SNOOZE", color: "#818cf8", glow: "rgba(129,140,248,0.3)" },
    down: { label: "UNSUB", color: "#a855f7", glow: "rgba(168,85,247,0.3)" },
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
        border: `2px solid ${c.color}`, borderRadius: "12px", padding: "10px 24px",
        color: c.color, fontWeight: 800, fontSize: "20px", letterSpacing: "3px",
        background: "rgba(10, 10, 15, 0.85)", backdropFilter: "blur(12px)",
        boxShadow: `0 0 30px ${c.glow}`,
      }}>{c.label}</div>
    </div>
  );
}

export default ActionBadge;
