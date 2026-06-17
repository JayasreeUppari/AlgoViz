export function parseCode(code) {
    const lines = code
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    const events = [];

    let i = 0;

    while (i < lines.length) {
        const line = lines[i];

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
                payload: { value: values }
            });

            i++;
            continue;
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

            i++;
            continue;
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

            i++;
            continue;
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

            i++;
            continue;
        }

        if (line === "POP") {
            events.push({
                type: "MUTATE",
                target: "stack",
                payload: { op: "POP" }
            });

            i++;
            continue;
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

            i++;
            continue;
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

            i++;
            continue;
        }

        if (line === "DEQUEUE") {
            events.push({
                type: "MUTATE",
                target: "queue",
                payload: { op: "DEQUEUE" }
            });

            i++;
            continue;
        }

        // ======================
        // SWAP
        // ======================
        if (line.startsWith("SWAP")) {
            const [, a, b] = line.split(" ");

            events.push({
                type: "MUTATE",
                target: "array",
                payload: {
                    op: "SWAP",
                    i: Number(a),
                    j: Number(b)
                }
            });

            i++;
            continue;
        }

        // ======================
        // POINTERS
        // ======================
        if (line.startsWith("POINTER") || line.startsWith("MOVE")) {
            const [, name, index] = line.split(" ");

            events.push({
                type: "POINTER",
                target: "array",
                payload: {
                    name,
                    position: Number(index)
                }
            });

            i++;
            continue;
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

            i++;
            continue;
        }

        // ======================
        // LINKED LIST
        // ======================
        if (line.startsWith("LIST_CREATE")) {
            const [, id, value] = line.split(" ");

            events.push({
                type: "LIST_CREATE",
                payload: { id, value: Number(value) }
            });

            i++;
            continue;
        }

        if (line.startsWith("LIST_LINK")) {
            const [, from, to] = line.split(" ");

            events.push({
                type: "LIST_LINK",
                payload: { from, to }
            });

            i++;
            continue;
        }

        if (line.startsWith("LIST_HEAD")) {
            const [, id] = line.split(" ");

            events.push({
                type: "LIST_HEAD",
                payload: { id }
            });

            i++;
            continue;
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

            i++;
            continue;
        }

        // ======================
        // VARIABLES
        // ======================
        if (line.startsWith("VAR")) {
            const [, name, value] = line.split(" ");

            events.push({
                type: "VAR",
                payload: {
                    name,
                    value: Number(value)
                }
            });

            i++;
            continue;
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

            i++;
            continue;
        }

        // ======================
        // FOR LOOP UNROLLING
        // ======================
        if (line.startsWith("FOR")) {
            const [, varName, startStr, endStr] = line.split(" ");

            const start = Number(startStr);
            const end = Number(endStr);

            const body = [];

            i++; // move inside loop

            while (i < lines.length && lines[i] !== "END") {
                body.push(lines[i]);
                i++;
            }

            i++; // skip END

            for (let v = start; v <= end; v++) {

                const substituted = body.map(b =>
                    b.replaceAll(varName, v)
                );

                const subEvents = parseCode(substituted.join("\n"));
                events.push(...subEvents);
            }

            continue;
        }

        // fallback (unknown line)
        i++;
    }

    return events;
}