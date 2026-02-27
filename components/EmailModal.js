'use client';
import { useState } from 'react';
import { ACTION_ICONS } from '../lib/constants';

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
            {(email.body || email.preview || "").split("\n").filter(line => line.trim()).map((paragraph, i) => (<p key={i} style={{ margin: "0 0 8px", lineHeight: 1.7 }}>{paragraph}</p>))}
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

export default EmailModal;
