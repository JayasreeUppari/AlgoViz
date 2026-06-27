export default function ArrayDisplay({
  arrays = {},
  pointers = {},
  highlights = {},
  message = "",
}) {

  const arrayEntries = Object.entries(arrays);

  if (arrayEntries.length === 0) return null;

  return (
    <div style={{ padding: 0 }}>

      {message && (
        <h3
          style={{
            margin: "0 0 12px 0",
            fontSize: "12px",
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.6px",
            color: "var(--text-secondary)",
          }}
        >
          {message}
        </h3>
      )}

      {arrayEntries.map(([arrayName, arr]) => (

        <div
          key={arrayName}
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
            {arrayName}
          </h4>

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "10px",
            }}
          >

            {arr.map((value, idx) => {

              const isCompare =
                highlights?.compare?.array === arrayName &&
                highlights?.compare?.indices?.includes(idx);

              const isSwap =
                highlights?.swap?.array === arrayName &&
                highlights?.swap?.indices?.includes(idx);

              const isActive =
                highlights?.active?.array === arrayName &&
                highlights?.active?.indices?.includes(idx);

              const isVisit =
                highlights?.visit?.array === arrayName &&
                highlights?.visit?.indices?.includes(idx);

              const pointerNames = Object.entries(pointers)
                .filter(([_, pointer]) =>
                  pointer?.array === arrayName &&
                  pointer?.position === idx
                )
                .map(([name]) => name);

              // Priority: swap > set/active > compare > visit > default
              // (highest-impact mutation wins if multiple highlights overlap on the same index)
              let bg = "var(--bg-elevated)";
              let border = "1px solid var(--border-subtle)";
              let textColor = "var(--text-primary)";

              if (isVisit) {
                bg = "#7c5cbf"; // purple
                border = "1px solid #9b7fd4";
                textColor = "#fff";
              }
              if (isCompare) {
                bg = "#c9941f"; // amber
                border = "1px solid #e0ad3d";
                textColor = "#fff";
              }
              if (isActive) {
                bg = "var(--accent)"; // blue - SET/ARRAY_SET
                border = "2px solid #93c5fd";
                textColor = "#fff";
              }
              if (isSwap) {
                bg = "var(--danger)"; // red - SWAP
                border = "2px solid #ff8b85";
                textColor = "#fff";
              }

              return (
                <div
                  key={idx}
                  style={{ textAlign: "center" }}
                >

                  {pointerNames.length > 0 && (
                    <div
                      style={{
                        fontSize: "11px",
                        marginBottom: "5px",
                        fontWeight: "700",
                        fontFamily: "var(--font-mono)",
                        color: "var(--accent)",
                      }}
                    >
                      {pointerNames.join(",")}
                    </div>
                  )}

                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      backgroundColor: bg,
                      color: textColor,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      fontWeight: "700",
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      border: border,
                      transition: "background-color 0.2s ease, border 0.2s ease",
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      marginTop: "5px",
                      color: "var(--text-muted)",
                      fontFamily: "var(--font-mono)",
                    }}
                  >
                    {idx}
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