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
        position: "absolute", width: "calc(100% - 40px)", maxWidth: "440px", left: "50%",
        cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
        transform: `translateX(-50%) translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? "none" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isTop ? 2 : 1, touchAction: "none", userSelect: "none", ...style,
      }}>
      <div style={{
        background: isTop ? "#FFFFFF" : "#F8F8FA",
        borderRadius: "24px", border: `1px solid ${isTop ? "rgba(0,0,0,0.08)" : "rgba(0,0,0,0.04)"}`,
        boxShadow: isTop ? "0 8px 32px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)" : "0 4px 16px rgba(0,0,0,0.04)",
        backdropFilter: "blur(40px)", overflow: "hidden", position: "relative",
      }}>
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", borderRadius: "24px 24px 0 0", background: `linear-gradient(90deg, transparent, ${email.color || "#4F46E5"}, transparent)`, opacity: isTop ? 0.6 : 0 }} />

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
              background: `linear-gradient(135deg, ${email.color || "#4F46E5"}20, ${email.color || "#4F46E5"}10)`,
              border: `1px solid ${email.color || "#4F46E5"}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: email.color || "#4F46E5", fontWeight: 700, fontSize: "17px", flexShrink: 0,
            }}>{email.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E" }}>{email.from}</span>
                <span style={{ fontSize: "12px", color: "#9CA3AF", flexShrink: 0 }}>{email.time}</span>
              </div>
              <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>{email.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{
              padding: "4px 12px", borderRadius: "8px",
              background: `${email.color || "#6B7280"}08`, border: `1px solid ${email.color || "#6B7280"}15`,
              color: email.color || "#6B7280", fontSize: "11px", fontWeight: 600, letterSpacing: "0.3px", textTransform: "uppercase",
            }}>{email.category}</div>
            {email.previouslyUnsubscribed && (
              <div style={{
                padding: "4px 12px", borderRadius: "8px",
                background: "rgba(124,58,237,0.08)", border: "1px solid rgba(124,58,237,0.15)",
                color: "#7C3AED", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              }}>Previously Unsubscribed</div>
            )}
            {email.suggestUnsubscribe && !email.previouslyUnsubscribed && (
              <div style={{
                padding: "4px 12px", borderRadius: "8px",
                background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.15)",
                color: "#D97706", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
              }}>Swipe \u2193 to Unsub</div>
            )}
            {email.urgency === "high" && (
              <div style={{ padding: "4px 12px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.15)", color: "#EF4444", fontSize: "11px", fontWeight: 600, textTransform: "uppercase" }}>Urgent</div>
            )}
            {email.account && (
              <div style={{ padding: "4px 12px", borderRadius: "8px", background: "rgba(0,0,0,0.03)", border: "1px solid rgba(0,0,0,0.06)", color: "#6B7280", fontSize: "11px", fontWeight: 600 }}>{email.account.split("@")[0]}</div>
            )}
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#1A1A2E", margin: "0 0 10px", lineHeight: 1.35 }}>{email.subject}</h3>
          <p style={{ fontSize: "14px", color: "#6B7280", lineHeight: 1.65, margin: "0 0 16px", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{email.summary || email.preview}</p>

          {/* Smart Action Chips on card */}
          {isTop && email.smartActions && email.smartActions.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {email.smartActions.slice(0, 2).map((action, i) => (
                <div key={i} style={{
                  padding: "5px 10px", borderRadius: "8px",
                  background: "rgba(79, 70, 229, 0.06)", border: "1px solid rgba(79, 70, 229, 0.1)",
                  fontSize: "11px", color: "#4F46E5", fontWeight: 600,
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
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#059669", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.5px" }}>{"\u2728"} AI Draft Reply</div>
              <p style={{ fontSize: "13px", color: "#374151", lineHeight: 1.6, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{email.aiReply}</p>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "8px" }}>Tap card to expand & edit</div>
            </div>
          </div>
        )}

        {!email.aiReply && isTop && (
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ padding: "12px", borderRadius: "14px", background: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.04)", textAlign: "center", fontSize: "13px", color: "#475569" }}>
              No reply needed — tap to view full email
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailCard;
