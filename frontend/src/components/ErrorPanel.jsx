export default function ErrorPanel({ errors = [] }) {
    if (errors.length === 0) return null;

    return (
        <div
            style={{
                background: "var(--danger-soft)",
                border: "1px solid rgba(248, 81, 73, 0.4)",
                borderRadius: "8px",
                padding: "12px 16px",
            }}
        >
            <strong style={{ color: "#ffb4af", fontSize: "13px" }}>
                ⚠ {errors.length} issue{errors.length > 1 ? "s" : ""} at this step
            </strong>

            <ul style={{ margin: "8px 0 0", paddingLeft: "20px" }}>
                {errors.map((err, idx) => (
                    <li
                        key={idx}
                        style={{
                            color: "#ffb4af",
                            fontSize: "13px",
                            fontFamily: "var(--font-mono)",
                        }}
                    >
                        Line {err.line}: {err.message}
                    </li>
                ))}
            </ul>
        </div>
    );
}