const NODE_RADIUS = 25;
const GRAPH_RADIUS = 180;
const CENTER_X = 300;
const CENTER_Y = 220;

export function computeGraphLayout(graph) {

    const positions = {};

    if (!graph || !graph.nodes) {
        return positions;
    }

    const nodeIds = Object.keys(graph.nodes);

    const n = nodeIds.length;

    if (n === 0) {
        return positions;
    }

    nodeIds.forEach((id, index) => {

        const angle = (2 * Math.PI * index) / n;

        positions[id] = {

            x: CENTER_X + GRAPH_RADIUS * Math.cos(angle),

            y: CENTER_Y + GRAPH_RADIUS * Math.sin(angle),

            r: NODE_RADIUS

        };

    });

    return positions;
}