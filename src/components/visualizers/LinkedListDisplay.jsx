import React from "react";

export default function LinkedListDisplay({ list, pointers = {} }) {
    if (!list || !list.nodes) {
        return <div>No Linked List</div>;
    }

    const nodes = list.nodes;

    function findFirstReachableNode(list) {
        if (!list?.nodes) return null;

        const allIds = Object.keys(list.nodes);
        const hasIncoming = new Set();

        Object.values(list.nodes).forEach(node => {
            if (node.next) {
                hasIncoming.add(node.next);
            }
        });

        const root = allIds.find(id => !hasIncoming.has(id));

        return root || allIds[0] || null;
    }

    const startId =
        list.head ||
        pointers.head ||
        findFirstReachableNode(list);

    const renderTraversal = () => {
    if (!nodes || Object.keys(nodes).length === 0) {
        return <div>No nodes</div>;
    }

    return Object.values(nodes).map((node) => {
        const pointerNames = Object.keys(pointers)
            .filter(name => pointers[name] === node.id);

        return (
            <div
                key={node.id}
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    marginRight: "20px"
                }}
            >
                {/* POINTERS */}
                {pointerNames.map(name => (
                    <div key={name} style={{ color: "blue" }}>
                        {name} ↓
                    </div>
                ))}

                {/* NODE */}
                <div style={nodeStyle(true)}>
                    {node.value}
                </div>

                {/* EDGE (only visual hint) */}
                <div style={{ fontSize: "20px", color: "#888" }}>
                    →
                </div>

                <div style={{ fontSize: "12px", color: "#aaa" }}>
                    next: {node.next ?? "null"}
                </div>
            </div>
        );
    });
};

    const renderMemory = () => {
        return Object.values(nodes).map((node) => (
            <div key={node.id} style={memoryStyle()}>
                <div><b>{node.value}</b></div>
                <div>next: {node.next ?? "null"}</div>
            </div>
        ));
    };

    return (
        <div>
            <h3>🧠 Memory</h3>
            <div style={{ display: "flex", gap: "10px" }}>
                {renderMemory()}
            </div>

            <h3>🔗 Structure</h3>
            <div style={{ display: "flex", alignItems: "center" }}>
                {renderTraversal()}
                <div style={{ color: "#888" }}>NULL</div>
            </div>
        </div>
    );
}

function nodeStyle(active) {
    return {
        width: "60px",
        height: "60px",
        border: "2px solid black",
        borderRadius: "10px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: active ? "#ffe08a" : "#f5f5f5"
    };
}

function memoryStyle() {
    return {
        padding: "10px",
        border: "1px solid #333",
        borderRadius: "6px"
    };
}