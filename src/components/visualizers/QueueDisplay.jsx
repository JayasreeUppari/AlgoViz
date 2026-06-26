export default function QueueDisplay({
  queues = {},
}) {

  const queueEntries = Object.entries(queues);

  if (queueEntries.length === 0) return null;

  return (
    <div style={{ padding: "20px" }}>

      {queueEntries.map(([queueName, queue]) => (

        <div
          key={queueName}
          style={{ marginBottom: "30px" }}
        >
          <h4>{queueName}</h4>

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
                      fontSize: "12px",
                    }}
                  >
                    FRONT
                  </div>
                )}

                <div
                  style={{
                    width: "60px",
                    height: "40px",
                    backgroundColor: "#81c784",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "6px",
                    fontWeight: "bold",
                  }}
                >
                  {value}
                </div>

                {idx === queue.length - 1 && (
                  <div
                    style={{
                      fontSize: "12px",
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