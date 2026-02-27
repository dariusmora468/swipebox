'use client';
import { useState, useCallback, useRef } from 'react';
import { ACTION_ICONS } from '../lib/constants';
import ActionBadge from './ActionBadge';

function EmailCard({ email, isTop, onSwipe, onTap, style }) {
  const cardRef = useRef(null);
  const dragStart = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [hasMoved, setHasMoved] = useState(false);
  const THRESHOLD = 100;

  const getSwipeDirection = useCallback(() => {
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (absX < THRESHOLD && absY < THRESHOLD) return null;
    if (absX > absY) return offset.x > 0 ? "right" : "left";
    return offset.y > 0 ? "down" : "up";
  }, [offset]);

  const getDirectionOpacity = useCallback((dir) => {
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (dir === "right" && offset.x > 0) return absX / THRESHOLD;
    if (dir === "left" && offset.x < 0) return absX / THRESHOLD;
    if (dir === "up" && offset.y < 0) return absY / THRESHOLD;
    if (dir === "down" && offset.y > 0) return absY / THRESHOLD;
    return 0;
  }, [offset]);

  const handlePointerDown = (e) => {
    if (!isTop) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    setHasMoved(false);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) setHasMoved(true);
    setOffset({ x: dx, y: dy });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    const dir = getSwipeDirection();
    if (dir) {
      if (dir === "right") {
        onSwipe(dir, email.aiReply || null);
      } else {
        onSwipe(dir, null);
      }
    } else if (!hasMoved && isTop) {
      onTap(email);
    }
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStart.current = null;
  };

  const rotation = offset.x * 0.04;
  const scale = isTop ? 1 : 0.96;

  return (
    <div ref={cardRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
      style={{
        position: "absolute", width: "100%", maxWidth: "440px", left: "50%",
        cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
        transform: `translateX(-50%) translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isTop ? 2 : 1, touchAction: "none", userSelect: "none", ...style,
      }}>
      <div style={{
        background: `rgba(255, 255, 255, ${isTop ? 0.06 : 0.03})`,
        borderRadius: "24px", border: `1px solid rgba(255, 255, 255, ${isTop ? 0.1 : 0.05})`,
        boxShadow: isTop ? "0 20px 60px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 10px 30px rgba(0,0,0,0.2)",
        backdropFilter: "blur(40px)", overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "2px", background: `linear-gradient(90deg, transparent, ${email.color || "#818cf8"}, transparent)`, opacity: isTop ? 0.6 : 0 }} />

        {isTop && (
          <>
            <ActionBadge direction="right" opacity={getDirectionOpacity("right")} hasReply={!!email.aiReply} />
            <ActionBadge direction="left" opacity={getDirectionOpacity("left")} />
            <ActionBadge direction="up" opacity={getDirectionOpacity("up")} />
            <ActionBadge direction="down" opacity={getDirectionOpacity("down")} />
          </>
        )}

        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${email.color || "#818cf8"}40, ${email.color || "#818cf8"}20)`,
              border: `1px solid ${email.color || "#818cf8"}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: email.color || "#818cf8", fontWeight: 700, fontSize: "17px", flexShrink: 0,
            }}>{email.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#f1f5f9" }}>{email.from}</span>
                <span style={{ fontSize: "12px", color: "#64748b", flexShrink: 0 }}>{email.time}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{email.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{
              padding: "4px 12px", borderRadius: "8px",
              background: `${email.color || "#94a3b8"}15`, border: `1px solid ${email.color || "#94a3b8"}25`,
              color: email.color || "#94a3b8", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase",
            }}>{email.category}</div>
            {email.previouslyUnsubscribed && (
              <div style={{
                padding: "4px 12px", borderRadius: "8px",
                background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)",
                color: "#a855f7", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              }}>Previously Unsubscribed</div>
            )}
            {email.suggestUnsubscribe && !email.previouslyUnsubscribed && (
              <div style={{
                padding: "4px 12px", borderRadius: "8px",
                background: "rgba(251,146,60,0.1)", border: "1px solid rgba(251,146,60,0.2)",
                color: "#fb923c", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              }}>Swipe \u2193 to Unsub</div>
            )}
            {email.urgency === "high" && (
              <div style={{ padding: "4px 12px", borderRadius: "8px", background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Urgent</div>
            )}
            {email.account && (
              <div style={{ padding: "4px 12px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8", fontSize: "11px", fontWeight: 600 }}>{email.account.split("@")[0]}</div>
            )}
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 10px", lineHeight: 1.35 }}>{email.subject}</h3>
          <p style={{ fontSize: "14px", color: "#94a3b8", lineHeight: 1.65, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{email.summary || email.preview}</p>

          {/* Smart Action Chips on card */}
          {isTop && email.smartActions && email.smartActions.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {email.smartActions.slice(0, 2).map((action, i) => (
                <div key={i} style={{
                  padding: "5px 10px", borderRadius: "8px",
                  background: "rgba(129, 140, 248, 0.08)", border: "1px solid rgba(129, 140, 248, 0.15)",
                  fontSize: "11px", color: "#a5b4fc", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  <span>{ACTION_ICONS[action.type] || "\u26A1"}</span> {action.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Reply preview on card */}
        {email.aiReply && isTop && (
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ padding: "14px", borderRadius: "14px", background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.12)" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#34d399", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{"\u2728"} AI Draft Reply</div>
              <p style={{ fontSize: "13px", color: "#a7f3d0", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{email.aiReply}</p>
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>Tap card to expand & edit</div>
            </div>
          </div>
        )}

        {!email.aiReply && isTop && (
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", textAlign: "center", fontSize: "13px", color: "#475569" }}>
              No reply needed — tap to view full email
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailCard;
