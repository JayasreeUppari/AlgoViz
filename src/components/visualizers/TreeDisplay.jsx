import { layoutTree } from "../layout/treeLayout";

export default function TreeDisplay({ tree, highlights }) {

    const positions = layoutTree(tree);
    const activeNodes = new Set(highlights.active);

    const visitedNodes = new Set(highlights.visit);


    return (
        <svg
            width="900"
            height="600"
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
                                    stroke="black"
                                />

                            )}

                            {node.right && positions[node.right] && (

                                <line
                                    key={`${id}-right`}
                                    x1={parent.x}
                                    y1={parent.y}
                                    x2={positions[node.right].x}
                                    y2={positions[node.right].y}
                                    stroke="black"
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

                            fill="white"

                            stroke="black"
                            fill={
                                active
                                    ? "#ffd54f"
                                    : visited
                                        ? "#90caf9"
                                        : "white"
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

                        >

                            {node.value}

                        </text>

                    );

                })
            }
        </svg>

    );
}