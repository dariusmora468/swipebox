'use client';
import { useEffect, useState } from 'react';

function ComboCounter({ combo, lastXP }) {
  const [pulse, setPulse] = useState(false);
  const [showXP, setShowXP] = useState(false);

  useEffect(() => {
    if (combo > 0) {
      setPulse(true);
      const t = setTimeout(() => setPulse(false), 300);
      return () => clearTimeout(t);
    }
  }, [combo]);

  useEffect(() => {
    if (lastXP > 0) {
      setShowXP(true);
      const t = setTimeout(() => setShowXP(false), 1200);
      return () => clearTimeout(t);
    }
  }, [lastXP]);

  if (combo < 2) return null;

  // Color intensity increases with combo
  let color = "#4F46E5";
  let glow = "rgba(79,70,229,0.2)";
  if (combo >= 20) { color = "#7C3AED"; glow = "rgba(124,58,237,0.4)"; }
  else if (combo >= 10) { color = "#6D28D9"; glow = "rgba(109,40,217,0.3)"; }
  else if (combo >= 5) { color = "#4F46E5"; glow = "rgba(79,70,229,0.25)"; }

  const scale = pulse ? 1.15 : 1;
  const fontSize = combo >= 20 ? "22px" : combo >= 10 ? "20px" : "18px";

  return (
    <div style={{
      position: "absolute", right: "16px", top: "50%", transform: `translateY(-50%) scale(${scale})`,
      zIndex: 5, display: "flex", flexDirection: "column", alignItems: "center", gap: "4px",
      transition: "transform 0.15s ease",
      pointerEvents: "none",
    }}>
      {/* Combo count */}
      <div style={{
        fontSize, fontWeight: 900, color,
        textShadow: `0 0 12px ${glow}`,
        lineHeight: 1,
      }}>
        {combo}x
      </div>
      <div style={{
        fontSize: "9px", fontWeight: 800, color,
        letterSpacing: "1px", textTransform: "uppercase",
        opacity: 0.8,
      }}>
        COMBO
      </div>

      {/* Floating +XP */}
      {showXP && lastXP > 0 && (
        <div style={{
          fontSize: "12px", fontWeight: 700, color: "#10B981",
          animation: "floatUp 1.2s ease forwards",
          position: "absolute", top: "-20px",
        }}>
          +{lastXP} XP
        </div>
      )}
    </div>
  );
}

export default ComboCounter;
