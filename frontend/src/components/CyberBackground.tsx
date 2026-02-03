export default function CyberBackground() {
  return (
    <div className="cyber-bg">
      {/* 3D Grid Floor */}
      <div className="grid-floor" />

      {/* Floating Particles */}
      <div className="particles">
        {[...Array(50)].map((_, i) => (
          <div
            key={i}
            className="particle"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 20}s`,
              animationDuration: `${15 + Math.random() * 10}s`,
            }}
          />
        ))}
      </div>

      {/* AI Circle Pulse */}
      <div className="ai-circle">
        <div className="ai-ring" style={{ animationDelay: '0s' }} />
        <div className="ai-ring" style={{ animationDelay: '0.5s' }} />
        <div className="ai-ring" style={{ animationDelay: '1s' }} />
        <div className="ai-core" />
      </div>

      {/* Scanning Lines */}
      <div className="scan-line" />
    </div>
  );
}
