'use client';
import { ACTION_ICONS } from '../lib/constants';

function EmailModal({ email, onClose }) {

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(0,0,0,0.3)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto",
        background: "#FFFFFF", backdropFilter: "blur(20px)",
        borderRadius: "24px", border: "1px solid rgba(0,0,0,0.06)",
        boxShadow: "0 24px 80px rgba(0,0,0,0.12), 0 8px 24px rgba(0,0,0,0.06)", animation: "fadeInScale 0.3s ease",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 28px 0", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
            <div style={{
              width: "48px", height: "48px", borderRadius: "14px",
              background: `linear-gradient(135deg, ${email.color || "#4F46E5"}15, ${email.color || "#4F46E5"}08)`,
              border: `1px solid ${email.color || "#4F46E5"}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: email.color || "#4F46E5", fontWeight: 700, fontSize: "17px", flexShrink: 0,
            }}>{email.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: "16px", color: "#1A1A2E" }}>{email.from}</div>
              <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>{email.email}</div>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{email.time}</span>
                {email.account && (
                  <span style={{
                    padding: "1px 8px", borderRadius: "6px",
                    background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
                    color: "#9CA3AF", fontSize: "10px", fontWeight: 600,
                  }}>{email.account}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(0,0,0,0.08)", background: "#F5F5F7",
            color: "#6B7280", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Tags */}
        <div style={{ padding: "14px 28px 0", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <div style={{
            padding: "4px 12px", borderRadius: "8px",
            background: `${email.color || "#6B7280"}08`, border: `1px solid ${email.color || "#6B7280"}15`,
            color: email.color || "#6B7280", fontSize: "11px", fontWeight: 600,
            letterSpacing: "0.3px", textTransform: "uppercase",
          }}>{email.category}</div>
          {email.urgency === "high" && (
            <div style={{
              padding: "4px 12px", borderRadius: "8px",
              background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.12)",
              color: "#EF4444", fontSize: "11px", fontWeight: 600, textTransform: "uppercase",
            }}>Urgent</div>
          )}
        </div>

        {/* Subject & Full Body */}
        <div style={{ padding: "18px 28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1A1A2E", margin: "0 0 16px", lineHeight: 1.35 }}>
            {email.subject}
          </h2>
          <div style={{
            fontSize: "14px", color: "#374151", lineHeight: 1.75,
            whiteSpace: "pre-wrap", wordBreak: "break-word",
          }}>
            {(email.body || email.preview || "").split("\n").filter(line => line.trim()).map((paragraph, i) => (<p key={i} style={{ margin: "0 0 8px", lineHeight: 1.7 }}>{paragraph}</p>))}
          </div>
        </div>

        {/* Smart Actions */}
        {email.smartActions && email.smartActions.length > 0 && (
          <div style={{ padding: "0 28px 16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "#4F46E5", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "10px" }}>
              Smart Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {email.smartActions.map((action, i) => (
                <button key={i} onClick={() => alert(`${action.label}: ${action.detail}\n\n(This feature will connect to your calendar/reminders soon!)`)} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px", borderRadius: "14px",
                  background: "rgba(79, 70, 229, 0.04)", border: "1px solid rgba(79, 70, 229, 0.08)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: "18px" }}>{ACTION_ICONS[action.type] || "\u26A1"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#4F46E5" }}>{action.label}</div>
                    <div style={{ fontSize: "12px", color: "#9CA3AF", marginTop: "2px" }}>{action.detail}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#9CA3AF" }}>{"\u2192"}</span>
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
              background: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                <span style={{ fontSize: "12px", fontWeight: 700, color: "#059669", letterSpacing: "0.5px", textTransform: "uppercase" }}>
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
                      style={{ padding: "8px 18px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.05)", cursor: "pointer", fontSize: "13px", fontWeight: 600, color: "#6B7280" }}>Reset</button>
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

      </div>
    </div>
  );
}

export default EmailModal;
