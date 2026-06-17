export default function ArrayDisplay({
  step = null,
  array = null,
  pointers = {},
  highlights = {},
}) {
  const displayArray = step?.array || array || [];
  const displayHighlights = step?.highlights || highlights || {};
  const displayPointers = step?.pointers || pointers || {};
  const message = step?.message || "";

  if (!displayArray.length) return null;

  return (
    <div style={{ padding: "20px" }}>

      {/* MESSAGE */}
      {message && <h3>{message}</h3>}

      {/* ARRAY VISUALIZATION */}
      <div
        style={{
          display: "flex",
          gap: "10px",
          marginTop: "20px",
        }}
      >
        {displayArray.map((value, idx) => {
          console.log(idx, displayPointers);
          const isCompare =
            displayHighlights?.compare?.includes(idx);

          const isSwap =
            displayHighlights?.swap?.includes(idx);

          const pointerNames = Object.entries(displayPointers)
            .filter(([_, pos]) => pos === idx)
            .map(([name]) => name);

          let bg = "#e0e0e0";

          if (isCompare) bg = "#ffd54f";
          if (isSwap) bg = "#ef5350";
          <pre>{JSON.stringify(displayPointers, null, 2)}</pre>
          return (
            <div
              key={idx}
              style={{ textAlign: "center" }}
            >
              {/* POINTER LABEL */}
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

              {/* ARRAY CELL */}
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
                  border: "1px solid #ccc",
                }}
              >
                {value}
              </div>

              {/* INDEX */}
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
  );
}