import StackDisplay from "../components/visualizers/StackDisplay";

export function replayExecution(code) {
    const lines = code
        .split("\n")
        .map(l => l.trim())
        .filter(Boolean);

    const events = [];
    const variablesContext = {}
    let i = 0;

    const line = lines[i];


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

        if (line.startsWith("DECLARE")) {
            const [, name, value] = line.split(" ");

            variablesContext[name] = Number(value);

            events.push({
                type: "DECLARE_VAR",
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
                type: "ENTER_IF"
            });

            i++;
            continue;
        }

        if (line === "EXIT_IF") {

            events.push({
                type: "EXIT_IF"
            });

            i++;
            continue;
        }

        if (line === "ENTER_ELSE") {

            events.push({
                type: "ENTER_ELSE"
            });

            i++;
            continue;
        }

        if (line === "EXIT_ELSE") {

            events.push({
                type: "EXIT_ELSE"
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
                type: "RETURN"
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
                payload: {}
            });

            i++;
            continue;
        }

        if (line.startsWith("GRAPH_NODE")) {

            const [, id, value] = line.split(" ");

            events.push({
                type: "GRAPH_NODE",
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