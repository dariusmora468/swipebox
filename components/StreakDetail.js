'use client';
import { useState } from 'react';
import { DAILY_GOALS, getStreakCalendar, purchaseStreakFreeze, setDailyGoal as saveDailyGoal } from '../lib/gamification';

function StreakDetail({ state, onClose, onUpdate }) {
  const [selectedGoal, setSelectedGoal] = useState(state.dailyGoal || "regular");
  const calendar = getStreakCalendar();

  const handleBuyFreeze = () => {
    const result = purchaseStreakFreeze();
    if (result.success) {
      onUpdate();
    } else if (result.reason === "not_enough_gems") {
      alert("Not enough gems! You need 20 gems for a streak freeze.");
    } else if (result.reason === "max_freezes") {
      alert("You already have the maximum 2 streak freezes!");
    }
  };

  const handleGoalChange = (goal) => {
    setSelectedGoal(goal);
    saveDailyGoal(goal);
    onUpdate();
  };

  const statusColors = {
    active: "#10B981",
    frozen: "#4F46E5",
    missed: "#E5E7EB",
    today: "rgba(79,70,229,0.15)",
  };

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 250,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}>
      <div onClick={onClose} style={{
        position: "absolute", inset: 0,
        background: "rgba(0,0,0,0.3)", backdropFilter: "blur(8px)",
      }} />

      <div style={{
        position: "relative", width: "100%", maxWidth: "500px",
        background: "#FFFFFF", borderRadius: "24px 24px 0 0",
        boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
        padding: "0 0 env(safe-area-inset-bottom, 20px)",
        animation: "slideUp 0.3s ease",
        maxHeight: "85vh", overflowY: "auto",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", padding: "12px 0 8px" }}>
          <div style={{ width: "36px", height: "4px", borderRadius: "2px", background: "rgba(0,0,0,0.12)" }} />
        </div>

        {/* Streak count */}
        <div style={{ textAlign: "center", padding: "8px 24px 20px" }}>
          <div style={{ fontSize: "48px", marginBottom: "4px" }}>{"\u{1F525}"}</div>
          <div style={{ fontSize: "36px", fontWeight: 900, color: "#F59E0B" }}>
            {state.currentStreak}
          </div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#6B7280" }}>
            day streak
          </div>
          {state.longestStreak > state.currentStreak && (
            <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "4px" }}>
              Best: {state.longestStreak} days
            </div>
          )}
        </div>

        {/* 30-day calendar */}
        <div style={{ padding: "0 24px 16px" }}>
          <div style={{ fontSize: "12px", fontWeight: 700, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "10px" }}>
            Last 30 Days
          </div>
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(10, 1fr)", gap: "4px",
          }}>
            {calendar.map((day, i) => (
              <div key={i} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: "2px",
              }}>
                <div style={{
                  width: "24px", height: "24px", borderRadius: "6px",
                  background: statusColors[day.status] || "#E5E7EB",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "9px", fontWeight: 700,
                  color: day.status === "active" ? "#fff" : day.status === "frozen" ? "#fff" : "#9CA3AF",
                  border: day.status === "today" ? "1.5px solid #4F46E5" : "none",
                }}>
                  {day.day}
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "12px", marginTop: "8px", justifyContent: "center" }}>
            {[
              { color: "#10B981", label: "Active" },
              { color: "#4F46E5", label: "Frozen" },
              { color: "#E5E7EB", label: "Missed" },
            ].map((legend, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "2px", background: legend.color }} />
                <span style={{ fontSize: "10px", color: "#9CA3AF", fontWeight: 600 }}>{legend.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Streak Freezes */}
        <div style={{ padding: "12px 24px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A2E" }}>
                Streak Freezes {"\u{1F9CA}"}
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                {state.streakFreezes}/2 held — auto-protects your streak
              </div>
            </div>
            <button onClick={handleBuyFreeze} style={{
              padding: "8px 14px", borderRadius: "12px",
              background: state.streakFreezes >= 2 ? "#E5E7EB" : "rgba(124,58,237,0.08)",
              border: state.streakFreezes >= 2 ? "none" : "1px solid rgba(124,58,237,0.15)",
              color: state.streakFreezes >= 2 ? "#9CA3AF" : "#7C3AED",
              fontSize: "12px", fontWeight: 700, cursor: state.streakFreezes >= 2 ? "default" : "pointer",
            }}>
              {state.streakFreezes >= 2 ? "Full" : "Buy (20 \u{1F48E})"}
            </button>
          </div>
        </div>

        {/* Daily Goal */}
        <div style={{ padding: "16px 24px 24px", borderTop: "1px solid rgba(0,0,0,0.04)" }}>
          <div style={{ fontSize: "13px", fontWeight: 700, color: "#1A1A2E", marginBottom: "10px" }}>
            Daily Goal
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
            {Object.entries(DAILY_GOALS).map(([key, goal]) => {
              const isSelected = selectedGoal === key;
              return (
                <button key={key} onClick={() => handleGoalChange(key)} style={{
                  padding: "10px 12px", borderRadius: "14px",
                  background: isSelected ? "rgba(79,70,229,0.06)" : "#F5F5F7",
                  border: isSelected ? "1.5px solid rgba(79,70,229,0.2)" : "1px solid rgba(0,0,0,0.04)",
                  cursor: "pointer", textAlign: "left",
                }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: isSelected ? "#4F46E5" : "#1A1A2E" }}>
                    {goal.label}
                  </div>
                  <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>
                    {goal.emails} emails / {goal.xp} XP
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StreakDetail;
