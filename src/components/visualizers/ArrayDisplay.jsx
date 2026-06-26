export default function ArrayDisplay({
  arrays = {},
  pointers = {},
  highlights = {},
  message = "",
}) {

  const arrayEntries = Object.entries(arrays);

  if (arrayEntries.length === 0) return null;

  return (
    <div style={{ padding: "20px" }}>

      {message && <h3>{message}</h3>}

      {arrayEntries.map(([arrayName, arr]) => (

        <div
          key={arrayName}
          style={{ marginBottom: "30px" }}
        >

          <h4>{arrayName}</h4>

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
              let bg = "#e0e0e0";
              let border = "1px solid #ccc";

              if (isVisit) {
                bg = "#b39ddb"; // purple
              }
              if (isCompare) {
                bg = "#ffd54f"; // amber
              }
              if (isActive) {
                bg = "#4fc3f7"; // blue - SET/ARRAY_SET
                border = "2px solid #0288d1";
              }
              if (isSwap) {
                bg = "#ef5350"; // red - SWAP
                border = "2px solid #b71c1c";
              }

              return (
                <div
                  key={idx}
                  style={{ textAlign: "center" }}
                >

                  {pointerNames.length > 0 && (
                    <div
                      style={{
                        fontSize: "12px",
                        marginBottom: "5px",
                        fontWeight: "bold",
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
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      borderRadius: "6px",
                      fontWeight: "bold",
                      border: border,
                      transition: "background-color 0.2s ease, border 0.2s ease",
                    }}
                  >
                    {value}
                  </div>

                  <div
                    style={{
                      fontSize: "12px",
                      marginTop: "4px",
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