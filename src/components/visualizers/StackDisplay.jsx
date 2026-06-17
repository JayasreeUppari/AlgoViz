export default function StackDisplay({
  step = null,
  stack = null,
}) {
  const displayStack = step?.array || stack || [];
  const pointers = step?.pointers || [];
  const message = step?.message || "";

  const topPointer =
    pointers.find((p) => p.name === "top");

  return (
    <div style={{ padding: "20px" }}>
      {message && <h3>{message}</h3>}

      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          gap: "8px",
          marginTop: "20px",
          alignItems: "center",
        }}
      >
        {displayStack.map((value, idx) => {
          const isTop =
            topPointer
              ? topPointer.index === idx
              : idx === displayStack.length - 1;

          return (
            <div
              key={idx}
              style={{ textAlign: "center" }}
            >
              {isTop && (
                <div
                  style={{
                    fontSize: "12px",
                    marginBottom: "4px",
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
                    ? "#ff7043"
                    : "#90caf9",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "6px",
                  fontWeight: "bold",
                }}
              >
                {value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}