import React from "react";
import { layoutLinkedList } from "../layout/linkedListLayout";

export default function LinkedListDisplay({
    list,
    pointers = {}
}) {

    if (!list || !list.nodes) {
        return <div>No Linked List</div>;
    }

    const {
        components,
        positions
    } = layoutLinkedList(list);

    const nodes = list.nodes;

    return (
        <svg
            width="1400"
            height={components.length * 180 + 100}
        >

            {/* COMPONENT TITLES */}
            {
                components.map((component, idx) => (

                    <text
                        key={`title-${idx}`}
                        x={30}
                        y={positions[component[0]].y - 50}
                        fontSize="18"
                        fontWeight="bold"
                    >
                        {`Linked List ${idx + 1}`}
                    </text>

                ))
            }

            {/* EDGES */}
            {
                Object.entries(nodes).map(([id, node]) => {

                    if (!node.next) return null;

                    const from = positions[id];
                    const to = positions[node.next];

                    if (!from || !to) return null;

                    return (
                        <g key={`${id}-${node.next}`}>

                            <line
                                x1={from.x + 80}
                                y1={from.y}
                                x2={to.x}
                                y2={to.y}
                                stroke="black"
                                strokeWidth="2"
                            />

                            <polygon
                                points={`
                                    ${to.x - 10},${to.y - 5}
                                    ${to.x},${to.y}
                                    ${to.x - 10},${to.y + 5}
                                `}
                                fill="black"
                            />

                        </g>
                    );
                })
            }

            {/* POINTER LABELS */}
            {
                Object.keys(pointers).map(pointerName => {

                    const nodeId = pointers[pointerName];
                    const pos = positions[nodeId];

                    if (!pos) return null;

                    return (
                        <g key={pointerName}>

                            <text
                                x={pos.x + 40}
                                y={pos.y - 35}
                                textAnchor="middle"
                                fill="#1565c0"
                                fontWeight="bold"
                            >
                                {pointerName}
                            </text>

                            <text
                                x={pos.x + 40}
                                y={pos.y - 15}
                                textAnchor="middle"
                                fill="#1565c0"
                            >
                                ↓
                            </text>

                        </g>
                    );
                })
            }

            {/* NODES */}
            {
                Object.entries(nodes).map(([id, node]) => {

                    const pos = positions[id];

                    if (!pos) return null;

                    return (
                        <g key={id}>

                            {/* DATA BOX */}
                            <rect
                                x={pos.x}
                                y={pos.y - 25}
                                width="60"
                                height="50"
                                fill="#fff8dc"
                                stroke="black"
                            />

                            {/* NEXT BOX */}
                            <rect
                                x={pos.x + 60}
                                y={pos.y - 25}
                                width="30"
                                height="50"
                                fill="#f5f5f5"
                                stroke="black"
                            />

                            {/* VALUE */}
                            <text
                                x={pos.x + 30}
                                y={pos.y + 5}
                                textAnchor="middle"
                            >
                                {node.value}
                            </text>

                            {/* POINTER FIELD */}
                            <text
                                x={pos.x + 75}
                                y={pos.y + 5}
                                textAnchor="middle"
                            >
                                {node.next ? "•" : "X"}
                            </text>

                            {/* NODE ID */}
                            <text
                                x={pos.x + 45}
                                y={pos.y + 45}
                                textAnchor="middle"
                                fill="#666"
                                fontSize="12"
                            >
                                {id}
                            </text>

                        </g>
                    );
                })
            }

            {/* NULL LABELS */}
            {
                components.map((component, idx) => {

                    const lastId =
                        component[component.length - 1];

                    const pos = positions[lastId];

                    return (
                        <text
                            key={`null-${idx}`}
                            x={pos.x + 120}
                            y={pos.y + 5}
                            fontWeight="bold"
                            fill="#888"
                        >
                            NULL
                        </text>
                    );
                })
            }

        </svg>
    );
}