export default function QueueDisplay({
  step = null,
  queue = null,
}) {
  const displayQueue = step?.array || queue || [];
  const message = step?.message || "";

  return (
    <div style={{ padding: "20px" }}>
      {message && <h3>{message}</h3>}

      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
          alignItems: "center",
        }}
      >
        {displayQueue.map((value, idx) => (
          <div key={idx}>
            {idx === 0 && (
              <div style={{ fontSize: "12px" }}>
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

            {idx === displayQueue.length - 1 && (
              <div style={{ fontSize: "12px" }}>
                REAR
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}