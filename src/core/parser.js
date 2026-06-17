export function parseCode(code) {
    const lines = code
        .split("\n")
        .map(line => line.trim())
        .filter(Boolean);

    const events = [];

    lines.forEach(line => {

        // ======================
        // ARRAY
        // ======================
        if (line.startsWith("ARRAY")) {
            const values = line
                .replace("ARRAY", "")
                .trim()
                .replace("[", "")
                .replace("]", "")
                .split(",")
                .filter(v => v !== "")
                .map(Number);

            events.push({
                type: "CREATE",
                target: "array",
                payload: {
                    value: values
                }
            });
        }

        // ======================
        // UPDATE ARRAY
        // ======================
        if (line.startsWith("UPDATE")) {
            const [, index, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                target: "array",
                payload: {
                    op: "UPDATE",
                    index: Number(index),
                    value: Number(value)
                }
            });
        }

        // ======================
        // STACK
        // ======================
        if (line === "STACK") {
            events.push({
                type: "CREATE",
                target: "stack",
                payload: {}
            });
        }

        if (line.startsWith("PUSH")) {
            const [, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                target: "stack",
                payload: {
                    op: "PUSH",
                    value: Number(value)
                }
            });
        }

        if (line === "POP") {
            events.push({
                type: "MUTATE",
                target: "stack",
                payload: {
                    op: "POP"
                }
            });
        }

        // ======================
        // QUEUE
        // ======================
        if (line === "QUEUE") {
            events.push({
                type: "CREATE",
                target: "queue",
                payload: {}
            });
        }

        if (line.startsWith("ENQUEUE")) {
            const [, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                target: "queue",
                payload: {
                    op: "ENQUEUE",
                    value: Number(value)
                }
            });
        }

        if (line === "DEQUEUE") {
            events.push({
                type: "MUTATE",
                target: "queue",
                payload: {
                    op: "DEQUEUE"
                }
            });
        }

        // ======================
        // SWAP
        // ======================
        if (line.startsWith("SWAP")) {
            const [, i, j] = line.split(" ");

            events.push({
                type: "MUTATE",
                target: "array",
                payload: {
                    op: "SWAP",
                    i: Number(i),
                    j: Number(j)
                }
            });
        }

        // ======================
        // POINTERS
        // ======================
        if (line.startsWith("POINTER")) {
            const [, name, index] = line.split(" ");

            events.push({
                type: "POINTER",
                target: "array",
                payload: {
                    name,
                    position: Number(index)
                }
            });
        }

        if (line.startsWith("MOVE")) {
            const [, name, index] = line.split(" ");

            events.push({
                type: "POINTER",
                target: "array",
                payload: {
                    name,
                    position: Number(index)
                }
            });
        }

        // ======================
        // COMPARE
        // ======================
        if (line.startsWith("COMPARE")) {
            const [, a, b] = line.split(" ");

            events.push({
                type: "COMPARE",
                target: "array",
                payload: {
                    a: Number(a),
                    b: Number(b)
                }
            });
        }
        if (line.startsWith("LIST_CREATE")) {
            const [, id, value] = line.split(" ");

            events.push({
                type: "LIST_CREATE",
                payload: {
                    id,
                    value: Number(value)
                }
            });
        }

        if (line.startsWith("LIST_LINK")) {
            const [, from, to] = line.split(" ");

            events.push({
                type: "LIST_LINK",
                payload: { from, to }
            });
        }

        if (line.startsWith("LIST_HEAD")) {
            const [, id] = line.split(" ");

            events.push({
                type: "LIST_HEAD",
                payload: { id }
            });
        }
        if (line.startsWith("LIST_POINTER")) {
            const [, name, nodeId] = line.split(" ");

            events.push({
                type: "LIST_POINTER",
                payload: {
                    name,
                    position: nodeId
                }
            });
        }
        if (line.startsWith("VAR")) {
            const [, name, value] = line.split(" ");

            events.push({
                type: "VAR",
                payload: {
                    name,
                    value: Number(value)
                }
            });
        }
        if (line.startsWith("SET")) {
            const [, name, value] = line.split(" ");

            events.push({
                type: "SET_VAR",
                payload: {
                    name,
                    value: Number(value)
                }
            });
        }
    });

    return events;
}
