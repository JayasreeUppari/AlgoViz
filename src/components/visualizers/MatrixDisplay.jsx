import "../../styles/matrix.css";

export default function MatrixDisplay({ name, matrix, pointers }) {

    if (!matrix) return null;
const rowPointer = pointers?.i?.position;
const colPointer = pointers?.j?.position;
    return (
        <div className="matrix-container">

            <h3 className="matrix-title">
                {name} ({matrix.rows} × {matrix.cols})
            </h3>

            <table className="matrix-table">

                <thead>
                    <tr>
                        <th className="corner-cell"></th>

                        {Array.from({ length: matrix.cols }, (_, c) => {

                            const active = colPointer === c;

                            return (
                                <th
                                    key={c}
                                    className={
                                        active
                                            ? "matrix-index active-index"
                                            : "matrix-index"
                                    }
                                >
                                    {active ? `j↓ ${c}` : c}
                                </th>
                            );
                        })}
                    </tr>
                </thead>

                <tbody>

                    {matrix.values.map((row, r) => {

                        const activeRow = rowPointer === r;

                        return (
                            <tr key={r}>

                                <th
                                    className={
                                        activeRow
                                            ? "matrix-index active-index"
                                            : "matrix-index"
                                    }
                                >
                                    {activeRow ? `i→ ${r}` : r}
                                </th>

                                {row.map((value, c) => {

                                    const highlighted =
                                        matrix.highlights.some(
                                            cell =>
                                                cell.row === r &&
                                                cell.col === c
                                        );

                                    return (
                                        <td
                                            key={c}
                                            className={
                                                highlighted
                                                    ? "matrix-cell highlighted"
                                                    : "matrix-cell"
                                            }
                                        >
                                            {value ?? ""}
                                        </td>
                                    );
                                })}

                            </tr>
                        );
                    })}

                </tbody>

            </table>

        </div>
    );
}