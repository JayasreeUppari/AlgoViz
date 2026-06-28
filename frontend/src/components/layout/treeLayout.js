const START_X = 100;
const START_Y = 80;

const LEVEL_HEIGHT = 120;
const HORIZONTAL_GAP = 100;

const ORPHAN_GAP = 100;

export function layoutTree(tree) {

    const positions = {};

const visited = new Set();

let currentX = 0;
let maxDepth = 0;

// Only run DFS if a root exists

    

    function dfs(nodeId, depth) {

        if (!nodeId)
            return;

        const node = tree.nodes[nodeId];

        if (!node)
            return;

        visited.add(nodeId);

        maxDepth = Math.max(maxDepth, depth);

        dfs(node.left, depth + 1);

        positions[nodeId] = {
            x: START_X + currentX * HORIZONTAL_GAP,
            y: START_Y + depth * LEVEL_HEIGHT
        };
        currentX++;

        dfs(node.right, depth + 1);
    }

    // Layout connected tree
    if (tree.root) {
        dfs(tree.root, 0);
    }

    // Place orphan nodes below the tree
    const orphanY =
        START_Y + (maxDepth + 2) * LEVEL_HEIGHT;

    let orphanIndex = 0;

    Object.keys(tree.nodes).forEach(id => {

        if (visited.has(id))
            return;

        positions[id] = {
            x: START_X + orphanIndex * ORPHAN_GAP,
            y: orphanY
        };

        orphanIndex++;
    });

    return positions;
}