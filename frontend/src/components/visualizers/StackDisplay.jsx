export default function StackDisplay({
  stacks = {},
}) {

  const stackEntries = Object.entries(stacks);

  if (stackEntries.length === 0) return null;

  return (
    <div style={{ padding: 0 }}>
      {stackEntries.map(([stackName, stack]) => (

        <div
          key={stackName}
          style={{ marginBottom: "22px" }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "12px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.6px",
              color: "var(--text-secondary)",
            }}
          >
            {stackName}
          </h4>

          <div
            style={{
              display: "flex",
              flexDirection: "column-reverse",
              gap: "8px",
              marginTop: "10px",
              alignItems: "center",
            }}
          >
            {stack.map((value, idx) => {

              const isTop =
                idx === stack.length - 1;

              return (
                <div
                  key={idx}
                  style={{ textAlign: "center" }}
                >
                  {isTop && (
                    <div
                      style={{
                        fontSize: "10px",
                        marginBottom: "4px",
                        fontWeight: "700",
                        letterSpacing: "0.5px",
                        color: "var(--accent)",
                      }}
                    >
                      TOP
                    </div>
                  )}

                  <div
                    style={{
                      width: "60px",
                      height: "40px",
                      backgroundColor: isTop
                        ? "var(--accent)"
                        : "var(--bg-elevated)",
                      color: isTop ? "#fff" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontFamily: "var(--font-mono)",
                      border: isTop
                        ? "1px solid #93c5fd"
                        : "1px solid var(--border-subtle)",
                    }}
                  >
                    {value}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      ))}
    </div>
  );
}