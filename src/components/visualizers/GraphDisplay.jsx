import "../../styles/graph.css"

import { computeGraphLayout } from "../layout/computeGraphLayout";

export default function GraphDisplay({ graph }) {

    if (!graph) return null;

    const positions = computeGraphLayout(graph);

    const nodes = graph.nodes || {};
    const edges = graph.edges || [];

    return (

        <div className="graph-container">

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
                                    (edge.highlighted ? "red" : "#555")
                                }
                                strokeWidth={edge.highlighted ? 4 : 2}
                            />

                            {edge.weight != null && (

                                <text
                                    x={(from.x + to.x) / 2}
                                    y={(from.y + to.y) / 2 - 8}
                                    textAnchor="middle"
                                    fontSize="14"
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
                                        ? "orange"
                                        : node.visited
                                            ? "lightgreen"
                                            : "#87CEFA")
                                }
                                stroke="black"
                                strokeWidth="2"
                            />

                            <text
                                x={pos.x}
                                y={pos.y + 5}
                                textAnchor="middle"
                                fontWeight="bold"
                            >
                                {node.value}
                            </text>

                            <text
                                x={pos.x}
                                y={pos.y - 35}
                                textAnchor="middle"
                                fontSize="12"
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