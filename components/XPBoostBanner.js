'use client';
import { useState, useEffect, useRef } from 'react';

function XPBoostBanner({ active, multiplier, endTime }) {
  const [timeLeft, setTimeLeft] = useState(0);
  const [visible, setVisible] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (!active || !endTime) { setVisible(false); return; }
    setVisible(true);

    const tick = () => {
      const remaining = Math.max(0, endTime - Date.now());
      setTimeLeft(remaining);
      if (remaining <= 0) {
        setVisible(false);
        clearInterval(intervalRef.current);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [active, endTime]);

  if (!visible) return null;

  const minutes = Math.floor(timeLeft / 60000);
  const seconds = Math.floor((timeLeft % 60000) / 1000);
  const timeStr = `${minutes}:${seconds.toString().padStart(2, "0")}`;
  const urgency = timeLeft < 120000; // last 2 minutes

  return (
    <div style={{
      padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
      background: urgency
        ? "linear-gradient(90deg, rgba(239,68,68,0.08), rgba(245,158,11,0.08))"
        : "linear-gradient(90deg, rgba(79,70,229,0.06), rgba(124,58,237,0.06))",
      borderBottom: "1px solid rgba(0,0,0,0.04)",
      animation: "fadeIn 0.3s ease",
    }}>
      <span style={{ fontSize: "14px" }}>{"\u26A1"}</span>
      <span style={{
        fontSize: "12px", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase",
        background: urgency
          ? "linear-gradient(90deg, #EF4444, #F59E0B)"
          : "linear-gradient(90deg, #4F46E5, #7C3AED)",
        WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
      }}>
        {multiplier}X XP Boost
      </span>
      <span style={{
        fontSize: "13px", fontWeight: 700, fontVariantNumeric: "tabular-nums",
        color: urgency ? "#EF4444" : "#4F46E5",
        minWidth: "40px",
      }}>
        {timeStr}
      </span>
    </div>
  );
}

export default XPBoostBanner;
