"use client";

import { useState, useRef, useCallback, useEffect } from "react";

// --- Action Badge (shows SEND / ARCHIVE / SNOOZE / DELETE while dragging) ---
function ActionBadge({ direction, opacity }) {
  const config = {
    right: { label: "SEND", color: "#22c55e", rotation: "12deg" },
    left: { label: "ARCHIVE", color: "#f97316", rotation: "-12deg" },
    up: { label: "SNOOZE", color: "#6366f1", rotation: "0deg" },
    down: { label: "DELETE", color: "#ef4444", rotation: "0deg" },
  };
  const c = config[direction];
  if (!c) return null;
  return (
    <div
      style={{
        position: "absolute",
        top: direction === "down" ? "auto" : "24px",
        bottom: direction === "down" ? "24px" : "auto",
        left: direction === "right" ? "24px" : direction === "left" ? "auto" : "50%",
        right: direction === "left" ? "24px" : "auto",
        transform: direction === "up" || direction === "down" ? "translateX(-50%)" : `rotate(${c.rotation})`,
        opacity: Math.min(opacity, 1),
        transition: "opacity 0.1s",
        zIndex: 10,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          border: `3px solid ${c.color}`,
          borderRadius: "8px",
          padding: "8px 20px",
          color: c.color,
          fontWeight: 800,
          fontSize: "24px",
          letterSpacing: "2px",
          background: "rgba(255,255,255,0.95)",
        }}
      >
        {c.label}
      </div>
    </div>
  );
}

// --- Swipeable Email Card ---
function EmailCard({ email, isTop, onSwipe, style }) {
  const cardRef = useRef(null);
  const dragStart = useRef(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedReply, setEditedReply] = useState(email.aiReply || "");

  const THRESHOLD = 100;

  const getSwipeDirection = useCallback(() => {
    const absX = Math.abs(offset.x);
    const absY = Math.abs(offset.y);
    if (absX < THRESHOLD && absY < THRESHOLD) return null;
    if (absX > absY) return offset.x > 0 ? "right" : "left";
    return offset.y > 0 ? "down" : "up";
  }, [offset]);

  const getDirectionOpacity = useCallback(
    (dir) => {
      const absX = Math.abs(offset.x);
      const absY = Math.abs(offset.y);
      if (dir === "right" && offset.x > 0) return absX / THRESHOLD;
      if (dir === "left" && offset.x < 0) return absX / THRESHOLD;
      if (dir === "up" && offset.y < 0) return absY / THRESHOLD;
      if (dir === "down" && offset.y > 0) return absY / THRESHOLD;
      return 0;
    },
    [offset]
  );

  const handlePointerDown = (e) => {
    if (!isTop || isEditing) return;
    dragStart.current = { x: e.clientX, y: e.clientY };
    setIsDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging || !dragStart.current) return;
    setOffset({ x: e.clientX - dragStart.current.x, y: e.clientY - dragStart.current.y });
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    const dir = getSwipeDirection();
    if (dir) onSwipe(dir, dir === "right" ? editedReply : null);
    setOffset({ x: 0, y: 0 });
    setIsDragging(false);
    dragStart.current = null;
  };

  const rotation = offset.x * 0.05;
  const scale = isTop ? 1 : 0.95;

  return (
    <div
      ref={cardRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{
        position: "absolute",
        width: "100%",
        maxWidth: "440px",
        left: "50%",
        cursor: isTop ? (isDragging ? "grabbing" : "grab") : "default",
        transform: `translateX(-50%) translateX(${offset.x}px) translateY(${offset.y}px) rotate(${rotation}deg) scale(${scale})`,
        transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
        zIndex: isTop ? 2 : 1,
        touchAction: "none",
        userSelect: "none",
        ...style,
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "20px",
          boxShadow: isTop
            ? "0 20px 60px rgba(0,0,0,0.12), 0 8px 20px rgba(0,0,0,0.08)"
            : "0 10px 30px rgba(0,0,0,0.06)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {isTop && (
          <>
            <ActionBadge direction="right" opacity={getDirectionOpacity("right")} />
            <ActionBadge direction="left" opacity={getDirectionOpacity("left")} />
            <ActionBadge direction="up" opacity={getDirectionOpacity("up")} />
            <ActionBadge direction="down" opacity={getDirectionOpacity("down")} />
          </>
        )}

        <div style={{ padding: "28px 28px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
            <div
              style={{
                width: "52px", height: "52px", borderRadius: "50%",
                background: email.color || "#6366f1",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 700, fontSize: "18px", flexShrink: 0,
              }}
            >
              {email.avatar}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: 700, fontSize: "17px", color: "#0f172a" }}>{email.from}</span>
                <span style={{ fontSize: "13px", color: "#94a3b8", flexShrink: 0 }}>{email.time}</span>
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>{email.email}</div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
            <div
              style={{
                display: "inline-block", padding: "4px 10px", borderRadius: "6px",
                background: `${email.color || "#94a3b8"}15`,
                color: email.color || "#94a3b8",
                fontSize: "12px", fontWeight: 600,
              }}
            >
              {email.category}
            </div>
            {email.account && (
              <div
                style={{
                  display: "inline-block", padding: "4px 10px", borderRadius: "6px",
                  background: "#f1f5f9",
                  color: "#64748b",
                  fontSize: "12px", fontWeight: 600,
                }}
              >
                {email.account}
              </div>
            )}
          </div>

          <h3 style={{ fontSize: "18px", fontWeight: 700, color: "#0f172a", margin: "0 0 10px", lineHeight: 1.3 }}>
            {email.subject}
          </h3>
          <p style={{ fontSize: "15px", color: "#475569", lineHeight: 1.6, margin: "0 0 20px" }}>
            {email.preview}
          </p>
        </div>

        {/* AI Reply — always visible */}
        {email.aiReply && isTop && (
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ padding: "16px", background: "#f0fdf4", borderRadius: "12px", border: "1px solid #bbf7d0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                <span style={{ fontSize: "14px" }}>✨</span>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "#16a34a" }}>AI Reply</span>
              </div>
              {isEditing ? (
                <div>
                  <textarea
                    value={editedReply}
                    onChange={(e) => setEditedReply(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      width: "100%", minHeight: "120px", padding: "12px",
                      border: "1px solid #86efac", borderRadius: "8px",
                      fontSize: "14px", lineHeight: 1.6, resize: "vertical",
                      fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                    }}
                  />
                  <div style={{ display: "flex", gap: "8px", marginTop: "8px", justifyContent: "flex-end" }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); setEditedReply(email.aiReply); setIsEditing(false); }}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#64748b" }}
                    >Reset</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setIsEditing(false); }}
                      style={{ padding: "8px 16px", borderRadius: "8px", border: "none", background: "#22c55e", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}
                    >Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "14px", color: "#15803d", lineHeight: 1.6, margin: 0 }}>{editedReply}</p>
                  <button
                    onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                    style={{ marginTop: "10px", padding: "6px 14px", borderRadius: "8px", border: "1px solid #86efac", background: "transparent", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#16a34a" }}
                  >✏️ Edit Reply</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* No reply needed indicator */}
        {!email.aiReply && isTop && (
          <div style={{ padding: "0 28px 28px" }}>
            <div style={{ padding: "12px", background: "#f8fafc", borderRadius: "12px", border: "1px solid #e2e8f0", textAlign: "center", fontSize: "14px", color: "#94a3b8" }}>
              No reply needed — swipe left to archive or down to delete
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Action Button ---
function ActionButton({ icon, label, color, onClick, size = 56, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        border: `2px solid ${color}`, background: hovered ? color : "#fff",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.2s", boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
        transform: hovered && !disabled ? "scale(1.1)" : "scale(1)",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span style={{ fontSize: size > 50 ? "24px" : "18px", color: hovered ? "#fff" : color, transition: "color 0.2s", lineHeight: 1 }}>
        {icon}
      </span>
    </button>
  );
}

// --- Completion Screen ---
function CompletionScreen({ stats, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", animation: "fadeIn 0.4s ease" }}>
      <div style={{ fontSize: "64px", marginBottom: "20px" }}>🎉</div>
      <h2 style={{ fontSize: "28px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>Inbox Zero!</h2>
      <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 32px" }}>You've processed all your emails</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "32px" }}>
        {[
          { label: "Sent", count: stats.sent, color: "#22c55e", icon: "→" },
          { label: "Archived", count: stats.archived, color: "#f97316", icon: "←" },
          { label: "Snoozed", count: stats.snoozed, color: "#6366f1", icon: "⏰" },
          { label: "Deleted", count: stats.deleted, color: "#ef4444", icon: "🗑" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "16px", borderRadius: "16px", background: `${s.color}08`, border: `1px solid ${s.color}20` }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 600, marginTop: "4px" }}>{s.icon} {s.label}</div>
          </div>
        ))}
      </div>
      <button
        onClick={onRefresh}
        style={{
          padding: "14px 32px", borderRadius: "14px", border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff",
          fontSize: "16px", fontWeight: 700, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
        }}
      >
        Check for New Emails
      </button>
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "3px solid #e2e8f0", borderTopColor: "#6366f1", animation: "spin 0.8s linear infinite", marginBottom: "24px" }} />
      <p style={{ fontSize: "16px", color: "#64748b", fontWeight: 500 }}>{message}</p>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// --- Google Icon SVG ---
function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}
// --- Login Screen (no accounts connected yet) ---
function LoginScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "20px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "36px", marginBottom: "24px", boxShadow: "0 8px 32px rgba(99,102,241,0.3)" }}>
        ✉
      </div>
      <h1 style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", margin: "0 0 8px" }}>SwipeBox</h1>
      <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 40px", maxWidth: "300px", lineHeight: 1.5 }}>
        AI-powered email triage. Swipe through your inbox like never before.
      </p>
      <a
        href="/api/auth/gmail"
        style={{
          display: "flex", alignItems: "center", gap: "12px",
          padding: "16px 32px", borderRadius: "14px", border: "1px solid #e2e8f0",
          background: "#fff", color: "#0f172a", fontSize: "16px", fontWeight: 600,
          textDecoration: "none", boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
          cursor: "pointer", transition: "all 0.2s",
        }}
      >
        <GoogleIcon />
        Connect Gmail
      </a>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginTop: "24px", maxWidth: "280px", lineHeight: 1.4 }}>
        Connect your personal and business Gmail accounts. Your emails are processed securely.
      </p>
    </div>
  );
}
// --- Main App ---
export default function SwipeBox() {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // null = loading
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]); // connected Gmail accounts
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ sent: 0, archived: 0, snoozed: 0, deleted: 0 });
  const [lastAction, setLastAction] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [actionInProgress, setActionInProgress] = useState(false);

  // Check auth and fetch emails on mount
  useEffect(() => {
    fetchEmails();
  }, []);

  useEffect(() => {
    if (lastAction) {
      setShowToast(true);
      const t = setTimeout(() => setShowToast(false), 2500);
      return () => clearTimeout(t);
    }
  }, [lastAction]);

  async function fetchEmails() {
    setLoading(true);
    setLoadingMessage("Fetching your emails...");

    try {
      const res = await fetch("/api/emails");

      if (res.status === 401) {
        setIsAuthenticated(false);
        setLoading(false);
        return;
      }

      setIsAuthenticated(true);
      setLoadingMessage("AI is reading your emails...");

      const data = await res.json();
      setEmails(data.emails || []);
      setAccounts(data.accounts || []);
      setHistory([]);
      setStats({ sent: 0, archived: 0, snoozed: 0, deleted: 0 });
    } catch (err) {
      console.error("Error:", err);
      setIsAuthenticated(false);
    }

    setLoading(false);
  }

  const handleSwipe = useCallback(
    async (direction, replyText) => {
      if (emails.length === 0 || actionInProgress) return;

      const current = emails[0];
      const actionMap = { right: "send", left: "archive", up: "snooze", down: "delete" };
      const statMap = { right: "sent", left: "archived", up: "snoozed", down: "deleted" };
      const labelMap = {
        right: `Reply sent to ${current.from}`,
        left: `Archived: ${current.from}`,
        up: `Snoozed: ${current.from}`,
        down: `Deleted: ${current.from}`,
      };

      // Optimistic update — remove card immediately
      setEmails((e) => e.slice(1));
      setHistory((h) => [...h, { email: current, direction }]);
      setStats((s) => ({ ...s, [statMap[direction]]: s[statMap[direction]] + 1 }));
      setLastAction({ direction, label: labelMap[direction] });

      // Execute action in background
      setActionInProgress(true);
      try {
        await fetch("/api/emails/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionMap[direction],
            email: current,
            replyText: direction === "right" ? replyText : undefined,
          }),
        });
      } catch (err) {
        console.error("Action failed:", err);
      }
      setActionInProgress(false);
    },
    [emails, actionInProgress]
  );

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setEmails((e) => [last.email, ...e]);
    const statMap = { right: "sent", left: "archived", up: "snoozed", down: "deleted" };
    setStats((s) => ({ ...s, [statMap[last.direction]]: s[statMap[last.direction]] - 1 }));
    setShowToast(false);
  }, [history]);

  const actionColors = { right: "#22c55e", left: "#f97316", up: "#6366f1", down: "#ef4444" };
  // --- Render ---
  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <LoadingScreen message={loadingMessage} />
      </div>
    );
  }

  if (isAuthenticated === false) {
    return <LoginScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e8f0", background: "rgba(255,255,255,0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "18px" }}>✉</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "18px", color: "#0f172a", letterSpacing: "-0.3px" }}>SwipeBox</div>
            {accounts.length > 0 && (
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "1px" }}>
                {accounts.map((a) => a.email.split("@")[0]).join(" + ")}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {emails.length > 0 && (
            <div style={{ padding: "6px 14px", borderRadius: "20px", background: "#f1f5f9", fontSize: "14px", fontWeight: 700, color: "#475569" }}>
              {emails.length} left
            </div>
          )}
          <a href="/api/auth/gmail" title="Add another Gmail account"
            style={{
              width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid #e2e8f0",
              background: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
              color: "#94a3b8", fontSize: "18px", textDecoration: "none", cursor: "pointer",
              lineHeight: 1,
            }}>+</a>
        </div>
      </div>

      {/* Progress bar */}
      {emails.length > 0 && (
        <div style={{ height: "3px", background: "#e2e8f0" }}>
          <div style={{
            height: "100%",
            width: `${(stats.sent + stats.archived + stats.snoozed + stats.deleted) / ((stats.sent + stats.archived + stats.snoozed + stats.deleted) + emails.length) * 100}%`,
            background: "linear-gradient(90deg, #6366f1, #22c55e)",
            transition: "width 0.4s ease", borderRadius: "0 4px 4px 0",
          }} />
        </div>
      )}
      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {emails.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", padding: "16px 20px 8px", fontSize: "12px", color: "#94a3b8", fontWeight: 500 }}>
              <span>← Archive</span><span>↑ Snooze</span><span>↓ Delete</span><span>Send →</span>
            </div>

            <div style={{ flex: 1, width: "100%", maxWidth: "500px", position: "relative", padding: "8px 20px 20px", minHeight: "500px" }}>
              {emails.slice(0, 2).reverse().map((email, i) => {
                const isTop = i === Math.min(emails.length, 2) - 1;
                return <EmailCard key={email.id} email={email} isTop={isTop} onSwipe={handleSwipe} style={{ top: isTop ? "0px" : "8px" }} />;
              })}
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "16px", padding: "16px 20px 32px" }}>
              <ActionButton icon="🗑" label="Delete" color="#ef4444" size={48} onClick={() => handleSwipe("down")} disabled={actionInProgress} />
              <ActionButton icon="📦" label="Archive" color="#f97316" size={56} onClick={() => handleSwipe("left")} disabled={actionInProgress} />
              <ActionButton icon="✓" label="Send Reply" color="#22c55e" size={64} onClick={() => handleSwipe("right", emails[0]?.aiReply)} disabled={actionInProgress} />
              <ActionButton icon="⏰" label="Snooze" color="#6366f1" size={56} onClick={() => handleSwipe("up")} disabled={actionInProgress} />
              <ActionButton icon="↩" label="Undo" color="#94a3b8" size={48} onClick={handleUndo} disabled={actionInProgress} />
            </div>
          </>
        ) : (
          <CompletionScreen stats={stats} onRefresh={fetchEmails} />
        )}
      </div>

      {/* Toast notification */}
      {showToast && lastAction && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: "14px", background: "#0f172a", color: "#fff", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.2)", zIndex: 100, animation: "slideUp 0.3s ease", whiteSpace: "nowrap" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: actionColors[lastAction.direction], flexShrink: 0 }} />
          {lastAction.label}
          <button onClick={handleUndo} style={{ marginLeft: "8px", padding: "4px 12px", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.2)", background: "transparent", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}>Undo</button>
        </div>
      )}
    </div>
  );
}
