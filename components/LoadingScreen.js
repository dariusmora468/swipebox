'use client';

function LoadingScreen({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: "48px", height: "48px", borderRadius: "50%", border: "2px solid rgba(255,255,255,0.08)", borderTopColor: "#818cf8", animation: "spin 0.8s linear infinite", marginBottom: "24px" }} />
      <p style={{ fontSize: "15px", color: "#64748b", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

export default LoadingScreen;
