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
        if (!startId) {
            return (
                <div style={{ color: "red" }}>
                    ⚠ No entry node found
                </div>
            );
        }

        const result = [];
        let current = startId;
        const visited = new Set();

        while (current && nodes[current] && !visited.has(current)) {
            visited.add(current);

            const node = nodes[current];
            const pointerNames = Object.keys(pointers)
                .filter(name => pointers[name] === node.id);
            result.push(
                <div
                    key={node.id}
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center"
                    }}
                >

                    {pointerNames.map(name => (
                        <div key={name}>
                            {name}
                            <br />
                            ↓
                        </div>
                    ))}

                    <div style={{ display: "flex", alignItems: "center" }}>
                        <div style={nodeStyle(true)}>
                            {node.value}
                        </div>

                        <div style={{ margin: "0 8px" }}>→</div>
                    </div>

                </div>
            );

            current = node.next;
        }

        return result;
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