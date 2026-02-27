'use client';

function LoadingScreen({ message }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 24px", textAlign: "center" }}>
      <div style={{ width: "44px", height: "44px", borderRadius: "50%", border: "2px solid rgba(120,100,80,0.08)", borderTopColor: "#A0775A", animation: "spin 0.8s linear infinite", marginBottom: "24px" }} />
      <p style={{ fontSize: "14px", color: "#9C8E82", fontWeight: 500 }}>{message}</p>
    </div>
  );
}

export default LoadingScreen;
