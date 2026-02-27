'use client';
import { useRef, useEffect, useState } from 'react';
import { ACTION_ICONS } from '../lib/constants';

function EmailHtmlBody({ html }) {
  const iframeRef = useRef(null);
  const [iframeHeight, setIframeHeight] = useState(300);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe || !html) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    // Write the HTML into the sandboxed iframe
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          * { box-sizing: border-box; }
          body {
            margin: 0; padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px; line-height: 1.65;
            color: #4A433C;
            word-break: break-word;
            overflow-wrap: break-word;
            -webkit-text-size-adjust: 100%;
          }
          img { max-width: 100%; height: auto; border-radius: 6px; }
          a { color: #A0775A; text-decoration: underline; }
          table { max-width: 100% !important; width: 100% !important; }
          td, th { word-break: break-word; }
          pre, code { white-space: pre-wrap; word-break: break-all; overflow-x: auto; max-width: 100%; }
          h1, h2, h3, h4 { color: #2C2520; margin: 0.8em 0 0.4em; }
          blockquote { border-left: 3px solid #D4C8BC; margin: 12px 0; padding: 8px 16px; color: #6B5E54; }
          hr { border: none; border-top: 1px solid #EDE8E2; margin: 16px 0; }
        </style>
      </head>
      <body>${html}</body>
      </html>
    `);
    doc.close();

    // Resize iframe to fit content
    const resizeObserver = new ResizeObserver(() => {
      const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 300;
      setIframeHeight(Math.min(h + 10, 2000));
    });

    // Also check after images load
    const checkHeight = () => {
      const h = doc.documentElement?.scrollHeight || doc.body?.scrollHeight || 300;
      setIframeHeight(Math.min(h + 10, 2000));
    };

    setTimeout(checkHeight, 100);
    setTimeout(checkHeight, 500);
    setTimeout(checkHeight, 1500);

    if (doc.body) {
      resizeObserver.observe(doc.body);
    }

    return () => resizeObserver.disconnect();
  }, [html]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-same-origin"
      style={{
        width: "100%", height: `${iframeHeight}px`,
        border: "none", overflow: "hidden",
        background: "transparent",
      }}
      title="Email content"
    />
  );
}

function EmailModal({ email, onClose, onReply, onForward }) {

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 200,
      background: "rgba(44,37,32,0.25)", backdropFilter: "blur(12px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px", animation: "fadeIn 0.2s ease",
    }} onClick={onClose}>
      <div style={{
        width: "100%", maxWidth: "520px", maxHeight: "85vh", overflowY: "auto",
        background: "#FDFBF9",
        borderRadius: "20px", border: "1px solid rgba(120,100,80,0.1)",
        boxShadow: "0 24px 80px rgba(44,37,32,0.15), 0 8px 24px rgba(44,37,32,0.08)",
        animation: "fadeInScale 0.3s ease",
        paddingBottom: "80px", position: "relative",
      }} onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "24px 24px 0", display: "flex", justifyContent: "space-between", alignItems: "start" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px", flex: 1 }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px",
              background: `${email.color || "#A0775A"}10`,
              border: `1px solid ${email.color || "#A0775A"}12`,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: email.color || "#A0775A", fontWeight: 600, fontSize: "16px", flexShrink: 0,
              fontFamily: "'Playfair Display', Georgia, serif",
            }}>{email.avatar}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontWeight: 600, fontSize: "15px", color: "#2C2520",
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>{email.from}</div>
              <div style={{ fontSize: "11px", color: "#9C8E82", marginTop: "2px" }}>{email.email}</div>
              <div style={{ display: "flex", gap: "6px", marginTop: "4px", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#B8A99A" }}>{email.time}</span>
                {email.account && (
                  <span style={{
                    padding: "1px 8px", borderRadius: "6px",
                    background: "rgba(120,100,80,0.04)", border: "1px solid rgba(120,100,80,0.08)",
                    color: "#9C8E82", fontSize: "10px", fontWeight: 600,
                  }}>{email.account}</span>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: "32px", height: "32px", borderRadius: "10px",
            border: "1px solid rgba(120,100,80,0.1)", background: "rgba(120,100,80,0.04)",
            color: "#9C8E82", fontSize: "16px", cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center",
          }}>{"\u2715"}</button>
        </div>

        {/* Tags */}
        <div style={{ padding: "14px 24px 0", display: "flex", gap: "6px", flexWrap: "wrap" }}>
          <div style={{
            padding: "3px 10px", borderRadius: "6px",
            background: "rgba(120,100,80,0.05)", border: "1px solid rgba(120,100,80,0.08)",
            color: "#6B5E54", fontSize: "10px", fontWeight: 600,
            letterSpacing: "0.5px", textTransform: "uppercase",
          }}>{email.category}</div>
          {email.urgency === "high" && (
            <div style={{
              padding: "3px 10px", borderRadius: "6px",
              background: "rgba(176,112,112,0.06)", border: "1px solid rgba(176,112,112,0.1)",
              color: "#B07070", fontSize: "10px", fontWeight: 600, textTransform: "uppercase",
            }}>Urgent</div>
          )}
        </div>

        {/* Subject & Full Body */}
        <div style={{ padding: "18px 24px" }}>
          <h2 style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontSize: "20px", fontWeight: 600, color: "#2C2520",
            margin: "0 0 16px", lineHeight: 1.4,
          }}>
            {email.subject}
          </h2>

          {/* Render HTML body if available, otherwise plain text */}
          {email.bodyHtml ? (
            <EmailHtmlBody html={email.bodyHtml} />
          ) : (
            <div style={{
              fontSize: "14px", color: "#4A433C", lineHeight: 1.75,
              whiteSpace: "pre-wrap", wordBreak: "break-word",
            }}>
              {(email.body || email.preview || "").split("\n").filter(line => line.trim()).map((paragraph, i) => (
                <p key={i} style={{ margin: "0 0 8px", lineHeight: 1.7 }}>{paragraph}</p>
              ))}
            </div>
          )}
        </div>

        {/* Smart Actions */}
        {email.smartActions && email.smartActions.length > 0 && (
          <div style={{ padding: "0 24px 16px" }}>
            <div style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "10px", fontWeight: 600, color: "#A0775A",
              letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: "10px",
            }}>
              Smart Actions
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {email.smartActions.map((action, i) => (
                <button key={i} onClick={() => alert(`${action.label}: ${action.detail}\n\n(This feature will connect to your calendar/reminders soon!)`)} style={{
                  display: "flex", alignItems: "center", gap: "12px",
                  padding: "12px 16px", borderRadius: "12px",
                  background: "rgba(160,119,90,0.04)", border: "1px solid rgba(160,119,90,0.08)",
                  cursor: "pointer", textAlign: "left", width: "100%", transition: "all 0.2s",
                }}>
                  <span style={{ fontSize: "18px" }}>{ACTION_ICONS[action.type] || "\u2022"}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: "#A0775A" }}>{action.label}</div>
                    <div style={{ fontSize: "12px", color: "#9C8E82", marginTop: "2px" }}>{action.detail}</div>
                  </div>
                  <span style={{ fontSize: "12px", color: "#B8A99A" }}>{"\u2192"}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* AI Reply Preview (read-only) */}
        {email.aiReply && (
          <div style={{ padding: "0 24px 20px" }}>
            <div style={{
              padding: "16px", borderRadius: "14px",
              background: "rgba(122,140,110,0.06)", border: "1px solid rgba(122,140,110,0.1)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
                <span style={{
                  fontFamily: "'Playfair Display', Georgia, serif",
                  fontSize: "10px", fontWeight: 600, color: "#7A8C6E",
                  letterSpacing: "0.8px", textTransform: "uppercase",
                }}>
                  AI Draft Reply
                </span>
              </div>
              <p style={{ fontSize: "13px", color: "#4A433C", lineHeight: 1.65, margin: 0 }}>{email.aiReply}</p>
              <div style={{ fontSize: "11px", color: "#B8A99A", marginTop: "10px", fontStyle: "italic" }}>
                Tap Reply below to edit & send
              </div>
            </div>
          </div>
        )}

        {/* Floating Reply & Forward buttons */}
        <div style={{
          position: "sticky", bottom: 0, left: 0, right: 0,
          padding: "12px 24px 16px",
          background: "linear-gradient(to top, #FDFBF9 70%, rgba(253,251,249,0))",
          display: "flex", gap: "10px",
        }}>
          <button
            onClick={() => onReply && onReply(email)}
            style={{
              flex: 1, padding: "14px", borderRadius: "14px",
              background: "#FDFBF9", border: "1px solid rgba(160,119,90,0.15)",
              boxShadow: "0 2px 12px rgba(60,45,30,0.06)",
              color: "#A0775A", fontSize: "14px", fontWeight: 600,
              fontFamily: "'Playfair Display', Georgia, serif",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            {"\u21A9"} Reply
          </button>
          <button
            onClick={() => onForward && onForward(email)}
            style={{
              flex: 1, padding: "14px", borderRadius: "14px",
              background: "#FDFBF9", border: "1px solid rgba(120,100,80,0.12)",
              boxShadow: "0 2px 12px rgba(60,45,30,0.06)",
              color: "#6B5E54", fontSize: "14px", fontWeight: 600,
              fontFamily: "'Playfair Display', Georgia, serif",
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", gap: "8px",
              transition: "all 0.2s ease",
            }}
          >
            {"\u21AA"} Forward
          </button>
        </div>

      </div>
    </div>
  );
}

export default EmailModal;
