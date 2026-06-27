import "../../styles/graph.css"

import { computeGraphLayout } from "../layout/computeGraphLayout";

export default function GraphDisplay({ graph }) {

    if (!graph) return null;

    const positions = computeGraphLayout(graph);

    const nodes = graph.nodes || {};
    const edges = graph.edges || [];

    return (

        <div className="graph-container">
            <h3>Graph</h3>
            <svg className="graph-svg">

                {/* EDGES */}

                {edges.map((edge, index) => {

                    const from = positions[edge.from];
                    const to = positions[edge.to];

                    if (!from || !to) return null;

                    return (

                        <g key={index}>

                            <line
                                x1={from.x}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke={
                                    edge.color ??
                                    (edge.highlighted ? "#f85149" : "#4b5563")
                                }
                                strokeWidth={edge.highlighted ? 3 : 1.5}
                            />

                            {edge.weight != null && (

                                <text
                                    x={(from.x + to.x) / 2}
                                    y={(from.y + to.y) / 2 - 8}
                                    textAnchor="middle"
                                    fontSize="13"
                                    fill="#9198a1"
                                >
                                    {edge.weight}
                                </text>

                            )}

                        </g>

                    );

                })}

                {/* NODES */}

                {Object.entries(nodes).map(([id, node]) => {

                    const pos = positions[id];

                    if (!pos) return null;

                    return (

                        <g key={id}>

                            <circle
                                cx={pos.x}
                                cy={pos.y}
                                r={25}
                                fill={
                                    node.color ??
                                    (node.highlighted
                                        ? "#d29922"
                                        : node.visited
                                            ? "#3fb950"
                                            : "#3b82f6")
                                }
                                stroke="#e6edf3"
                                strokeWidth="1.5"
                            />

                            <text
                                x={pos.x}
                                y={pos.y + 5}
                                textAnchor="middle"
                                fontWeight="bold"
                                fill="#0d1117"
                            >
                                {node.value}
                            </text>

                            <text
                                x={pos.x}
                                y={pos.y - 35}
                                textAnchor="middle"
                                fontSize="12"
                                fill="#9198a1"
                            >
                                {id}
                            </text>

                        </g>

                    );

                })}

            </svg>

        </div>

    );

}