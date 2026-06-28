export function getMessage(event) {
    if (!event) return "Ready";

    switch (event.type) {
        case "CREATE":
            return `Created ${event.target}`;

        case "MUTATE":
            return `${event.target} operation`;

        case "POINTER":
            return `${event.payload.name} at ${event.payload.position}`;

        case "COMPARE":
            return `Comparing ${event.payload.a} and ${event.payload.b}`;

        default:
            return event.type;
    }
}
function isValidCell(matrix, row, col) {
    if (!matrix) return false;
    if (!matrix.values?.length) return false;

    return (
        row >= 0 &&
        row < matrix.values.length &&
        col >= 0 &&
        col < matrix.values[row].length
    );
}
function reportMissing(state, event, kind, name) {
    state.errors.push({
        line: event.sourceLine,
        type: event.type,
        message: `${kind} '${name}' not found. It may not have been created before this step, or the name may be misspelled.`
    });
}
export function getStateAt(events = [], currentStep = 0) {
    const state = {
        currentLine: null,
        errors: [],
        variables: {},

        callStack: [],

        arrays: {},
        stacks: {},
        queues: {},

        hashMap: {},
        hashSet: {},

        list: {
            nodes: {},
            head: null
        },

        tree: {
            nodes: {},
            root: null
        },

        graph: {
            nodes: {},
            edges: []
        },

        pointers: {},

        highlights: {
            compare: [],
            swap: [],
            visit: [],
            active: []
        },
        matrix: {}
    };
    // console.log(events);
    for (let i = 0; i <= currentStep && i < events.length; i++) {
        const event = events[i];
        state.currentLine = event.sourceLine;
        if (!event) continue;
        switch (event.type) {

            case "CREATE":
                switch (event.target) {

                    case "array":
                        state.arrays[event.payload.name] = [...event.payload.values];
                        break;

                    case "stack":
                        state.stacks[event.payload.name] = [];
                        break;

                    case "queue":
                        state.queues[event.payload.name] = [];
                        break;

                    case "hashMap":
                        state.hashMap[event.payload.name] = {};
                        break;

                    case "hashSet":
                        state.hashSet[event.payload.name] = [];
                        break;

                    case "matrix":
                        state.matrix[event.payload.name] = {
                            rows: event.payload.rows,
                            cols: event.payload.cols,
                            values: Array.from(
                                { length: event.payload.rows },
                                () => Array(event.payload.cols).fill(null)
                            ),
                            highlights: []
                        };
                        break;
                }
                break;


            // =========================
            // MUTATE
            // =========================
            case "MUTATE":

                if (event.target === "array") {
                    const p = event.payload;
                    const arr = state.arrays[p.name];

                    if (!arr) {
                        reportMissing(state, event, "Array", p.name);
                        break;
                    }

                    if (p.op === "SET") {
                        if (p.index < 0 || p.index >= arr.length) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cannot set index ${p.index} on array '${p.name}': out of bounds (length ${arr.length}).`
                            });
                            break;
                        }
                        arr[p.index] = p.value;

                        state.highlights.active = {
                            array: p.name,
                            indices: [p.index]
                        };
                    }

                    if (p.op === "SWAP") {
                        if (p.i < 0 || p.i >= arr.length || p.j < 0 || p.j >= arr.length) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cannot swap indices (${p.i}, ${p.j}) on array '${p.name}': out of bounds (length ${arr.length}).`
                            });
                            break;
                        }
                        const temp = arr[p.i];
                        arr[p.i] = arr[p.j];
                        arr[p.j] = temp;

                        state.highlights.swap = {
                            array: p.name,
                            indices: [p.i, p.j]
                        };
                    }
                }

                if (event.target === "stack") {
                    const p = event.payload;
                    const stack = state.stacks[p.name];

                    if (!stack) {
                        reportMissing(state, event, "Stack", p.name);
                        break;
                    }

                    if (p.op === "PUSH") stack.push(p.value);

                    if (p.op === "POP") {
                        if (stack.length === 0) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cannot pop from stack '${p.name}': it is empty.`
                            });
                            break;
                        }
                        stack.pop();
                    }
                }

                if (event.target === "queue") {
                    const p = event.payload;
                    const queue = state.queues[p.name];

                    if (!queue) {
                        reportMissing(state, event, "Queue", p.name);
                        break;
                    }

                    if (p.op === "ENQUEUE") queue.push(p.value);

                    if (p.op === "DEQUEUE") {
                        if (queue.length === 0) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cannot dequeue from queue '${p.name}': it is empty.`
                            });
                            break;
                        }
                        queue.shift();
                    }
                }

                // break;
                if (event.target === "matrix") {

                    const p = event.payload;
                    const matrix = state.matrix[p.name];
                    if (!matrix) {
                        reportMissing(state, event, "Matrix", p.name);
                        break;
                    }
                    if (p.op === "SET") {
                        if (!isValidCell(matrix, p.row, p.col)) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cell (${p.row}, ${p.col}) is out of bounds for matrix '${p.name}'.`
                            });
                            break;
                        }
                        state.matrix[p.name].values[p.row][p.col] = p.value;
                    }

                    if (p.op === "GET") {
                        if (!isValidCell(matrix, p.row, p.col)) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cell (${p.row}, ${p.col}) is out of bounds for matrix '${p.name}'.`
                            });
                            break;
                        }
                        state.matrix[p.name].highlights = [{
                            row: p.row,
                            col: p.col
                        }];
                    }

                    if (p.op === "HIGHLIGHT") {
                        if (!isValidCell(matrix, p.row, p.col)) {
                            state.errors.push({
                                line: event.sourceLine,
                                type: event.type,
                                message: `Cell (${p.row}, ${p.col}) is out of bounds for matrix '${p.name}'.`
                            });
                            break;
                        }
                        state.matrix[p.name].highlights.push({
                            row: p.row,
                            col: p.col
                        });
                    }

                    if (p.op === "UNHIGHLIGHT") {
                        state.matrix[p.name].highlights = [];
                    }
                }
                break;


            // =========================
            // POINTER
            // =========================
            case "POINTER": {
                const { name, array: arrName, position } = event.payload;
                const arr = state.arrays[arrName];

                if (!arr) {
                    reportMissing(state, event, "Array", arrName);
                    break;
                }

                if (position < 0 || position >= arr.length) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Pointer '${name}' set to index ${position}, which is out of bounds for array '${arrName}' (length ${arr.length}).`
                    });
                    break;
                }

                state.pointers[name] = {
                    type: event.payload.type || "INDEX",
                    array: arrName,
                    position
                };
                break;
            }
            // =========================
            // COMPARE
            // =========================
            case "COMPARE": {
                const { name, a, b } = event.payload;
                const arr = state.arrays[name];

                if (!arr) {
                    reportMissing(state, event, "Array", name);
                    break;
                }

                if (a < 0 || a >= arr.length || b < 0 || b >= arr.length) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Compare indices (${a}, ${b}) out of bounds for array '${name}' (length ${arr.length}).`
                    });
                    break;
                }

                state.highlights.compare = { array: name, indices: [a, b] };
                break;
            }
            case "LIST_CREATE": {
                const id = event.payload.id;
                const value = event.payload.value;

                state.list.nodes[id] = {
                    id,
                    value,
                    next: null
                };

                break;
            }

            case "LIST_LINK": {
                const { from, to } = event.payload;
                if (!state.list.nodes[from]) { reportMissing(state, event, "List node", from); break; }
                if (!state.list.nodes[to]) { reportMissing(state, event, "List node", to); break; }
                state.list.nodes[from].next = to;
                break;
            }

            case "LIST_HEAD": {
                const { id } = event.payload;
                if (!state.list.nodes[id]) { reportMissing(state, event, "List node", id); break; }
                state.list.head = id;
                break;
            }

            case "LIST_POINTER": {
                const { name, position } = event.payload;
                if (!state.list.nodes[position]) { reportMissing(state, event, "List node", position); break; }
                state.pointers[name] = position;
                break;
            }
            case "DECLARE_VAR":
                state.variables[event.payload.name] =
                    event.payload.value;
                break;
            case "SET_VAR":
                state.variables[event.payload.name] =
                    event.payload.value;
                break;
            case "CALL":
                state.callStack.push({
                    functionName: event.payload.functionName,
                    params: {
                        ...(event.payload.params || {})
                    }
                });
                break;

            case "RETURN":
                state.callStack.pop();
                break;
            // HASHMAP
            case "MAP_PUT": {
                const map = state.hashMap[event.payload.map];
                if (!map) {
                    reportMissing(state, event, "HashMap", event.payload.map);
                    break;
                }

                map[event.payload.key] = event.payload.value;
                break;
            }

            case "MAP_REMOVE": {
                const map = state.hashMap[event.payload.map];
                if (!map) {
                    reportMissing(state, event, "HashMap", event.payload.map);
                    break;
                }

                if (!(event.payload.key in map)) {
                    reportMissing(state, event, `Key '${event.payload.key}' not found in HashMap '${event.payload.map}'`);
                    break;
                }

                delete map[event.payload.key];
                break;
            }

            // ======================
            // HASHSET
            // ======================

            case "SET_ADD": {
                const set = state.hashSet[event.payload.set];
                if (!set) {
                    reportMissing(state, event, "HashSet", event.payload.set);
                    break;
                }

                if (!set.includes(event.payload.value)) {
                    set.push(event.payload.value);
                }

                break;
            }

            case "SET_REMOVE": {
                const set = state.hashSet[event.payload.set];
                if (!set) {
                    reportMissing(state, event, "HashSet", event.payload.set);
                    break;
                }

                if (!set.includes(event.payload.value)) {
                    reportMissing(state, event, `Value '${event.payload.value}' not found in HashSet '${event.payload.set}'`);
                    break;
                }

                state.hashSet[event.payload.set] = set.filter(
                    value => value !== event.payload.value
                );

                break;
            }
            // ====================
            // TREES
            // ====================

            case "TREE_NODE":
                state.tree.nodes[event.payload.id] = {
                    value: event.payload.value,
                    left: null,
                    right: null
                };
                break;

            case "TREE_ROOT":
                state.tree.root = event.payload.id;
                break;

            case "TREE_CONNECT": {
                const { parent, child, side } = event.payload;
                if (!state.tree.nodes[parent]) { reportMissing(state, event, "Tree node", parent); break; }
                if (!state.tree.nodes[child]) { reportMissing(state, event, "Tree node", child); break; }

                Object.values(state.tree.nodes).forEach(node => {
                    if (node.left === child) node.left = null;
                    if (node.right === child) node.right = null;
                });

                if (side === "left") state.tree.nodes[parent].left = child;
                else state.tree.nodes[parent].right = child;
                break;
            }


            case "TREE_DISCONNECT": {
                const { parent, side } = event.payload;
                if (!state.tree.nodes[parent]) { reportMissing(state, event, "Tree node", parent); break; }
                state.tree.nodes[parent][side] = null;
                break;
            }

            case "TREE_DELETE": {

                const id = event.payload.id;

                // Remove references from all parents
                Object.values(state.tree.nodes).forEach(node => {

                    if (node.left === id)
                        node.left = null;

                    if (node.right === id)
                        node.right = null;
                });

                // Remove root if necessary
                if (state.tree.root === id)
                    state.tree.root = null;

                delete state.tree.nodes[id];

                break;
            }

            case "TREE_UPDATE_VAL": {
                const { id, value } = event.payload;
                if (!state.tree.nodes[id]) { reportMissing(state, event, "Tree node", id); break; }
                state.tree.nodes[id].value = value;
                break;
            }

            case "TREE_VISIT":
                if (!state.highlights.treeVisit) state.highlights.treeVisit = [];
                state.highlights.treeVisit.push(event.payload.id);
                break;

            case "TREE_HIGHLIGHT":
                if (!state.highlights.treeActive) state.highlights.treeActive = [];
                if (!state.highlights.treeActive.includes(event.payload.id)) {
                    state.highlights.treeActive.push(event.payload.id);
                }
                break;

            case "TREE_UNHIGHLIGHT":
                if (!state.highlights.treeActive) state.highlights.treeActive = [];
                state.highlights.treeActive =
                    state.highlights.treeActive.filter(
                        id => id !== event.payload.id
                    );
                break;

            // =====================
            // GRAPHS
            // =====================

            case "GRAPH_START":
                state.graph = {
                    nodes: {},
                    edges: []
                };
                break;

            case "GRAPH_NODE":
                state.graph.nodes[event.payload.id] = {
                    value: event.payload.value,
                    visited: false,
                    highlighted: false,
                    color: null
                };
                break;

            case "GRAPH_CONNECT": {
                const { from, to, weight, directed } = event.payload;
                if (!state.graph.nodes[from]) { reportMissing(state, event, "Graph node", from); break; }
                if (!state.graph.nodes[to]) { reportMissing(state, event, "Graph node", to); break; }
                state.graph.edges.push({
                    from,
                    to,
                    weight: weight ?? null,
                    directed: directed ?? false,
                    highlighted: false,
                    color: null
                });
                break;
            }

            case "GRAPH_DISCONNECT": {
                const { from, to } = event.payload;
                const exists = state.graph.edges.some(
                    edge => edge.from === from && edge.to === to
                );
                if (!exists) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                state.graph.edges = state.graph.edges.filter(
                    edge => !(edge.from === from && edge.to === to)
                );
                break;
            }

            case "GRAPH_DELETE": {
                const { id } = event.payload;
                if (!state.graph.nodes[id]) { reportMissing(state, event, "Graph node", id); break; }
                delete state.graph.nodes[id];

                state.graph.edges = state.graph.edges.filter(
                    edge => edge.from !== id && edge.to !== id
                );
                break;
            }

            case "GRAPH_VISIT": {
                const { id } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.visited = true;
                break;
            }

            case "GRAPH_UNVISIT": {
                const { id } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.visited = false;
                break;
            }

            case "GRAPH_HIGHLIGHT_NODE": {
                const { id } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.highlighted = true;
                break;
            }

            case "GRAPH_UNHIGHLIGHT_NODE": {
                const { id } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.highlighted = false;
                break;
            }

            case "GRAPH_HIGHLIGHT_EDGE": {
                const { from, to } = event.payload;
                const edge = state.graph.edges.find(e => e.from === from && e.to === to);
                if (!edge) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                edge.highlighted = true;
                break;
            }

            case "GRAPH_UNHIGHLIGHT_EDGE": {
                const { from, to } = event.payload;
                const edge = state.graph.edges.find(e => e.from === from && e.to === to);
                if (!edge) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                edge.highlighted = false;
                break;
            }

            case "GRAPH_UPDATE_VAL": {
                const { id, value } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.value = value;
                break;
            }

            case "GRAPH_UPDATE_WEIGHT": {
                const { from, to, weight } = event.payload;
                const edge = state.graph.edges.find(e => e.from === from && e.to === to);
                if (!edge) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                edge.weight = weight;
                break;
            }

            case "GRAPH_COLOR_NODE": {
                const { id, color } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.color = color;
                break;
            }

            case "GRAPH_COLOR_EDGE": {
                const { from, to, color } = event.payload;
                const edge = state.graph.edges.find(e => e.from === from && e.to === to);
                if (!edge) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                edge.color = color;
                break;
            }

            case "GRAPH_RESET_NODE_COLOR": {
                const { id } = event.payload;
                const node = state.graph.nodes[id];
                if (!node) { reportMissing(state, event, "Graph node", id); break; }
                node.color = null;
                break;
            }

            case "GRAPH_RESET_EDGE_COLOR": {
                const { from, to } = event.payload;
                const edge = state.graph.edges.find(e => e.from === from && e.to === to);
                if (!edge) {
                    state.errors.push({
                        line: event.sourceLine,
                        type: event.type,
                        message: `Edge from '${from}' to '${to}' not found. It may not have been connected before this step.`
                    });
                    break;
                }
                edge.color = null;
                break;
            }

            case "GRAPH_CLEAR":
                state.graph = {
                    nodes: {},
                    edges: []
                };
                break;


        }
    }

    return state;
}