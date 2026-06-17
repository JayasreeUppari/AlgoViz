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
        hashSet: [],

        list: {
            nodes: {},
            head: null
        },

        tree: {
            nodes: [],
            edges: []
        },

        graph: {
            nodes: [],
            edges: []
        },

        pointers: {},

        highlights: {
            compare: [],
            swap: [],
            visit: [],
            active: []
        }
    };

    for (let i = 0; i <= currentStep && i < events.length; i++) {
        const event = events[i];
        if (!event) continue;

        switch (event.type) {

            // =========================
            // CREATE
            // =========================
            case "CREATE":
                if (event.target === "array") {
                    state.array = [...event.payload.value];
                }

                if (event.target === "stack") {
                    state.stack = [];
                }

                if (event.target === "queue") {
                    state.queue = [];
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
                break;

            // =========================
            // POINTER
            // =========================
            case "POINTER":
                state.pointers[event.payload.name] =
                    event.payload.position;
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
            case "VAR":
                state.variables[event.payload.name] =
                    event.payload.value;
                break;
            case "SET_VAR":
                state.variables[event.payload.name] =
                    event.payload.value;
                break;
        }
    }
    console.log("POINTERS:", state.pointers);

    return state;
}