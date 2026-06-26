export function layoutLinkedList(list) {

    if (!list?.nodes) {
        return {
            components: [],
            positions: {}
        };
    }

    const nodes = list.nodes;

    const hasIncoming = new Set();

    Object.values(nodes).forEach(node => {
        if (node.next) {
            hasIncoming.add(node.next);
        }
    });

    const roots = Object.keys(nodes)
        .filter(id => !hasIncoming.has(id));

    const visited = new Set();

    const components = [];
    const positions = {};

    let startY = 100;

    roots.forEach(root => {

        const component = [];

        let current = root;
        let x = 100;

        while (
            current &&
            nodes[current] &&
            !visited.has(current)
        ) {

            visited.add(current);

            component.push(current);

            positions[current] = {
                x,
                y: startY
            };

            x += 180;

            current = nodes[current].next;
        }

        components.push(component);

        startY += 140;
    });

    // orphan cycles / disconnected weird structures
    Object.keys(nodes).forEach(id => {

        if (visited.has(id)) return;

        const component = [];

        let current = id;
        let x = 100;

        while (
            current &&
            nodes[current] &&
            !visited.has(current)
        ) {

            visited.add(current);

            component.push(current);

            positions[current] = {
                x,
                y: startY
            };

            x += 180;

            current = nodes[current].next;
        }

        components.push(component);

        startY += 140;
    });

    return {
        components,
        positions
    };
}