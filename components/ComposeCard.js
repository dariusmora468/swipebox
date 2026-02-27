'use client';
import { useState, useRef, useEffect } from 'react';

function ComposeCard({ email, mode, onSend, onClose }) {
  // mode: "reply" or "forward"
  const isReply = mode === "reply";
  const isForward = mode === "forward";

  const defaultReplyText = email.aiReply || "Thanks for your email. I'll get back to you shortly.";
  const [replyText, setReplyText] = useState(isReply ? defaultReplyText : "");
  const [isEditing, setIsEditing] = useState(false);
  const [forwardTo, setForwardTo] = useState("");
  const [sending, setSending] = useState(false);
  const textareaRef = useRef(null);
  const toInputRef = useRef(null);

  const subject = isReply
    ? `Re: ${email.subject.replace(/^Re:\s*/i, "")}`
    : `Fwd: ${email.subject.replace(/^Fwd:\s*/i, "")}`;

  useEffect(() => {
    if (isForward && toInputRef.current) {
      toInputRef.current.focus();
    }
  }, [isForward]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      const len = textareaRef.current.value.length;
      textareaRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  const handleSend = async () => {
    if (sending) return;
    if (isForward && !forwardTo.trim()) return;
    setSending(true);
    try {
      await onSend({
        mode,
        email,
        replyText: replyText.trim(),
        forwardTo: isForward ? forwardTo.trim() : undefined,
        subject,
      });
      onClose();
    } catch (err) {
      console.error("Send failed:", err);
      setSending(false);
    }
  };

  const forwardedBody = `\n\n---------- Forwarded message ----------\nFrom: ${email.from} <${email.email}>\nDate: ${email.time}\nSubject: ${email.subject}\n\n${email.body || email.preview || ""}`;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 300,
      background: "rgba(0,0,0,0.35)", backdropFilter: "blur(12px)",
      display: "flex", flexDirection: "column",
      animation: "fadeIn 0.2s ease",
    }}>
      {/* Full-screen compose overlay */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column",
        background: "#FFFFFF",
        animation: "fadeInScale 0.25s ease",
        overflow: "hidden",
      }}>
        {/* Top bar */}
        <div style={{
          padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
        }}>
          <button onClick={onClose} style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "none", border: "none", cursor: "pointer",
            color: "#6B7280", fontSize: "14px", fontWeight: 600, padding: "6px 0",
          }}>
            <span style={{ fontSize: "18px" }}>{"\u2190"}</span> Cancel
          </button>
          <div style={{
            fontSize: "15px", fontWeight: 700, color: "#1A1A2E",
            display: "flex", alignItems: "center", gap: "8px",
          }}>
            <span style={{ fontSize: "16px" }}>{isReply ? "\u21A9" : "\u21AA"}</span>
            {isReply ? "Reply" : "Forward"}
          </div>
          <div style={{ width: "60px" }} />
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0" }}>

          {/* To field */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#9CA3AF", minWidth: "28px" }}>To:</span>
            {isReply ? (
              <div style={{
                padding: "6px 14px", borderRadius: "20px",
                background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.04)",
                fontSize: "13px", color: "#1A1A2E", fontWeight: 500,
              }}>
                {email.from} &lt;{email.email}&gt;
              </div>
            ) : (
              <input
                ref={toInputRef}
                type="email"
                value={forwardTo}
                onChange={(e) => setForwardTo(e.target.value)}
                placeholder="Email address"
                style={{
                  flex: 1, padding: "8px 14px", borderRadius: "12px",
                  border: "1px solid rgba(0,0,0,0.08)", background: "#FAFAFA",
                  fontSize: "14px", color: "#1A1A2E", outline: "none",
                  fontFamily: "inherit",
                }}
              />
            )}
          </div>

          {/* Subject field */}
          <div style={{
            padding: "14px 20px", borderBottom: "1px solid rgba(0,0,0,0.04)",
            display: "flex", alignItems: "center", gap: "10px",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#9CA3AF", minWidth: "28px" }}>Subj:</span>
            <div style={{ fontSize: "14px", color: "#1A1A2E", fontWeight: 600 }}>{subject}</div>
          </div>

          {/* Compose body */}
          <div style={{ padding: "20px" }}>
            {isReply && (
              <>
                {/* AI draft label + edit button */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: "12px",
                }}>
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    fontSize: "11px", fontWeight: 700, color: "#059669",
                    letterSpacing: "0.5px", textTransform: "uppercase",
                  }}>
                    <span>{"\u2728"}</span> AI Draft Reply
                  </div>
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    style={{
                      display: "flex", alignItems: "center", gap: "5px",
                      padding: "6px 14px", borderRadius: "20px",
                      background: isEditing ? "rgba(79,70,229,0.08)" : "#F5F5F7",
                      border: isEditing ? "1px solid rgba(79,70,229,0.15)" : "1px solid rgba(0,0,0,0.06)",
                      color: isEditing ? "#4F46E5" : "#6B7280",
                      fontSize: "12px", fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    <span style={{ fontSize: "14px" }}>{"\u270F\uFE0F"}</span>
                    {isEditing ? "Done Editing" : "Edit"}
                  </button>
                </div>

                {/* Reply text */}
                {isEditing ? (
                  <textarea
                    ref={textareaRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    style={{
                      width: "100%", minHeight: "180px", padding: "16px",
                      borderRadius: "16px", border: "1.5px solid rgba(79,70,229,0.2)",
                      background: "#FAFAFA", fontSize: "14px", lineHeight: 1.7,
                      color: "#1A1A2E", fontFamily: "inherit", resize: "vertical",
                      outline: "none", boxSizing: "border-box",
                    }}
                  />
                ) : (
                  <div style={{
                    padding: "18px", borderRadius: "16px",
                    background: "rgba(16,185,129,0.04)", border: "1px solid rgba(16,185,129,0.1)",
                  }}>
                    <p style={{
                      fontSize: "14px", color: "#374151", lineHeight: 1.7,
                      margin: 0, whiteSpace: "pre-wrap",
                    }}>{replyText}</p>
                  </div>
                )}
              </>
            )}

            {isForward && (
              <>
                {/* Optional note area */}
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Add a note (optional)..."
                  style={{
                    width: "100%", minHeight: "80px", padding: "16px",
                    borderRadius: "16px", border: "1px solid rgba(0,0,0,0.08)",
                    background: "#FAFAFA", fontSize: "14px", lineHeight: 1.7,
                    color: "#1A1A2E", fontFamily: "inherit", resize: "vertical",
                    outline: "none", boxSizing: "border-box",
                    marginBottom: "16px",
                  }}
                />

                {/* Forwarded message content */}
                <div style={{
                  padding: "16px", borderRadius: "16px",
                  background: "#F5F5F7", border: "1px solid rgba(0,0,0,0.04)",
                }}>
                  <div style={{
                    fontSize: "11px", fontWeight: 700, color: "#9CA3AF",
                    letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: "12px",
                  }}>
                    Forwarded Message
                  </div>
                  <div style={{ fontSize: "12px", color: "#6B7280", lineHeight: 1.6, marginBottom: "12px" }}>
                    <div><strong>From:</strong> {email.from} &lt;{email.email}&gt;</div>
                    <div><strong>Date:</strong> {email.time}</div>
                    <div><strong>Subject:</strong> {email.subject}</div>
                  </div>
                  <div style={{
                    borderTop: "1px solid rgba(0,0,0,0.06)", paddingTop: "12px",
                    fontSize: "13px", color: "#374151", lineHeight: 1.7,
                    whiteSpace: "pre-wrap", wordBreak: "break-word",
                  }}>
                    {(email.body || email.preview || "").split("\n").filter(line => line.trim()).map((p, i) => (
                      <p key={i} style={{ margin: "0 0 6px" }}>{p}</p>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Floating Send button */}
        <div style={{
          padding: "16px 20px", paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          borderTop: "1px solid rgba(0,0,0,0.06)",
          background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)",
        }}>
          <button
            onClick={handleSend}
            disabled={sending || (isForward && !forwardTo.trim())}
            style={{
              width: "100%", padding: "16px", borderRadius: "16px",
              border: "none", cursor: sending ? "wait" : "pointer",
              background: (sending || (isForward && !forwardTo.trim()))
                ? "#D1D5DB"
                : "linear-gradient(135deg, #10B981, #059669)",
              color: "#fff", fontSize: "16px", fontWeight: 700,
              boxShadow: (sending || (isForward && !forwardTo.trim()))
                ? "none"
                : "0 4px 16px rgba(16,185,129,0.3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            {sending ? (
              <>{"\u23F3"} Sending...</>
            ) : (
              <>{"\u2709\uFE0F"} Send {isReply ? "Reply" : "Forward"}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ComposeCard;
