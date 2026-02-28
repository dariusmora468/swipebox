'use client';
import GoogleIcon from './GoogleIcon';

function LoginScreen() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "40px 24px", textAlign: "center", background: "#F5F0EB" }}>
      <div style={{ width: "72px", height: "72px", borderRadius: "20px", background: "linear-gradient(135deg, #A0775A, #C4845C)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FDFBF9", fontSize: "32px", marginBottom: "28px", boxShadow: "0 8px 32px rgba(160,119,90,0.2)" }}>{"\u2709"}</div>
      <h1 style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "32px", fontWeight: 700, color: "#2C2520", margin: "0 0 8px", letterSpacing: "1px", textTransform: "uppercase" }}>SwipeBox</h1>
      <p style={{ fontSize: "15px", color: "#6B5E54", margin: "0 0 48px", maxWidth: "300px", lineHeight: 1.65 }}>AI-powered email triage. Swipe through your inbox like never before.</p>
      <a href="/api/auth/gmail" style={{ display: "flex", alignItems: "center", gap: "12px", padding: "16px 36px", borderRadius: "14px", border: "1px solid rgba(120,100,80,0.12)", background: "#FDFBF9", color: "#2C2520", fontSize: "15px", fontWeight: 600, textDecoration: "none", boxShadow: "0 2px 16px rgba(60,45,30,0.08)", cursor: "pointer" }}>
        <GoogleIcon /> Sign in with Google
      </a>
      <p style={{ fontSize: "12px", color: "#9C8E82", marginTop: "28px", maxWidth: "300px", lineHeight: 1.55 }}>
        We only access your email to display and manage it. We never store or sell your data.
      </p>
      <div style={{ display: "flex", gap: "16px", marginTop: "16px" }}>
        <a href="/privacy" style={{ fontSize: "12px", color: "#A0775A", textDecoration: "none", fontWeight: 500 }}>Privacy Policy</a>
        <span style={{ fontSize: "12px", color: "#D5CDC5" }}>{"\u00B7"}</span>
        <a href="/terms" style={{ fontSize: "12px", color: "#A0775A", textDecoration: "none", fontWeight: 500 }}>Terms of Service</a>
      </div>
    </div>
  );
}

export default LoginScreen;
