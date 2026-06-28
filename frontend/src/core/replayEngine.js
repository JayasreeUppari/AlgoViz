export function replayExecution(code) {
    const rawLines = code.split("\n");

    const events = [];
    const variablesContext = {}
    let i = 0;



    while (i < rawLines.length) {

        const line = rawLines[i].trim();

        if (!line) {
            i++;
            continue;
        }



        // ======================
        // ARRAY
        // ======================
        if (line.startsWith("ARRAY ")) {
            const match = line.match(/^ARRAY\s+(\w+)\s+\[(.*)\]$/);

            if (!match) {
                i++;
                continue;
            }

            const name = match[1];

            const values = match[2]
                .split(",")
                .map(v => Number(v.trim()));

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "array",
                payload: {
                    name,
                    values
                }
            });

            i++;
            continue;
        }

        // ======================
        // ARRAY SET
        // ======================
        if (line.startsWith("ARRAY_SET")) {
            const [, name, index, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "array",
                payload: {
                    op: "SET",
                    name,
                    index: Number(index),
                    value: Number(value)
                }
            });

            i++;
            continue;
        }

        // ======================
        // ARRAY SWAP
        // ======================
        if (line.startsWith("ARRAY_SWAP")) {
            const [, name, left, right] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "array",
                payload: {
                    op: "SWAP",
                    name,
                    i: Number(left),
                    j: Number(right)
                }
            });

            i++;
            continue;
        }

        // ======================
        // POINTERS
        // ======================
        if (line.startsWith("POINTER") || line.startsWith("MOVE")) {
            const [, pointerName, arrayName, index] = line.split(" ");

            events.push({
                type: "POINTER",
                sourceLine: i,
                target: "array",
                payload: {
                    name: pointerName,
                    array: arrayName,
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
            const [, name, a, b] = line.split(" ");

            events.push({
                type: "COMPARE",
                sourceLine: i,
                target: "array",
                payload: {
                    name,
                    a: Number(a),
                    b: Number(b)
                }
            });

            i++;
            continue;
        }
        // ======================
        // STACK
        // ======================
        if (line.startsWith("STACK ")) {
            const [, name] = line.split(" ");

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "stack",
                payload: {
                    name
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("STACK_PUSH")) {
            const [, name, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "stack",
                payload: {
                    op: "PUSH",
                    name,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("STACK_POP")) {
            const [, name] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "stack",
                payload: {
                    op: "POP",
                    name
                }
            });

            i++;
            continue;
        }

        // ======================
        // QUEUE
        // ======================
        if (line.startsWith("QUEUE ")) {
            const [, name] = line.split(" ");

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "queue",
                payload: {
                    name
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("QUEUE_ENQUEUE")) {
            const [, name, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "queue",
                payload: {
                    op: "ENQUEUE",
                    name,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("QUEUE_DEQUEUE")) {
            const [, name] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "queue",
                payload: {
                    op: "DEQUEUE",
                    name
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
                sourceLine: i,
                payload: { id, value: Number(value) }
            });

            i++;
            continue;
        }

        if (line.startsWith("LIST_LINK")) {
            const [, from, to] = line.split(" ");

            events.push({
                type: "LIST_LINK",
                sourceLine: i,
                payload: { from, to }
            });

            i++;
            continue;
        }

        if (line.startsWith("LIST_HEAD")) {
            const [, id] = line.split(" ");

            events.push({
                type: "LIST_HEAD",
                sourceLine: i,
                payload: { id }
            });

            i++;
            continue;
        }

        if (line.startsWith("LIST_POINTER")) {
            const [, name, nodeId] = line.split(" ");

            events.push({
                type: "LIST_POINTER",
                sourceLine: i,
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

        if (line.startsWith("DECLARE")) {
            const [, name, value] = line.split(" ");

            variablesContext[name] = Number(value);

            events.push({
                type: "DECLARE_VAR",
                sourceLine: i,
                payload: {
                    name,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("SET ")) {
            const [, name, value] = line.split(" ");

            variablesContext[name] = Number(value);

            events.push({
                type: "SET_VAR",
                sourceLine: i,
                payload: {
                    name,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }
        // ======================
        // BRANCHES
        // ======================

        if (line === "ENTER_IF") {

            events.push({
                type: "ENTER_IF",
                sourceLine: i
            });

            i++;
            continue;
        }

        if (line === "EXIT_IF") {

            events.push({
                type: "EXIT_IF",
                sourceLine: i,
            });

            i++;
            continue;
        }

        if (line === "ENTER_ELSE") {

            events.push({
                type: "ENTER_ELSE",
                sourceLine: i,
            });

            i++;
            continue;
        }

        if (line === "EXIT_ELSE") {

            events.push({
                type: "EXIT_ELSE",
                sourceLine: i,
            });

            i++;
            continue;
        }
        // ======================
        // CALL STACK
        // ======================
        if (line.startsWith("CALL")) {

            const tokens = line.split(" ");

            const functionName = tokens[1];

            const params = {};

            for (let j = 2; j < tokens.length; j++) {

                const [key, value] = tokens[j].split("=");

                params[key] = value;
            }

            events.push({
                type: "CALL",
                sourceLine: i,
                payload: {
                    functionName,
                    params
                }
            });

            i++;
            continue;
        }
        if (line === "RETURN") {

            events.push({
                type: "RETURN",
                sourceLine: i,
            });

            i++;
            continue;
        }
        // ======================
        // HASHMAP
        // ======================
        if (line.startsWith("HASHMAP")) {
            const [, name] = line.split(" ");

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "hashMap",
                payload: {
                    name
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("MAP_PUT")) {
            const [, mapName, key, value] = line.split(" ");

            events.push({
                type: "MAP_PUT",
                sourceLine: i,
                target: "hashMap",
                payload: {
                    map: mapName,
                    key,
                    value: isNaN(value) ? value : Number(value)
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("MAP_REMOVE")) {
            const [, mapName, key] = line.split(" ");

            events.push({
                type: "MAP_REMOVE",
                sourceLine: i,
                target: "hashMap",
                payload: {
                    map: mapName,
                    key
                }
            });

            i++;
            continue;
        }
        // ======================
        // HASHSET
        // ======================
        if (line.startsWith("HASHSET")) {
            const [, name] = line.split(" ");

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "hashSet",
                payload: {
                    name
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("SET_ADD")) {
            const [, setName, value] = line.split(" ");

            events.push({
                type: "SET_ADD",
                sourceLine: i,
                target: "hashSet",
                payload: {
                    set: setName,
                    value: isNaN(value) ? value : Number(value)
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("SET_REMOVE")) {
            const [, setName, value] = line.split(" ");

            events.push({
                type: "SET_REMOVE",
                sourceLine: i,
                target: "hashSet",
                payload: {
                    set: setName,
                    value: isNaN(value) ? value : Number(value)
                }
            });

            i++;
            continue;
        }
        // ======================
        // TREE
        // ======================

        if (line.startsWith("TREE_NODE")) {
            const [, id, value] = line.split(" ");

            events.push({
                type: "TREE_NODE",
                sourceLine: i,
                payload: {
                    id,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_ROOT")) {
            const [, id] = line.split(" ");

            events.push({
                type: "TREE_ROOT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_CONNECT")) {
            const [, parent, child, side] = line.split(" ");

            events.push({
                type: "TREE_CONNECT",
                sourceLine: i,
                payload: {
                    parent,
                    child,
                    side
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_DISCONNECT")) {
            const [, parent, side] = line.split(" ");

            events.push({
                type: "TREE_DISCONNECT",
                sourceLine: i,
                payload: {
                    parent,
                    side
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_DELETE")) {
            const [, id] = line.split(" ");

            events.push({
                type: "TREE_DELETE",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_UPDATE_VAL")) {
            const [, id, value] = line.split(" ");

            events.push({
                type: "TREE_UPDATE_VAL",
                sourceLine: i,
                payload: {
                    id,
                    value: Number(value)
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_VISIT")) {
            const [, id] = line.split(" ");

            events.push({
                type: "TREE_VISIT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_HIGHLIGHT")) {
            const [, id] = line.split(" ");

            events.push({
                type: "TREE_HIGHLIGHT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }
        if (line.startsWith("TREE_UNHIGHLIGHT")) {
            const [, id] = line.split(" ");

            events.push({
                type: "TREE_UNHIGHLIGHT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }
        // =====================
        // GRAPHS
        // =====================

        if (line.startsWith("GRAPH_START")) {

            events.push({
                type: "GRAPH_START",
                sourceLine: i,
                payload: {}
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_NODE")) {

            const [, id, value] = line.split(" ");

            events.push({
                type: "GRAPH_NODE",
                sourceLine: i,
                payload: {
                    id,
                    value
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_CONNECT")) {

            const parts = line.split(" ");

            const from = parts[1];
            const to = parts[2];
            const weight = parts.length > 3 && parts[3] !== "null"
                ? Number(parts[3])
                : null;

            const directed = parts.length > 4
                ? parts[4] === "true"
                : false;

            events.push({
                type: "GRAPH_CONNECT",
                sourceLine: i,
                payload: {
                    from,
                    to,
                    weight,
                    directed
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_DISCONNECT")) {

            const [, from, to] = line.split(" ");

            events.push({
                type: "GRAPH_DISCONNECT",
                sourceLine: i,
                payload: {
                    from,
                    to
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_DELETE")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_DELETE",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_VISIT")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_VISIT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_UNVISIT")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_UNVISIT",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_HIGHLIGHT_NODE")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_HIGHLIGHT_NODE",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_UNHIGHLIGHT_NODE")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_UNHIGHLIGHT_NODE",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_HIGHLIGHT_EDGE")) {

            const [, from, to] = line.split(" ");

            events.push({
                type: "GRAPH_HIGHLIGHT_EDGE",
                sourceLine: i,
                payload: {
                    from,
                    to
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_UNHIGHLIGHT_EDGE")) {

            const [, from, to] = line.split(" ");

            events.push({
                type: "GRAPH_UNHIGHLIGHT_EDGE",
                sourceLine: i,
                payload: {
                    from,
                    to
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_UPDATE_VAL")) {

            const [, id, value] = line.split(" ");

            events.push({
                type: "GRAPH_UPDATE_VAL",
                sourceLine: i,
                payload: {
                    id,
                    value
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_UPDATE_WEIGHT")) {

            const [, from, to, weight] = line.split(" ");

            events.push({
                type: "GRAPH_UPDATE_WEIGHT",
                sourceLine: i,
                payload: {
                    from,
                    to,
                    weight: Number(weight)
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_COLOR_NODE")) {

            const [, id, color] = line.split(" ");

            events.push({
                type: "GRAPH_COLOR_NODE",
                sourceLine: i,
                payload: {
                    id,
                    color
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_COLOR_EDGE")) {

            const [, from, to, color] = line.split(" ");

            events.push({
                type: "GRAPH_COLOR_EDGE",
                sourceLine: i,
                payload: {
                    from,
                    to,
                    color
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_RESET_NODE_COLOR")) {

            const [, id] = line.split(" ");

            events.push({
                type: "GRAPH_RESET_NODE_COLOR",
                sourceLine: i,
                payload: {
                    id
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_RESET_EDGE_COLOR")) {

            const [, from, to] = line.split(" ");

            events.push({
                type: "GRAPH_RESET_EDGE_COLOR",
                sourceLine: i,
                payload: {
                    from,
                    to
                }
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_CLEAR")) {

            events.push({
                type: "GRAPH_CLEAR",
                sourceLine: i,
                payload: {}
            });

            i++;
            continue;
        }
        // ======================
        // MATRIX
        // ======================
        if (line.startsWith("MATRIX_CREATE")) {
            const [, name, rows, cols] = line.split(" ");

            events.push({
                type: "CREATE",
                sourceLine: i,
                target: "matrix",
                payload: {
                    name,
                    rows: Number(rows),
                    cols: Number(cols)
                }
            });

            i++;
            continue;
        }
        // ======================
        // MATRIX SET
        // ======================
        if (line.startsWith("MATRIX_SET")) {
            const [, name, row, col, value] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "matrix",
                payload: {
                    op: "SET",
                    name,
                    row: Number(row),
                    col: Number(col),
                    value: Number(value)
                }
            });

            i++;
            continue;
        }
        // ======================
        // MATRIX GET
        // ======================
        if (line.startsWith("MATRIX_GET")) {
            const [, name, row, col] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "matrix",
                payload: {
                    op: "GET",
                    name,
                    row: Number(row),
                    col: Number(col)
                }
            });

            i++;
            continue;
        }
        // ======================
        // MATRIX HIGHLIGHT
        // ======================
        if (line.startsWith("MATRIX_HIGHLIGHT")) {
            const [, name, row, col] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "matrix",
                payload: {
                    op: "HIGHLIGHT",
                    name,
                    row: Number(row),
                    col: Number(col)
                }
            });

            i++;
            continue;
        }
        // ======================
        // MATRIX UNHIGHLIGHT
        // ======================
        if (line.startsWith("MATRIX_UNHIGHLIGHT")) {

            const [, name] = line.split(" ");

            events.push({
                type: "MUTATE",
                sourceLine: i,
                target: "matrix",
                payload: {
                    op: "UNHIGHLIGHT",
                    name
                }
            });

            i++;
            continue;
        }
        // fallback (unknown line)
        i++;
    }

    return events;
}