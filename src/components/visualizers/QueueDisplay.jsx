export default function QueueDisplay({
  queues = {},
}) {

  const queueEntries = Object.entries(queues);

  if (queueEntries.length === 0) return null;

  return (
    <div style={{ padding: 0 }}>

      {queueEntries.map(([queueName, queue]) => (

        <div
          key={queueName}
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
            {queueName}
          </h4>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
              alignItems: "center",
            }}
          >
            {queue.map((value, idx) => (
              <div key={idx}>

                {idx === 0 && (
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.5px",
                      color: "var(--success)",
                      textAlign: "center",
                      marginBottom: "4px",
                    }}
                  >
                    FRONT
                  </div>
                )}

                <div
                  style={{
                    width: "60px",
                    height: "40px",
                    backgroundColor: "var(--bg-elevated)",
                    color: "var(--text-primary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                    fontWeight: "700",
                    fontFamily: "var(--font-mono)",
                    border: "1px solid var(--border-subtle)",
                  }}
                >
                  {value}
                </div>

                {idx === queue.length - 1 && (
                  <div
                    style={{
                      fontSize: "10px",
                      fontWeight: "700",
                      letterSpacing: "0.5px",
                      color: "var(--warning)",
                      textAlign: "center",
                      marginTop: "4px",
                    }}
                  >
                    REAR
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

      ))}
    </div>
  );
}