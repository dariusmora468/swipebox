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
  const [swipedAway, setSwipedAway] = useState(false);
  const THRESHOLD = 100;
  const FLY_DISTANCE = 600;

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
    if (!isTop || swipedAway) return;
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
      // Fly card off-screen in swipe direction BEFORE calling the action
      const flyTarget = {
        x: dir === "right" ? FLY_DISTANCE : dir === "left" ? -FLY_DISTANCE : 0,
        y: dir === "up" ? -FLY_DISTANCE : dir === "down" ? FLY_DISTANCE : 0,
      };
      setOffset(flyTarget);
      setSwipedAway(true);
      setIsDragging(false);
      dragStart.current = null;
      // Fire the action after the card starts flying away
      if (dir === "right") {
        onSwipe(dir, email.aiReply || null);
      } else {
        onSwipe(dir, null);
      }
    } else {
      if (!hasMoved && isTop) {
        onTap(email);
      }
      setOffset({ x: 0, y: 0 });
      setIsDragging(false);
      dragStart.current = null;
    }
  };

  const rotation = offset.x * 0.04;
  const scale = isTop ? 1 : 0.96;

  // Warm editorial color mapping
  const warmColor = email.color || "#A0775A";

  return (
    <div ref={cardRef} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}
      style={{
        position: "absolute", width: "calc(100% - 40px)", maxWidth: "440px", left: "50%",
        cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
        transform: `translateX(-50%) translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? "none" : swipedAway ? "transform 0.35s ease-in" : "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        opacity: swipedAway ? 0 : 1,
        pointerEvents: swipedAway ? "none" : "auto",
        zIndex: isTop ? 2 : 1, touchAction: "none", userSelect: "none", ...style,
      }}>
      <div style={{
        background: isTop ? "#FDFBF9" : "#F5F0EB",
        borderRadius: "20px",
        border: `1px solid ${isTop ? "rgba(120,100,80,0.1)" : "rgba(120,100,80,0.05)"}`,
        boxShadow: isTop
          ? "0 1px 3px rgba(60,45,30,0.04), 0 6px 24px rgba(60,45,30,0.08)"
          : "0 2px 12px rgba(60,45,30,0.04)",
        overflow: "hidden", position: "relative",
      }}>
        {/* Subtle top accent line */}
        <div style={{
          position: "absolute", top: 0, left: "20%", right: "20%", height: "2px",
          borderRadius: "0 0 2px 2px",
          background: `linear-gradient(90deg, transparent, ${warmColor}40, transparent)`,
          opacity: isTop ? 0.6 : 0,
        }} />

        {isTop && (
          <>
            <ActionBadge direction="right" opacity={getDirectionOpacity("right")} hasReply={!!email.aiReply} />
            <ActionBadge direction="left" opacity={getDirectionOpacity("left")} />
            <ActionBadge direction="up" opacity={getDirectionOpacity("up")} />
            <ActionBadge direction="down" opacity={getDirectionOpacity("down")} />
          </>
        )}

        <div style={{ padding: "26px 24px 0" }}>
          {/* Sender row */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "18px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: `${warmColor}10`,
              border: `1px solid ${warmColor}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: warmColor, fontWeight: 600, fontSize: "16px", flexShrink: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>{email.avatar}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{
                  fontWeight: 600, fontSize: "15px", color: "#2C2520",
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>{email.from}</span>
                <span style={{ fontSize: "11px", color: "#B8A99A", flexShrink: 0 }}>{email.time}</span>
              </div>
              <div style={{ fontSize: "11px", color: "#9C8E82", marginTop: "2px" }}>{email.email}</div>
            </div>
          </div>

          {/* Tags */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "14px", flexWrap: "wrap" }}>
            <div style={{
              padding: "3px 10px", borderRadius: "6px",
              background: "rgba(120,100,80,0.05)", border: "1px solid rgba(120,100,80,0.08)",
              color: "#6B5E54", fontSize: "10px", fontWeight: 600,
              letterSpacing: "0.5px", textTransform: "uppercase",
            }}>{email.category}</div>
            {email.previouslyUnsubscribed && (
              <div style={{
                padding: "3px 10px", borderRadius: "6px",
                background: "rgba(176,112,112,0.06)", border: "1px solid rgba(176,112,112,0.1)",
                color: "#B07070", fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
              }}>Previously Unsubscribed</div>
            )}
            {email.suggestUnsubscribe && !email.previouslyUnsubscribed && (
              <div style={{
                padding: "3px 10px", borderRadius: "6px",
                background: "rgba(184,150,62,0.06)", border: "1px solid rgba(184,150,62,0.1)",
                color: "#B8963E", fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
              }}>{"\u2193"} Unsub</div>
            )}
            {email.urgency === "high" && (
              <div style={{
                padding: "3px 10px", borderRadius: "6px",
                background: "rgba(176,112,112,0.06)", border: "1px solid rgba(176,112,112,0.1)",
                color: "#B07070", fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
              }}>Urgent</div>
            )}
            {email.account && (
              <div style={{
                padding: "3px 10px", borderRadius: "6px",
                background: "rgba(120,100,80,0.04)", border: "1px solid rgba(120,100,80,0.06)",
                color: "#9C8E82", fontSize: "10px", fontWeight: 600,
              }}>{email.account.split("@")[0]}</div>
            )}
          </div>

          {/* Subject */}
          <h3 style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: "17px", fontWeight: 700, color: "#2C2520",
            margin: "0 0 10px", lineHeight: 1.45, letterSpacing: "0.1px",
          }}>{email.subject}</h3>

          {/* Summary */}
          <p style={{
            fontSize: "13.5px", color: "#6B5E54", lineHeight: 1.7, margin: "0 0 16px",
            display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>{email.summary || email.preview}</p>

          {/* Smart Action Chips */}
          {isTop && email.smartActions && email.smartActions.length > 0 && (
            <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
              {email.smartActions.slice(0, 2).map((action, i) => (
                <div key={i} style={{
                  padding: "4px 10px", borderRadius: "6px",
                  background: "rgba(160,119,90,0.06)", border: "1px solid rgba(160,119,90,0.08)",
                  fontSize: "10px", color: "#A0775A", fontWeight: 600,
                  display: "flex", alignItems: "center", gap: "4px",
                }}>
                  <span>{ACTION_ICONS[action.type] || "\u2022"}</span> {action.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* AI Reply preview */}
        {email.aiReply && isTop && (
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{
              padding: "14px", borderRadius: "12px",
              background: "rgba(122,140,110,0.06)", border: "1px solid rgba(122,140,110,0.1)",
            }}>
              <div style={{
                fontSize: "10px", fontWeight: 600, color: "#7A8C6E", marginBottom: "8px",
                textTransform: "uppercase", letterSpacing: "0.8px",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>AI Draft Reply</div>
              <p style={{ fontSize: "13px", color: "#4A433C", lineHeight: 1.65, margin: 0, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{email.aiReply}</p>
              <div style={{ fontSize: "10px", color: "#B8A99A", marginTop: "8px", fontStyle: "italic" }}>Tap card to expand & edit</div>
            </div>
          </div>
        )}

        {!email.aiReply && isTop && (
          <div style={{ padding: "0 24px 24px" }}>
            <div style={{
              padding: "12px", borderRadius: "12px",
              background: "rgba(120,100,80,0.03)", border: "1px solid rgba(120,100,80,0.06)",
              textAlign: "center", fontSize: "12px", color: "#9C8E82", fontStyle: "italic",
            }}>
              No reply needed — tap to view full email
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmailCard;
