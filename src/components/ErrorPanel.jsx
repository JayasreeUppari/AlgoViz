export default function ErrorPanel({ errors = [] }) {
    if (errors.length === 0) return null;

    return (
        <div
            style={{
                background: "#fdecea",
                border: "1px solid #f5c2c0",
                borderRadius: "8px",
                padding: "12px 16px",
                marginBottom: "16px",
            }}
        >
            <strong style={{ color: "#c62828" }}>
                ⚠ {errors.length} issue{errors.length > 1 ? "s" : ""} at this step
            </strong>

            <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
                {errors.map((err, idx) => (
                    <li key={idx} style={{ color: "#c62828", fontSize: "14px" }}>
                        Line {err.line}: {err.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}