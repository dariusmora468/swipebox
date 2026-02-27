'use client';

function GamificationBar({ streak, level, gems, xpProgress, dailyXP, dailyGoalXP, onStreakTap }) {
  return (
    <div style={{
      padding: "8px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
      background: "#FAFAFA", borderBottom: "1px solid rgba(0,0,0,0.04)",
      gap: "12px", minHeight: "36px",
    }}>
      {/* Streak */}
      <button onClick={onStreakTap} style={{
        display: "flex", alignItems: "center", gap: "5px",
        background: "none", border: "none", cursor: "pointer", padding: "2px 0",
      }}>
        <span style={{ fontSize: "18px", filter: streak > 0 ? "none" : "grayscale(1)" }}>{"\u{1F525}"}</span>
        <span style={{ fontSize: "14px", fontWeight: 800, color: streak > 0 ? "#F59E0B" : "#D1D5DB" }}>{streak}</span>
      </button>

      {/* Level + XP bar (center, takes remaining space) */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "8px", maxWidth: "220px" }}>
        <div style={{
          width: "26px", height: "26px", borderRadius: "50%",
          background: "linear-gradient(135deg, #4F46E5, #7C3AED)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#fff", fontSize: "11px", fontWeight: 800, flexShrink: 0,
          boxShadow: "0 2px 6px rgba(79,70,229,0.3)",
        }}>{level}</div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
          <div style={{
            height: "6px", borderRadius: "3px", background: "rgba(0,0,0,0.06)", overflow: "hidden",
          }}>
            <div style={{
              height: "100%", width: `${Math.min(100, xpProgress * 100)}%`,
              background: "linear-gradient(90deg, #4F46E5, #7C3AED)",
              borderRadius: "3px", transition: "width 0.5s ease",
            }} />
          </div>
          <div style={{ fontSize: "9px", color: "#9CA3AF", fontWeight: 600, lineHeight: 1 }}>
            {dailyXP}/{dailyGoalXP} XP today
          </div>
        </div>
      </div>

      {/* Gems */}
      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
        <span style={{ fontSize: "14px" }}>{"\u{1F48E}"}</span>
        <span style={{ fontSize: "13px", fontWeight: 700, color: "#7C3AED" }}>{gems}</span>
      </div>
    </div>
  );
}

export default GamificationBar;
