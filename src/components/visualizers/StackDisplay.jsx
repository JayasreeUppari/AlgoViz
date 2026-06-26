export default function StackDisplay({
  stacks = {},
}) {

  const stackEntries = Object.entries(stacks);

  if (stackEntries.length === 0) return null;

  return (
    <div style={{ padding: "20px" }}>
      {stackEntries.map(([stackName, stack]) => (

        <div
          key={stackName}
          style={{ marginBottom: "30px" }}
        >
          <h4>{stackName}</h4>

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

      ))}
    </div>
  );
}