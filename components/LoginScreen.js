'use client';
import GoogleIcon from './GoogleIcon';

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

export default LoginScreen;
