'use client';
import { useEffect, useState } from 'react';

function CelebrationOverlay({ celebration, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 300);
    }, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!celebration) return null;

  const { type } = celebration;

  // Confetti particles
  const confetti = Array.from({ length: 24 }, (_, i) => ({
    left: `${Math.random() * 100}%`,
    delay: `${Math.random() * 0.8}s`,
    color: type === "inbox_zero"
      ? ["#EF4444", "#F59E0B", "#10B981", "#4F46E5", "#7C3AED", "#EC4899"][i % 6]
      : ["#10B981", "#34d399", "#4F46E5", "#7C3AED"][i % 4],
    size: 4 + Math.random() * 6,
  }));

  const renderContent = () => {
    if (type === "halfway") {
      return (
        <>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>{"\u{1F389}"}</div>
          <div style={{ fontSize: "24px", fontWeight: 900, color: "#1A1A2E", marginBottom: "8px" }}>
            HALFWAY THERE!
          </div>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <div style={{
              padding: "8px 16px", borderRadius: "12px",
              background: "rgba(79,70,229,0.08)", border: "1px solid rgba(79,70,229,0.15)",
              fontSize: "14px", fontWeight: 700, color: "#4F46E5",
            }}>+{celebration.xp || 100} XP</div>
            <div style={{
              padding: "8px 16px", borderRadius: "12px",
              background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
              fontSize: "14px", fontWeight: 700, color: "#7C3AED",
            }}>+{celebration.gems || 5} {"\u{1F48E}"}</div>
          </div>
        </>
      );
    }

    if (type === "inbox_zero") {
      return (
        <>
          <div style={{ fontSize: "56px", marginBottom: "16px" }}>{"\u{1F3C6}"}</div>
          <div style={{
            fontSize: "28px", fontWeight: 900, letterSpacing: "-0.5px",
            background: "linear-gradient(135deg, #10B981, #059669)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            marginBottom: "8px",
          }}>
            INBOX ZERO!
          </div>
          <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "16px" }}>
            You processed all your emails today
          </div>
          {celebration.stats && (
            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              {[
                { label: "Processed", value: celebration.stats.total, color: "#4F46E5" },
                { label: "XP Earned", value: celebration.stats.xp, color: "#7C3AED" },
                { label: "Streak", value: `${celebration.stats.streak} days`, color: "#F59E0B" },
              ].map((stat, i) => (
                <div key={i} style={{
                  padding: "8px 14px", borderRadius: "12px",
                  background: `${stat.color}08`, border: `1px solid ${stat.color}15`,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: stat.color }}>{stat.value}</div>
                  <div style={{ fontSize: "10px", fontWeight: 600, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </>
      );
    }

    if (type === "streak_milestone") {
      return (
        <>
          <div style={{ fontSize: "56px", marginBottom: "12px" }}>{"\u{1F525}"}</div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "#F59E0B", marginBottom: "4px" }}>
            {celebration.milestone} DAYS
          </div>
          <div style={{ fontSize: "15px", fontWeight: 600, color: "#6B7280", marginBottom: "12px" }}>
            Streak Milestone!
          </div>
          <div style={{
            padding: "8px 16px", borderRadius: "12px",
            background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
            fontSize: "14px", fontWeight: 700, color: "#7C3AED",
          }}>+{celebration.gems || 5} {"\u{1F48E}"}</div>
        </>
      );
    }

    if (type === "level_up") {
      return (
        <>
          <div style={{
            width: "72px", height: "72px", borderRadius: "50%",
            background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "#fff", fontSize: "28px", fontWeight: 900, marginBottom: "16px",
            boxShadow: "0 0 30px rgba(79,70,229,0.4), 0 0 60px rgba(124,58,237,0.2)",
          }}>{celebration.newLevel}</div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#1A1A2E", marginBottom: "4px" }}>
            LEVEL UP!
          </div>
          <div style={{ fontSize: "14px", color: "#6B7280" }}>
            You reached Level {celebration.newLevel}
          </div>
        </>
      );
    }

    if (type === "daily_goal_met") {
      return (
        <>
          <div style={{ fontSize: "48px", marginBottom: "12px" }}>{"\u2B50"}</div>
          <div style={{ fontSize: "22px", fontWeight: 900, color: "#1A1A2E", marginBottom: "4px" }}>
            DAILY GOAL MET!
          </div>
          <div style={{ fontSize: "14px", color: "#6B7280", marginBottom: "8px" }}>
            {celebration.streak > 0 ? `${celebration.streak} day streak!` : "Great work today!"}
          </div>
          <div style={{
            padding: "6px 14px", borderRadius: "10px",
            background: "rgba(124,58,237,0.08)", fontSize: "13px", fontWeight: 700, color: "#7C3AED",
          }}>+{celebration.gems || 2} {"\u{1F48E}"}</div>
        </>
      );
    }

    return null;
  };

  return (
    <div
      onClick={() => { setVisible(false); setTimeout(onDismiss, 300); }}
      style={{
        position: "fixed", inset: 0, zIndex: 500,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(255,255,255,0.85)", backdropFilter: "blur(12px)",
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
        {renderContent()}
      </div>
    </div>
  );
}

export default CelebrationOverlay;
