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

export function getStateAt(events = [], currentStep = 0) {
    const state = {
        line: null,

        variables: {},

        callStack: [],

        array: [],
        stack: [],
        queue: [],

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
    console.log(events);
    for (let i = 0; i <= currentStep && i < events.length; i++) {
        const event = events[i];
        if (!event) continue;

        switch (event.type) {

            case "CREATE":
                switch (event.target) {
                    case "array":
                        state.array = [...event.payload.value];
                        break;

                    case "stack":
                        state.stack = [];
                        break;

                    case "queue":
                        state.queue = [];
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

                    if (p.op === "UPDATE") {
                        state.array[p.index] = p.value;
                    }

                    if (p.op === "SWAP") {
                        const temp = state.array[p.i];
                        state.array[p.i] = state.array[p.j];
                        state.array[p.j] = temp;
                    }
                }

                if (event.target === "stack") {
                    const p = event.payload;

                    if (p.op === "PUSH") state.stack.push(p.value);
                    if (p.op === "POP") state.stack.pop();
                }

                if (event.target === "queue") {
                    const p = event.payload;

                    if (p.op === "ENQUEUE") state.queue.push(p.value);
                    if (p.op === "DEQUEUE") state.queue.shift();
                }
                if (event.target === "matrix") {
                    const p = event.payload;

                    if (p.op === "SET") {
                        state.matrix[p.name].values[p.row][p.col] = p.value;
                    }

                    if (p.op === "GET") {
                        state.matrix[p.name].highlights = [{
                            row: p.row,
                            col: p.col
                        }];
                    }

                    if (p.op === "HIGHLIGHT") {
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
            case "POINTER":
                state.pointers[event.payload.name] = {
                    type: event.payload.type || "INDEX",
                    position: event.payload.position
                };
                break;

            // =========================
            // COMPARE
            // =========================
            case "COMPARE":
                state.highlights.compare = [
                    event.payload.a,
                    event.payload.b
                ];
                break;
            case "LIST_CREATE": {
                const id = event.payload.id;
                const value = event.payload.value;

                state.list.nodes[id] = {
                    id,
                    value,
                    next: null
                };
                if (state.list.head === null) {
                    const firstNode = Object.keys(state.list.nodes)[0];
                    state.list.head = firstNode;
                }
                break;
            }

            case "LIST_LINK": {
                const { from, to } = event.payload;
                state.list.nodes[from].next = to;
                break;
            }

            case "LIST_HEAD": {
                state.list.head = event.payload.id;
                break;
            }

            case "LIST_POINTER": {
                state.pointers[event.payload.name] = event.payload.position;
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
                    params: event.payload.params || {}
                });
                break;

            case "RETURN":
                state.callStack.pop();
                break;
            // ==============
            // ===HASHMAP====
            // ==============
            case "MAP_PUT":
                state.hashMap[event.payload.map][event.payload.key] =
                    event.payload.value;
                break;
            case "MAP_REMOVE":
                delete state.hashMap[event.payload.map][event.payload.key];
                break;
            // ==============
            // ===HASHSET====
            // ==============

            case "SET_ADD": {
                const set = state.hashSet[event.payload.set];

                if (!set.includes(event.payload.value)) {
                    set.push(event.payload.value);
                }

                break;
            }
            case "SET_REMOVE":
                state.hashSet[event.payload.set] =
                    state.hashSet[event.payload.set].filter(
                        value => value !== event.payload.value
                    );
                break;
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

                // Remove child from any old parent
                Object.values(state.tree.nodes).forEach(node => {

                    if (node.left === child)
                        node.left = null;

                    if (node.right === child)
                        node.right = null;
                });

                // Connect to new parent
                if (side === "left")
                    state.tree.nodes[parent].left = child;
                else
                    state.tree.nodes[parent].right = child;

                break;
            }

            case "TREE_DISCONNECT":
                state.tree.nodes[event.payload.parent][event.payload.side] =
                    null;
                break;

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

            case "TREE_UPDATE_VAL":
                state.tree.nodes[event.payload.id].value =
                    event.payload.value;
                break;

            case "TREE_VISIT":
                state.highlights.visit = [event.payload.id];
                break;

            case "TREE_HIGHLIGHT":
                if (!state.highlights.active.includes(event.payload.id)) {
                    state.highlights.active.push(event.payload.id);
                }
                break;

            case "TREE_UNHIGHLIGHT":
                state.highlights.active =
                    state.highlights.active.filter(
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

            case "GRAPH_CONNECT":
                state.graph.edges.push({
                    from: event.payload.from,
                    to: event.payload.to,
                    weight: event.payload.weight ?? null,
                    directed: event.payload.directed ?? false,
                    highlighted: false,
                    color: null
                });
                break;

            case "GRAPH_DISCONNECT":
                state.graph.edges = state.graph.edges.filter(
                    edge =>
                        !(edge.from === event.payload.from &&
                            edge.to === event.payload.to)
                );
                break;

            case "GRAPH_DELETE":
                delete state.graph.nodes[event.payload.id];

                state.graph.edges = state.graph.edges.filter(
                    edge =>
                        edge.from !== event.payload.id &&
                        edge.to !== event.payload.id
                );
                break;

            case "GRAPH_VISIT":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].visited = true;
                }
                break;

            case "GRAPH_UNVISIT":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].visited = false;
                }
                break;

            case "GRAPH_HIGHLIGHT_NODE":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].highlighted = true;
                }
                break;

            case "GRAPH_UNHIGHLIGHT_NODE":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].highlighted = false;
                }
                break;

            case "GRAPH_HIGHLIGHT_EDGE":
                state.graph.edges.forEach(edge => {
                    if (
                        edge.from === event.payload.from &&
                        edge.to === event.payload.to
                    ) {
                        edge.highlighted = true;
                    }
                });
                break;

            case "GRAPH_UNHIGHLIGHT_EDGE":
                state.graph.edges.forEach(edge => {
                    if (
                        edge.from === event.payload.from &&
                        edge.to === event.payload.to
                    ) {
                        edge.highlighted = false;
                    }
                });
                break;

            case "GRAPH_UPDATE_VAL":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].value = event.payload.value;
                }
                break;

            case "GRAPH_UPDATE_WEIGHT":
                state.graph.edges.forEach(edge => {
                    if (
                        edge.from === event.payload.from &&
                        edge.to === event.payload.to
                    ) {
                        edge.weight = event.payload.weight;
                    }
                });
                break;

            case "GRAPH_COLOR_NODE":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].color = event.payload.color;
                }
                break;

            case "GRAPH_COLOR_EDGE":
                state.graph.edges.forEach(edge => {
                    if (
                        edge.from === event.payload.from &&
                        edge.to === event.payload.to
                    ) {
                        edge.color = event.payload.color;
                    }
                });
                break;

            case "GRAPH_RESET_NODE_COLOR":
                if (state.graph.nodes[event.payload.id]) {
                    state.graph.nodes[event.payload.id].color = null;
                }
                break;

            case "GRAPH_RESET_EDGE_COLOR":
                state.graph.edges.forEach(edge => {
                    if (
                        edge.from === event.payload.from &&
                        edge.to === event.payload.to
                    ) {
                        edge.color = null;
                    }
                });
                break;

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