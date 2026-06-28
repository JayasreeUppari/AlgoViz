import { layoutTree } from "../layout/treeLayout";

export default function TreeDisplay({ tree, highlights }) {

    const positions = layoutTree(tree);
    const activeNodes = new Set(highlights.treeActive || []);
const visitedNodes = new Set(highlights.treeVisit || []);

    
    return (
        
        <svg
        
            width="900"
            height="600"
            style={{
                background: "var(--bg-base)",
                borderRadius: "var(--radius-md)",
                maxWidth: "100%",
            }}
        >
            
            {/* //edge map */}
            {
                Object.entries(tree.nodes).map(([id, node]) => {

                    const parent = positions[id];

                    if (!parent) return null;

                    return (
                        <>
                            {node.left && positions[node.left] && (

                                <line
                                    key={`${id}-left`}
                                    x1={parent.x}
                                    y1={parent.y}
                                    x2={positions[node.left].x}
                                    y2={positions[node.left].y}
                                    stroke="#4b5563"
                                    strokeWidth="1.5"
                                />

                            )}

                            {node.right && positions[node.right] && (

                                <line
                                    key={`${id}-right`}
                                    x1={parent.x}
                                    y1={parent.y}
                                    x2={positions[node.right].x}
                                    y2={positions[node.right].y}
                                    stroke="#4b5563"
                                    strokeWidth="1.5"
                                />

                            )}

                        </>
                    );

                })
            }
            {/* //nodes- circles */}
            {
                Object.entries(positions).map(([id, p]) => {

                    // const p = positions[id];
                    const node = tree.nodes[id];
                    const active = activeNodes.has(id);

                    const visited = visitedNodes.has(id);

                    return (

                        <circle

                            key={id}

                            cx={p.x}
                            cy={p.y}

                            r={25}

                            stroke="#e6edf3"
                            strokeWidth="1.5"
                            fill={
                                active
                                    ? "#d29922"
                                    : visited
                                        ? "#3b82f6"
                                        : "#21262d"
                            }

                        />

                    );

                })
            }
            {/* //labels */}
            {
                Object.entries(positions).map(([id, p]) => {

                    // const p = positions[id];
                    const node = tree.nodes[id];

                    return (

                        <text

                            key={`${id}-text`}

                            x={p.x}

                            y={p.y + 5}

                            textAnchor="middle"
                            fontWeight="bold"
                            fill={
                                (node && (activeNodes.has(id) || visitedNodes.has(id)))
                                    ? "#0d1117"
                                    : "#e6edf3"
                            }

                        >

                            {node.value}

                        </text>

                    );

                })
            }
        </svg>

    );
}