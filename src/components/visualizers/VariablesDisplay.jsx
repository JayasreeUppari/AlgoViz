export default function VariablesDisplay({ variables = {} }) {
  const entries = Object.entries(variables);

  if (entries.length === 0) {
    return null;
  }

  return (
    <div
      className="variables-panel"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
      }}
    >
      <h3
        style={{
          width: "100%",
          margin: "0 0 4px 0",
          fontSize: "12px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.6px",
          color: "var(--text-secondary)",
        }}
      >
        Variables
      </h3>

      {entries.map(([name, value]) => (
        <div
          key={name}
          style={{
            background: "var(--bg-elevated)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "6px",
            padding: "6px 12px",
            fontFamily: "var(--font-mono)",
            fontSize: "13px",
            color: "var(--text-primary)",
          }}
        >
          <strong style={{ color: "var(--accent)" }}>{name}</strong>
          <span style={{ color: "var(--text-muted)" }}> = </span>
          {String(value)}
        </div>
      ))}
    </div>
  );
}