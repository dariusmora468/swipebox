"use client";
import { useState, useRef, useCallback, useEffect } from "react";

// --- Smart Action Icons ---
const ACTION_ICONS = {
  add_calendar: "\u{1F4C5}",
  set_reminder: "\u23F0",
  save_link: "\u{1F517}",
  track_package: "\u{1F4E6}",
  save_contact: "\u{1F464}",
  follow_up: "\u{1F504}",
};

// --- Snooze Options ---
const SNOOZE_OPTIONS = [
  { label: "Later Today", sublabel: "3 hours", hours: 3 },
  { label: "Tomorrow Morning", sublabel: "9:00 AM", hours: null, tomorrow: true },
  { label: "This Weekend", sublabel: "Saturday 9 AM", hours: null, weekend: true },
  { label: "Next Week", sublabel: "Monday 9 AM", hours: null, nextWeek: true },
];

function getSnoozeTime(option) {
  const now = new Date();
  if (option.hours) {
    return new Date(now.getTime() + option.hours * 60 * 60 * 1000).getTime();
  }
  if (option.tomorrow) {
    const d = new Date(now);
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  if (option.weekend) {
    const d = new Date(now);
    const day = d.getDay();
    const daysUntilSat = (6 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilSat);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  if (option.nextWeek) {
    const d = new Date(now);
    const day = d.getDay();
    const daysUntilMon = (1 - day + 7) % 7 || 7;
    d.setDate(d.getDate() + daysUntilMon);
    d.setHours(9, 0, 0, 0);
    return d.getTime();
  }
  return now.getTime() + 3 * 60 * 60 * 1000; // default 3 hours
}

// --- Snooze Picker Modal ---
function SnoozePicker({ onSelect, onClose }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.15s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "340px",
        background: "rgba(18, 18, 26, 0.97)", backdropFilter: "blur(40px)",
        borderRadius: "20px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", padding: "24px",
        animation: "fadeInScale 0.2s ease",
      }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
          <span style={{ fontSize: "20px" }}>{"\u23F0"}</span>
          <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Snooze Until</h3>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SNOOZE_OPTIONS.map((opt, i) => (
            <button key={i} onClick={() => onSelect(opt)} style={{
              padding: "14px 18px", borderRadius: "14px",
              background: i === 0 ? "rgba(129, 140, 248, 0.1)" : "rgba(255,255,255,0.04)",
              border: i === 0 ? "1px solid rgba(129, 140, 248, 0.25)" : "1px solid rgba(255,255,255,0.06)",
              cursor: "pointer", textAlign: "left", display: "flex",
              justifyContent: "space-between", alignItems: "center",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: "14px", fontWeight: 600, color: i === 0 ? "#a5b4fc" : "#e2e8f0" }}>{opt.label}</span>
              <span style={{ fontSize: "12px", color: "#64748b" }}>{opt.sublabel}</span>
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{
          width: "100%", marginTop: "12px", padding: "12px",
          borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)",
          background: "transparent", color: "#64748b", fontSize: "13px",
          fontWeight: 600, cursor: "pointer",
        }}>Cancel</button>
      </div>
    </div>
  );
}

// --- Action Badge (shows while dragging) ---
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

// --- Full Email Modal ---
function EmailModal({ email, onClose, onSwipe, onForward, onSnooze }) {
  const [editedReply, setEditedReply] = useState(email.aiReply || "");
  const [isEditing, setIsEditing] = useState(false);
  const [forwardTo, setForwardTo] = useState("");
  const [showForward, setShowForward] = useState(false);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto",
        background: "rgba(18, 18, 26, 0.95)", backdropFilter: "blur(40px)",
        borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", animation: "fadeInScale 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${email.color || "#818cf8"}40, ${email.color || "#818cf8"}20)`,
              border: `1px solid ${email.color || "#818cf8"}30`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: email.color || "#818cf8", fontWeight: 700, fontSize: "17px", flexShrink: 0,
            }}>{email.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#f1f5f9" }}>{email.from}</div>
              <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{email.email}</div>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#475569" }}>{email.time}</span>
                {email.account && (
                  <span style={{
                    padding: "1px 8px", borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#64748b", fontSize: "10px", fontWeight: 600,
                  }}>{email.account}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
            color: "#94a3b8", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Tags */}
        <div style={{ padding: "14px 28px 0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{
            padding: "4px 12px", borderRadius: "8px",
            background: `${email.color || "#94a3b8"}15`, border: `1px solid ${email.color || "#94a3b8"}25`,
            color: email.color || "#94a3b8", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.3px", textTransform: "uppercase",
          }}>{email.category}</div>
          {email.urgency === "high" && (
            <div style={{
              padding: "4px 12px", borderRadius: "8px",
              background: "rgba(248,113,113,0.1)", border: "1px solid rgba(248,113,113,0.2)",
              color: "#f87171", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
            }}>Urgent</div>
          )}
        </div>

        {/* Subject & Full Body */}
        <div style={{ padding: "18px 28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#f1f5f9", margin: "0 0 16px", lineHeight: 1.35 }}>
            {email.subject}
          </h2>
          <div style={{
            fontSize: "14px", color: "#cbd5e1", lineHeight: 1.75,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {(email.body || email.preview).split("\n").filter(line => line.trim()).map((paragraph, i) => React.createElement("p", {key: i, style: {margin: "0 0 8px", lineHeight: 1.7}}, paragraph))}
          </div>
        </div>

        {/* Smart Actions */}
        {email.smartActions && email.smartActions.length > 0 && (
          <div style={{ padding: "0 28px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>
              Smart Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {email.smartActions.map((action, i) => (
                <button key={i} onClick={() => alert(`${action.label}: ${action.detail}\n\n(This feature will connect to your calendar/reminders soon!)`)} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px", borderRadius: "14px",
                  background: "rgba(129, 140, 248, 0.06)", border: "1px solid rgba(129, 140, 248, 0.12)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: "18px" }}>{ACTION_ICONS[action.type] || "\u26A1"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#c7d2fe" }}>{action.label}</div>
                    <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{action.detail}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#475569" }}>{"\u2192"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Reply */}
        {email.aiReply && (
          <div style={{ padding: "0 28px 20px" }}>
            <div style={{
              padding: "18px", borderRadius: "16px",
              background: "rgba(52, 211, 153, 0.06)", border: "1px solid rgba(52, 211, 153, 0.15)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#34d399", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                  {"\u2728"} AI Draft Reply
                </span>
              </div>
              {isEditing ? (
                <div>
                  <textarea value={editedReply} onChange={(e) => setEditedReply(e.target.value)}
                    style={{
                      width: "100%", minHeight: "120px", padding: "14px",
                      border: "1px solid rgba(52,211,153,0.2)", borderRadius: "12px",
                      fontSize: "14px", lineHeight: 1.6, resize: "vertical",
                      fontFamily: "inherit", outline: "none", boxSizing: "border-box",
                      background: "rgba(0,0,0,0.2)", color: "#e2e8f0",
                    }} />
                  <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
                    <button onClick={() => { setEditedReply(email.aiReply); setIsEditing(false); }}
                      style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>Reset</button>
                    <button onClick={() => setIsEditing(false)}
                      style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #059669, #34d399)", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Save</button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: "14px", color: "#a7f3d0", lineHeight: 1.65, margin: 0 }}>{editedReply}</p>
                  <button onClick={() => setIsEditing(true)}
                    style={{ marginTop: "12px", padding: "7px 16px", borderRadius: "10px", border: "1px solid rgba(52,211,153,0.2)", background: "transparent", cursor: "pointer", fontSize: "12px", fontWeight: 600, color: "#34d399" }}>Edit Reply</button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Forward Section */}
        {showForward && (
          <div style={{ padding: "0 28px 20px" }}>
            <div style={{ padding: "16px", borderRadius: "14px", background: "rgba(96,165,250,0.06)", border: "1px solid rgba(96,165,250,0.15)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#60a5fa", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Forward Email</div>
              <input
                type="email" value={forwardTo} onChange={(e) => setForwardTo(e.target.value)}
                placeholder="Enter email address..."
                style={{
                  width: "100%", padding: "12px 14px", borderRadius: "10px",
                  border: "1px solid rgba(96,165,250,0.2)", background: "rgba(0,0,0,0.2)",
                  color: "#e2e8f0", fontSize: "14px", fontFamily: "inherit",
                  outline: "none", boxSizing: "border-box",
                }} />
              <div style={{ display: "flex", gap: "8px", marginTop: "10px", justifyContent: "flex-end" }}>
                <button onClick={() => setShowForward(false)}
                  style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#94a3b8" }}>Cancel</button>
                <button onClick={() => { onForward(forwardTo); setShowForward(false); setForwardTo(""); }}
                  style={{ padding: "8px 18px", borderRadius: "10px", border: "none", background: "linear-gradient(135deg, #2563eb, #60a5fa)", color: "#fff", cursor: "pointer", fontSize: "13px", fontWeight: 600 }}>Forward</button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          padding: "0 28px 28px",
          display: "flex", gap: "8px", flexWrap: "wrap",
        }}>
          {email.aiReply ? (
            <button onClick={() => onSwipe("right", editedReply)} style={{
              flex: 1, padding: "12px 16px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #059669, #34d399)",
              color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              minWidth: "100px",
            }}>{"\u2713"} Send Reply</button>
          ) : (
            <button onClick={() => onSwipe("right", null)} style={{
              flex: 1, padding: "12px 16px", borderRadius: "12px", border: "none",
              background: "linear-gradient(135deg, #059669, #34d399)",
              color: "#fff", fontSize: "13px", fontWeight: 700, cursor: "pointer",
              minWidth: "100px",
            }}>{"\u2713"} Done</button>
          )}
          <button onClick={() => onSwipe("left")} style={{
            padding: "12px 16px", borderRadius: "12px",
            border: "1px solid rgba(251,146,60,0.3)", background: "rgba(251,146,60,0.08)",
            color: "#fb923c", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>Mark Read</button>
          <button onClick={() => setShowForward(true)} style={{
            padding: "12px 16px", borderRadius: "12px",
            border: "1px solid rgba(96,165,250,0.3)", background: "rgba(96,165,250,0.08)",
            color: "#60a5fa", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>Forward</button>
          <button onClick={() => onSnooze()} style={{
            padding: "12px 16px", borderRadius: "12px",
            border: "1px solid rgba(129,140,248,0.3)", background: "rgba(129,140,248,0.08)",
            color: "#818cf8", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>Snooze</button>
          <button onClick={() => onSwipe("down")} style={{
            padding: "12px 16px", borderRadius: "12px",
            border: "1px solid rgba(168,85,247,0.3)", background: "rgba(168,85,247,0.08)",
            color: "#a855f7", fontSize: "13px", fontWeight: 700, cursor: "pointer",
          }}>Unsub</button>
        </div>
      </div>
    </div>
  );
}


// --- Unsubscribe Overlay ---
function UnsubscribeOverlay({ url, sender, onClose }) {
  const [loading, setLoading] = useState(true);
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.2s ease",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)",
        background: "rgba(18,18,26,0.95)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px" }}>{"🔕"}</span>
          <div>
            <div style={{ color: "#f1f5f9", fontWeight: 700, fontSize: "14px" }}>Unsubscribe from {sender}</div>
            <div style={{ color: "#64748b", fontSize: "11px", marginTop: "2px" }}>Complete the unsubscribe on this page, then tap Done</div>
          </div>
        </div>
        <button onClick={onClose} style={{
          padding: "10px 20px", borderRadius: "12px",
          background: "rgba(168,85,247,0.15)", border: "1px solid rgba(168,85,247,0.3)",
          color: "#a855f7", fontWeight: 700, fontSize: "14px", cursor: "pointer",
        }}>Done</button>
      </div>
      {loading && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "40px", color: "#64748b" }}>
          Loading unsubscribe page...
        </div>
      )}
      <iframe
        src={url}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          window.open(url, "_blank");
          onClose();
        }}
        style={{
          flex: 1, width: "100%", border: "none",
          background: "#fff", display: loading ? "none" : "block",
        }}
        sandbox="allow-scripts allow-forms allow-same-origin allow-popups"
      />
    </div>
  );
}

// --- Settings Modal ---
function SettingsModal({ accounts, onClose, onRemoveAccount }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "420px",
        background: "rgba(18, 18, 26, 0.97)", backdropFilter: "blur(40px)",
        borderRadius: "24px", border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.6)", padding: "28px",
        animation: "fadeInScale 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <h2 style={{ fontSize: "22px", fontWeight: 800, color: "#f1f5f9", margin: 0 }}>Settings</h2>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)",
            color: "#94a3b8", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Connected Accounts */}
        <div style={{ marginBottom: "24px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, color: "#818cf8", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "14px" }}>
            Connected Inboxes
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {accounts.map((acc, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px", borderRadius: "14px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{
                    width: "36px", height: "36px", borderRadius: "10px",
                    background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2))",
                    border: "1px solid rgba(99,102,241,0.2)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "14px",
                  }}>{"\u{1F4E7}"}</div>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "#e2e8f0" }}>{acc.name || acc.email}</div>
                    <div style={{ fontSize: "12px", color: "#64748b" }}>{acc.email}</div>
                  </div>
                </div>
                {accounts.length > 1 && (
                  <button onClick={() => onRemoveAccount(acc.email)} style={{
                    padding: "6px 14px", borderRadius: "8px",
                    border: "1px solid rgba(248,113,113,0.2)", background: "rgba(248,113,113,0.06)",
                    color: "#f87171", fontSize: "12px", fontWeight: 600, cursor: "pointer",
                  }}>Remove</button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Add Account Button */}
        <a href="/api/auth/gmail" style={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
          padding: "14px", borderRadius: "14px",
          border: "1.5px dashed rgba(255,255,255,0.12)", background: "rgba(255,255,255,0.02)",
          color: "#94a3b8", fontSize: "14px", fontWeight: 600,
          textDecoration: "none", cursor: "pointer", transition: "all 0.2s",
        }}>
          <GoogleIcon /> Add Gmail Account
        </a>

        <div style={{ fontSize: "12px", color: "#475569", marginTop: "16px", textAlign: "center", lineHeight: 1.5 }}>
          Connect multiple Gmail accounts to manage all your inboxes from one place.
        </div>
      </div>
    </div>
  );
}

// --- Swipeable Email Card ---
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
              No reply needed â tap to view full email
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
    <button onClick={onClick} disabled={disabled} title={label}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        width: `${size}px`, height: `${size}px`, borderRadius: "50%",
        border: `1.5px solid ${color}40`, background: hovered ? `${color}20` : "rgba(255,255,255,0.03)",
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
        boxShadow: hovered ? `0 0 24px ${color}30` : "0 4px 12px rgba(0,0,0,0.2)",
        transform: hovered && !disabled ? "scale(1.12)" : "scale(1)",
        opacity: disabled ? 0.4 : 1, backdropFilter: "blur(12px)",
      }}>
      <span style={{ fontSize: size > 50 ? "22px" : "16px", lineHeight: 1 }}>{icon}</span>
    </button>
  );
}

// --- Completion Screen ---
function CompletionScreen({ stats, onRefresh }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 24px", textAlign: "center", animation: "fadeIn 0.5s ease" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(99,102,241,0.2))", border: "1px solid rgba(52,211,153,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px", marginBottom: "24px", animation: "glow 2s ease-in-out infinite" }}>{"\u{1F389}"}</div>
      <h2 style={{ fontSize: "32px", fontWeight: 900, margin: "0 0 8px", letterSpacing: "-0.5px", background: "linear-gradient(135deg, #34d399, #818cf8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>Inbox Zero!</h2>
      <p style={{ fontSize: "15px", color: "#64748b", margin: "0 0 36px" }}>You crushed it. Every email handled.</p>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", width: "100%", maxWidth: "320px", marginBottom: "36px" }}>
        {[
          { label: "Replied", count: stats.sent, color: "#34d399", icon: "\u2192" },
          { label: "Read", count: stats.read, color: "#fb923c", icon: "\u2713" },
          { label: "Snoozed", count: stats.snoozed, color: "#818cf8", icon: "\u23F0" },
          { label: "Unsubbed", count: stats.unsubscribed, color: "#a855f7", icon: "\u{1F515}" },
        ].map((s) => (
          <div key={s.label} style={{ padding: "18px", borderRadius: "16px", background: `${s.color}08`, border: `1px solid ${s.color}15` }}>
            <div style={{ fontSize: "28px", fontWeight: 800, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginTop: "4px" }}>{s.icon} {s.label}</div>
          </div>
        ))}
      </div>
      <button onClick={onRefresh} style={{ padding: "14px 36px", borderRadius: "14px", border: "none", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", color: "#fff", fontSize: "15px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 24px rgba(99,102,241,0.3)" }}>
        Check for New Emails
      </button>
    </div>
  );
}

// --- Loading Screen ---
function LoadingScreen({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", animation: "spin 0.8s linear infinite", marginBottom: "24px" }} />
      <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

// --- Google Icon ---
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

// --- Login Screen ---
function LoginScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center" }}>
      <div style={{ width: "80px", height: "80px", borderRadius: "24px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "36px", marginBottom: "24px", boxShadow: "0 8px 40px rgba(99,102,241,0.4)" }}>{"\u2709"}</div>
      <h1 style={{ fontSize: "36px", fontWeight: 900, color: "#f1f5f9", margin: "0 0 8px", letterSpacing: "-1px", background: "linear-gradient(135deg, #f1f5f9, #94a3b8)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SwipeBox</h1>
      <p style={{ fontSize: "16px", color: "#64748b", margin: "0 0 48px", maxWidth: "320px", lineHeight: 1.6 }}>AI-powered email triage. Swipe through your inbox like never before.</p>
      <a href="/api/auth/gmail" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 36px", borderRadius: "16px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", backdropFilter: "blur(20px)", color: "#f1f5f9", fontSize: "16px", fontWeight: 600, textDecoration: "none", boxShadow: "0 4px 24px rgba(0,0,0,0.2)", cursor: "pointer" }}>
        <GoogleIcon /> Connect Gmail
      </a>
      <p style={{ fontSize: "13px", color: "#475569", marginTop: "28px", maxWidth: "300px", lineHeight: 1.5 }}>Connect your personal and business Gmail accounts. Your emails are processed securely.</p>
    </div>
  );
}

// --- Snooze storage helpers ---
function getSnoozedEmails() {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("swipebox_snoozed") || "[]");
  } catch { return []; }
}

function addSnoozedEmail(emailId, account, snoozeUntil) {
  const snoozed = getSnoozedEmails();
  snoozed.push({ emailId, account, snoozeUntil });
  localStorage.setItem("swipebox_snoozed", JSON.stringify(snoozed));
}

function clearExpiredSnoozes() {
  const snoozed = getSnoozedEmails();
  const now = Date.now();
  const expired = snoozed.filter((s) => s.snoozeUntil <= now);
  const remaining = snoozed.filter((s) => s.snoozeUntil > now);
  localStorage.setItem("swipebox_snoozed", JSON.stringify(remaining));
  return expired;
}

// --- Main App ---
export default function SwipeBox() {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [emails, setEmails] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ sent: 0, read: 0, snoozed: 0, unsubscribed: 0 });
  const [lastAction, setLastAction] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");
  const [actionInProgress, setActionInProgress] = useState(false);
  const [expandedEmail, setExpandedEmail] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showSnoozePicker, setShowSnoozePicker] = useState(false);
  const [pendingSnoozeEmail, setPendingSnoozeEmail] = useState(null);
  const [showUnsubOverlay, setShowUnsubOverlay] = useState(false);
  const [unsubUrl, setUnsubUrl] = useState(null);
  const [unsubSender, setUnsubSender] = useState("");
  const [unsubscribedSenders, setUnsubscribedSenders] = useState(() => {
    if (typeof window !== "undefined") {
      try { return JSON.parse(localStorage.getItem("swipebox_unsubscribed") || "[]"); } catch { return []; }
    }
    return [];
  });

  useEffect(() => { fetchEmails(); }, []);
  useEffect(() => { if (lastAction) { setShowToast(true); const t = setTimeout(() => setShowToast(false), 2500); return () => clearTimeout(t); } }, [lastAction]);

  // Check for expired snoozes on load
  async function checkExpiredSnoozes() {
    const expired = clearExpiredSnoozes();
    if (expired.length > 0) {
      try {
        await fetch("/api/emails/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "unsnooze_batch", snoozeIds: expired }),
        });
      } catch (err) {
        console.error("Unsnooze failed:", err);
      }
    }
  }

  async function fetchEmails() {
    setLoading(true);
    setLoadingMessage("Fetching your emails...");
    try {
      // Check for snoozed emails that need to pop back
      await checkExpiredSnoozes();

      const res = await fetch("/api/emails");
      if (res.status === 401) { setIsAuthenticated(false); setLoading(false); return; }
      setIsAuthenticated(true);
      setLoadingMessage("AI is analyzing your emails...");
      const data = await res.json();
      setEmails(data.emails || []);
      setAccounts(data.accounts || []);
      setHistory([]);
      setStats({ sent: 0, read: 0, snoozed: 0, unsubscribed: 0 });
    } catch (err) { console.error("Error:", err); setIsAuthenticated(false); }
    setLoading(false);
  }

  const handleSwipe = useCallback(async (direction, replyText) => {
    if (emails.length === 0 || actionInProgress) return;
    setExpandedEmail(null);
    const current = emails[0];

    // For snooze, show the picker instead of acting immediately
    if (direction === "up") {
      setPendingSnoozeEmail(current);
      setShowSnoozePicker(true);
      return;
    }

    const actionMap = { right: "send", left: "mark_read", down: "unsubscribe" };
    const statMap = { right: "sent", left: "read", down: "unsubscribed" };

    const rightLabel = replyText ? `Reply sent to ${current.from}` : `Done: ${current.from}`;
    const labelMap = {
      right: rightLabel,
      left: `Marked read: ${current.from}`,
      down: `Unsubscribed: ${current.from}`,
    };

    setEmails((e) => e.slice(1));
    setHistory((h) => [...h, { email: current, direction }]);
    setStats((s) => ({ ...s, [statMap[direction]]: s[statMap[direction]] + 1 }));
    setLastAction({ direction, label: labelMap[direction] });

    setActionInProgress(true);
    try {
      if (direction === "down") {
        // Unsubscribe flow
        const unsubRes = await fetch("/api/emails/unsubscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messageId: current.id, accountEmail: current.account }),
        });
        const unsubData = await unsubRes.json();
        
        // Track the sender as unsubscribed
        const newSender = { email: current.email, name: current.from, date: new Date().toISOString() };
        setUnsubscribedSenders(prev => {
          const updated = [...prev.filter(s => s.email !== current.email), newSender];
          if (typeof window !== "undefined") {
            localStorage.setItem("swipebox_unsubscribed", JSON.stringify(updated));
            // Also set cookie for server-side access
            document.cookie = "swipebox_unsubscribed=" + btoa(JSON.stringify(updated)) + ";path=/;max-age=31536000";
          }
          return updated;
        });
        
        if (unsubData.method === "link" && unsubData.unsubscribeUrl) {
          // Open overlay for manual unsubscribe
          setUnsubUrl(unsubData.unsubscribeUrl);
          setUnsubSender(current.from);
          setShowUnsubOverlay(true);
        }
        // If one-click succeeded or no unsub found, the toast already shows
      } else {
        await fetch("/api/emails/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: actionMap[direction],
            email: current,
            replyText: direction === "right" ? replyText : undefined,
          }),
        });
      }
    } catch (err) { console.error("Action failed:", err); }
    setActionInProgress(false);
  }, [emails, actionInProgress]);

  const handleSnoozeSelect = useCallback(async (option) => {
    const email = pendingSnoozeEmail || emails[0];
    if (!email) return;

    setShowSnoozePicker(false);
    setPendingSnoozeEmail(null);
    setExpandedEmail(null);

    const snoozeUntil = getSnoozeTime(option);
    addSnoozedEmail(email.id, email.account, snoozeUntil);

    setEmails((e) => e.filter((em) => em.id !== email.id));
    setHistory((h) => [...h, { email, direction: "up" }]);
    setStats((s) => ({ ...s, snoozed: s.snoozed + 1 }));
    setLastAction({ direction: "up", label: `Snoozed: ${option.label}` });

    setActionInProgress(true);
    try {
      await fetch("/api/emails/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "snooze", email }),
      });
    } catch (err) { console.error("Snooze failed:", err); }
    setActionInProgress(false);
  }, [pendingSnoozeEmail, emails]);

  const handleForward = useCallback(async (toEmail) => {
    if (!expandedEmail || !toEmail) return;
    try {
      await fetch("/api/emails/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "forward", email: expandedEmail, forwardTo: toEmail }),
      });
      setLastAction({ direction: "right", label: `Forwarded to ${toEmail}` });
    } catch (err) { console.error("Forward failed:", err); }
  }, [expandedEmail]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((h) => h.slice(0, -1));
    setEmails((e) => [last.email, ...e]);
    const statMap = { right: "sent", left: "read", up: "snoozed", down: "unsubscribed" };
    setStats((s) => ({ ...s, [statMap[last.direction]]: s[statMap[last.direction]] - 1 }));
    setShowToast(false);
  }, [history]);

  const handleRemoveAccount = useCallback(async (emailToRemove) => {
    try {
      await fetch("/api/auth/gmail/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailToRemove }),
      });
      setAccounts((a) => a.filter((acc) => acc.email !== emailToRemove));
      setEmails((e) => e.filter((em) => em.account !== emailToRemove));
    } catch (err) { console.error("Remove failed:", err); }
  }, []);

  const actionColors = { right: "#34d399", left: "#fb923c", up: "#818cf8", down: "#a855f7" };

  if (isAuthenticated === null || (isAuthenticated && loading)) {
    return <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}><LoadingScreen message={loadingMessage} /></div>;
  }
  if (isAuthenticated === false) return <LoginScreen />;

  const totalProcessed = stats.sent + stats.read + stats.snoozed + stats.unsubscribed;
  const totalEmails = totalProcessed + emails.length;
  const progressPercent = totalEmails > 0 ? (totalProcessed / totalEmails) * 100 : 0;

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(255,255,255,0.06)", background: "rgba(10, 10, 15, 0.8)", backdropFilter: "blur(20px)", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "36px", height: "36px", borderRadius: "10px", background: "linear-gradient(135deg, #6366f1, #8b5cf6)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: "16px" }}>{"\u2709"}</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: "17px", color: "#f1f5f9", letterSpacing: "-0.3px" }}>SwipeBox</div>
            {accounts.length > 0 && <div style={{ fontSize: "11px", color: "#64748b", marginTop: "1px" }}>{accounts.length} inbox{accounts.length > 1 ? "es" : ""} connected</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {emails.length > 0 && <div style={{ padding: "5px 14px", borderRadius: "20px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>{emails.length} left</div>}
          <button onClick={() => setShowSettings(true)} title="Settings" style={{ width: "32px", height: "32px", borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", fontSize: "16px", cursor: "pointer", lineHeight: 1 }}>{"\u2699"}</button>
        </div>
      </div>

      {/* Enhanced Progress Bar */}
      {totalEmails > 0 && (
        <div style={{ padding: "14px 20px", background: "rgba(255,255,255,0.02)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "16px" }}>{progressPercent === 100 ? "\u{1F389}" : "\u26A1"}</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: progressPercent === 100 ? "#34d399" : "#818cf8" }}>
                {emails.length > 0 ? "Swiping to Inbox Zero" : "Inbox Zero Achieved!"}
              </span>
            </div>
            <span style={{ fontSize: "15px", fontWeight: 800, color: progressPercent === 100 ? "#34d399" : "#f1f5f9" }}>
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div style={{ height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <div style={{
              height: "100%", width: `${progressPercent}%`,
              background: progressPercent === 100 ? "linear-gradient(90deg, #34d399, #6ee7b7)" : "linear-gradient(90deg, #6366f1, #818cf8, #a78bfa, #34d399)",
              backgroundSize: "200% 100%",
              animation: progressPercent < 100 ? "shimmer 2s linear infinite" : "none",
              transition: "width 0.5s ease", borderRadius: "4px",
              boxShadow: `0 0 16px ${progressPercent === 100 ? "rgba(52,211,153,0.5)" : "rgba(99,102,241,0.4)"}`,
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
            <span style={{ fontSize: "12px", color: "#475569" }}>
              {totalProcessed} of {totalEmails} emails processed
            </span>
            {emails.length > 0 && emails.length <= 5 && (
              <span style={{ fontSize: "12px", color: "#818cf8", fontWeight: 600 }}>
                Almost there! {"\u{1F4AA}"}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
        {emails.length > 0 ? (
          <>
            <div style={{ display: "flex", justifyContent: "center", gap: "24px", padding: "14px 20px 8px", fontSize: "11px", color: "#475569", fontWeight: 600, letterSpacing: "0.5px", textTransform: "uppercase" }}>
              <span>{"\u2190"} Mark Read</span><span>{"\u2191"} Snooze</span><span>{"\u2193"} Unsub</span><span>{emails[0]?.aiReply ? "Send" : "Done"} {"\u2192"}</span>
            </div>
            <div style={{ flex: 1, width: "100%", maxWidth: "500px", position: "relative", padding: "8px 20px 20px", minHeight: "500px" }}>
              {emails.slice(0, 2).reverse().map((email, i) => {
                const isTop = i === Math.min(emails.length, 2) - 1;
                return <EmailCard key={email.id} email={email} isTop={isTop} onSwipe={handleSwipe} onTap={(e) => setExpandedEmail(e)} style={{ top: isTop ? "0px" : "8px" }} />;
              })}
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", padding: "16px 20px 36px" }}>
              <ActionButton icon={"\u{1F515}"} label="Unsub" color="#a855f7" size={46} onClick={() => handleSwipe("down")} disabled={actionInProgress} />
              <ActionButton icon={"\u2713"} label="Mark Read" color="#fb923c" size={54} onClick={() => handleSwipe("left")} disabled={actionInProgress} />
              <ActionButton icon={emails[0]?.aiReply ? "\u2197" : "\u2713"} label={emails[0]?.aiReply ? "Send Reply" : "Done"} color="#34d399" size={64} onClick={() => handleSwipe("right", emails[0]?.aiReply)} disabled={actionInProgress} />
              <ActionButton icon={"\u23F0"} label="Snooze" color="#818cf8" size={54} onClick={() => handleSwipe("up")} disabled={actionInProgress} />
              <ActionButton icon={"\u21A9"} label="Undo" color="#64748b" size={46} onClick={handleUndo} disabled={actionInProgress || history.length === 0} />
            </div>
          </>
        ) : (
          <CompletionScreen stats={stats} onRefresh={fetchEmails} />
        )}
      </div>

      {/* Expanded Email Modal */}
      {expandedEmail && (
        <EmailModal
          email={expandedEmail}
          onClose={() => setExpandedEmail(null)}
          onSwipe={(dir, text) => { handleSwipe(dir, text); }}
          onForward={handleForward}
          onSnooze={() => {
            setPendingSnoozeEmail(expandedEmail);
            setShowSnoozePicker(true);
          }}
        />
      )}

      {/* Snooze Picker */}
      {showUnsubOverlay && unsubUrl && (
        <UnsubscribeOverlay
          url={unsubUrl}
          sender={unsubSender}
          onClose={() => { setShowUnsubOverlay(false); setUnsubUrl(null); }}
        />
      )}

      {showSnoozePicker && (
        <SnoozePicker
          onSelect={handleSnoozeSelect}
          onClose={() => { setShowSnoozePicker(false); setPendingSnoozeEmail(null); }}
        />
      )}

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal
          accounts={accounts}
          onClose={() => setShowSettings(false)}
          onRemoveAccount={handleRemoveAccount}
        />
      )}

      {/* Toast */}
      {showToast && lastAction && (
        <div style={{ position: "fixed", bottom: "100px", left: "50%", transform: "translateX(-50%)", padding: "12px 24px", borderRadius: "16px", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.1)", color: "#f1f5f9", fontSize: "14px", fontWeight: 600, display: "flex", alignItems: "center", gap: "10px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", zIndex: 100, animation: "slideUp 0.3s ease", whiteSpace: "nowrap" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: actionColors[lastAction.direction], flexShrink: 0 }} />
          {lastAction.label}
          <button onClick={handleUndo} style={{ marginLeft: "8px", padding: "4px 14px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.15)", background: "transparent", color: "#f1f5f9", fontSize: "12px", fontWeight: 600, cursor: "pointer" }}>Undo</button>
        </div>
      )}
    </div>
  );
}
