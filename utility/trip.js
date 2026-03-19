function randomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

class Trip {
    constructor(world) {
        this.world = world;

        setInterval(() => {
            const validSegments = Object.keys(this.world.segments).filter(
                key => !this.world.segments[key].isInternal
            );

            if (validSegments.length === 0) return;

            const startId = validSegments[Math.floor(Math.random() * validSegments.length)];
            const endId = validSegments[Math.floor(Math.random() * validSegments.length)];

            const path = this.getShortestPath(startId, endId);

            if (path && path.length > 0) {
                const newCar = new Car(this.world, path, randomColor());
                this.world.cars.push(newCar);
            }
        }, 1000);
    }

    getDistance(circleA, circleB) {
        const dx = circleA.x - circleB.x;
        const dy = circleA.y - circleB.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getShortestPath(startSegId, endSegId) {
        const startSeg = this.world.segments[startSegId];
        const endSeg = this.world.segments[endSegId];

        if (!startSeg || !endSeg) {
            console.error("Invalid start or end segment ID");
            return null;
        }

        if (startSegId == endSegId) {
            return [Number(startSegId)];
        }

        const startNode = startSeg.end;
        const targetNode = endSeg.start;

        const unvisited = new Set();
        const distances = new Map();
        const previous = new Map();

        for (const key in this.world.circle) {
            const circle = this.world.circle[key];
            unvisited.add(circle);
            distances.set(circle, Infinity);
        }
        for (const key in this.world.laneNodes) {
            const laneNode = this.world.laneNodes[key];
            unvisited.add(laneNode);
            distances.set(laneNode, Infinity);
        }

        distances.set(startNode, 0);

        while (unvisited.size > 0) {
            let current = null;
            let minDistance = Infinity;

            for (const node of unvisited) {
                if (distances.get(node) < minDistance) {
                    minDistance = distances.get(node);
                    current = node;
                }
            }

            if (current === null || current === targetNode) {
                break;
            }

            unvisited.delete(current);

            for (const segId of current.SegmentId) {
                const segment = this.world.segments[segId];

                if (segment.start === current) {
                    const neighbor = segment.end;

                    if (unvisited.has(neighbor)) {
                        const cost = segment.length !== undefined ? segment.length : this.getDistance(current, neighbor);
                        const alt = distances.get(current) + cost;

                        if (alt < distances.get(neighbor)) {
                            distances.set(neighbor, alt);
                            previous.set(neighbor, { node: current, segId: Number(segId) });
                        }
                    }
                }
            }
        }

        if (distances.get(targetNode) === Infinity && startNode !== targetNode) {
            console.warn("No path found between segment " + startSegId + " and " + endSegId);
            return null;
        }

        const pathSegIds = [];
        let currNode = targetNode;

        while (currNode !== startNode) {
            const prevData = previous.get(currNode);
            pathSegIds.unshift(prevData.segId);
            currNode = prevData.node;
        }

        return [Number(startSegId), ...pathSegIds, Number(endSegId)];
    }
}
