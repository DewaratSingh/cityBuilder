class World {
    constructor(canvas, camera) {
        this.intersections = {}; // Store computed intersection polygons keyed by circle ID
        this.circleIdCount = 0;
        this.circle = {}; // Big intersection nodes

        this.laneNodeIdCount = 0;
        this.laneNodes = {}; // Tiny lane-specific nodes for snapping

        this.segmentIdCount = 0;
        this.segments = {};

        this.roadIdCount = 0;
        this.roads = {};

        this.hoveredSegmentId = null;

        this.draftRoad = null;
        this.draftStartCircle = null; // Will point to either a Circle or a LaneNode

        this.draftSplinePoints = [];
        this.mouseTarget = null;

        this.canvas = canvas;
        this.camera = camera;
        this.roadConstructor = new ConstructRoad(this);
        this.#addEventListeners();
    }

    getHoveredCircle(x, y) {
        for (const key in this.circle) {
            let circ = this.circle[key];
            let dx = circ.x - x;
            let dy = circ.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < circ.radius + 10) {
                return circ;
            }
        }
        return null;
    }

    getHoveredLaneNode(x, y) {
        for (const key in this.laneNodes) {
            let node = this.laneNodes[key];
            let dx = node.x - x;
            let dy = node.y - y;
            if (Math.sqrt(dx * dx + dy * dy) < node.radius + 10) {
                return node;
            }
        }
        return null;
    }

    getRelevantHoveredNode(x, y) {
        let circle = this.getHoveredCircle(x, y);
        if (circle) return circle;

        if (window.segmentType === "ONE_WAY_ROAD") {
            return this.getHoveredLaneNode(x, y);
        }
        return null;
    }

    getHoveredSegment(x, y) {
        let hitDist = 10;
        let closestSegId = null;
        let minDist = Infinity;

        for (const key in this.segments) {
            let seg = this.segments[key];
            if (!seg.start || !seg.end) continue;

            let pts = seg.curvePoints || [seg.start, seg.end];
            for (let i = 0; i < pts.length - 1; i++) {
                let p1 = pts[i];
                let p2 = pts[i + 1];

                // Point to line segment distance
                let l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                let t = Math.max(0, Math.min(1, ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / (l2 || 1)));
                let projection = {
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                };
                let dist = Math.hypot(x - projection.x, y - projection.y);

                if (dist < hitDist && dist < minDist) {
                    minDist = dist;
                    closestSegId = key;
                }
            }
        }
        return closestSegId;
    }

    getHoveredRoadPoint(x, y) {
        let hitDist = Infinity;
        let bestMatch = null;

        for (const key in this.roads) {
            let road = this.roads[key];
            let pts = road.curvePoints || [road.start, road.end];
            let rWidth = road.width || 30;
            let threshold = (rWidth / 2) + 10;

            for (let i = 0; i < pts.length - 1; i++) {
                let p1 = pts[i];
                let p2 = pts[i + 1];

                let l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
                let t = Math.max(0, Math.min(1, ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / (l2 || 1)));
                let projection = {
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                };
                let dist = Math.hypot(x - projection.x, y - projection.y);

                if (dist < threshold && dist < hitDist) {
                    hitDist = dist;
                    bestMatch = {
                        roadId: key,
                        point: projection,
                        segmentIndex: i
                    };
                }
            }
        }
        return bestMatch;
    }

    splitRoadAtPoint(roadId, newCircle, splitSegmentIndex, exactPoint) {
        return this.roadConstructor.splitRoadAtPoint(roadId, newCircle, splitSegmentIndex, exactPoint);
    }

    getHoveredLanePoint(x, y) {
        if (this.hoveredSegmentId === null) return null;
        let seg = this.segments[this.hoveredSegmentId];
        if (!seg) return null;

        let hitDist = Infinity;
        let bestMatch = null;
        let pts = seg.curvePoints || [seg.start, seg.end];

        for (let i = 0; i < pts.length - 1; i++) {
            let p1 = pts[i];
            let p2 = pts[i + 1];

            let l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
            let t = Math.max(0, Math.min(1, ((x - p1.x) * (p2.x - p1.x) + (y - p1.y) * (p2.y - p1.y)) / (l2 || 1)));
            let projection = {
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y)
            };
            let dist = Math.hypot(x - projection.x, y - projection.y);

            if (dist < hitDist) {
                hitDist = dist;
                bestMatch = { point: projection, segmentIndex: i, segmentId: this.hoveredSegmentId };
            }
        }
        return bestMatch;
    }

    splitSegmentAtPoint(segId, exactPoint, splitIndex) {
        return this.roadConstructor.splitSegmentAtPoint(segId, exactPoint, splitIndex);
    }

    #addEventListeners() {
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            if (window.activeTool !== "BUILD" || window.pathMode !== "SPLINE") return;

            if (this.draftSplinePoints.length >= 2) {
                for (let i = 0; i < this.draftSplinePoints.length - 1; i++) {
                    let c1 = this.draftSplinePoints[i];
                    let c2 = this.draftSplinePoints[i + 1];
                    let p0 = this.draftSplinePoints[i - 1] || c1;
                    let p1 = c1;
                    let p2 = c2;
                    let p3 = this.draftSplinePoints[i + 2] || c2;

                    let curvePoints = this.roadConstructor.getSplineSegmentPoints(p0, p1, p2, p3);
                    this.roadConstructor.addRoadWithIntersections(c1, c2, window.segmentType, curvePoints);
                }
            }
            this.draftSplinePoints = [];
            this.mouseTarget = null;
        });

        this.canvas.addEventListener('mousedown', (e) => {
            if (window.activeTool !== "BUILD") return;
            if (e.button !== 0) return;

            let worldPos = this.camera.getMousePosition(e);
            let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);

            if (window.pathMode === "SPLINE") {
                let circle = hoveredCircle;
                if (!circle) {
                    if (this.hoveredLaneConnectionPoint) {
                        let pt = this.hoveredLaneConnectionPoint.point;
                        let segId = this.hoveredLaneConnectionPoint.segmentId;
                        let idx = this.hoveredLaneConnectionPoint.segmentIndex;
                        circle = this.splitSegmentAtPoint(segId, pt, idx);
                        this.hoveredLaneConnectionPoint = null;
                    } else if (this.hoveredRoadConnectionPoint) {
                        let pt = this.hoveredRoadConnectionPoint.point;
                        let rdId = this.hoveredRoadConnectionPoint.roadId;
                        let segIdx = this.hoveredRoadConnectionPoint.segmentIndex;
                        let cType = this.roads[rdId].type;
                        circle = cType === "ONE_WAY_ROAD" ? this.addLaneNode(pt.x, pt.y) : this.addCircle(pt.x, pt.y);
                        this.splitRoadAtPoint(rdId, circle, segIdx, pt);
                        this.hoveredRoadConnectionPoint = null;
                    } else {
                        circle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                    }
                }
                this.draftSplinePoints.push(circle);
                this.mouseTarget = { x: worldPos.x, y: worldPos.y };
            } else {
                if (hoveredCircle) {
                    this.draftStartCircle = hoveredCircle;
                } else if (this.hoveredLaneConnectionPoint) {
                    let pt = this.hoveredLaneConnectionPoint.point;
                    let segId = this.hoveredLaneConnectionPoint.segmentId;
                    let idx = this.hoveredLaneConnectionPoint.segmentIndex;
                    this.draftStartCircle = this.splitSegmentAtPoint(segId, pt, idx);
                    this.hoveredLaneConnectionPoint = null;
                } else if (this.hoveredRoadConnectionPoint) {
                    let pt = this.hoveredRoadConnectionPoint.point;
                    let rdId = this.hoveredRoadConnectionPoint.roadId;
                    let segIdx = this.hoveredRoadConnectionPoint.segmentIndex;
                    let cType = this.roads[rdId].type;
                    this.draftStartCircle = cType === "ONE_WAY_ROAD" ? this.addLaneNode(pt.x, pt.y) : this.addCircle(pt.x, pt.y);
                    this.splitRoadAtPoint(rdId, this.draftStartCircle, segIdx, pt);
                    this.hoveredRoadConnectionPoint = null;
                } else {
                    this.draftStartCircle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                }
                this.draftRoad = new Road(this.draftStartCircle, { x: worldPos.x, y: worldPos.y }, window.segmentType);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            let worldPos = this.camera.getMousePosition(e);

            this.hoveredSegmentId = window.activeTool === "BUILD" ? this.getHoveredSegment(worldPos.x, worldPos.y) : null;

            if (window.activeTool === "BUILD") {
                let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);
                if (!hoveredCircle) {
                    if (window.segmentType === "ONE_WAY_ROAD") {
                        if (this.hoveredSegmentId !== null) {
                            this.hoveredLaneConnectionPoint = this.getHoveredLanePoint(worldPos.x, worldPos.y);
                            this.hoveredRoadConnectionPoint = null;
                        } else {
                            this.hoveredLaneConnectionPoint = null;
                            this.hoveredRoadConnectionPoint = null;
                        }
                    } else {
                        this.hoveredRoadConnectionPoint = this.getHoveredRoadPoint(worldPos.x, worldPos.y);
                        this.hoveredLaneConnectionPoint = null;
                    }
                } else {
                    this.hoveredRoadConnectionPoint = null;
                    this.hoveredLaneConnectionPoint = null;
                }
            } else {
                this.hoveredRoadConnectionPoint = null;
                this.hoveredLaneConnectionPoint = null;
            }

            if (window.pathMode === "SPLINE") {
                let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);
                if (hoveredCircle) {
                    this.mouseTarget = { x: hoveredCircle.x, y: hoveredCircle.y };
                } else if (this.hoveredLaneConnectionPoint) {
                    this.mouseTarget = { x: this.hoveredLaneConnectionPoint.point.x, y: this.hoveredLaneConnectionPoint.point.y };
                } else if (this.hoveredRoadConnectionPoint) {
                    this.mouseTarget = { x: this.hoveredRoadConnectionPoint.point.x, y: this.hoveredRoadConnectionPoint.point.y };
                } else {
                    this.mouseTarget = { x: worldPos.x, y: worldPos.y };
                }
            } else {
                if (this.draftRoad) {
                    let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);
                    if (hoveredCircle) {
                        this.draftRoad.end = { x: hoveredCircle.x, y: hoveredCircle.y };
                    } else if (this.hoveredLaneConnectionPoint) {
                        this.draftRoad.end = { x: this.hoveredLaneConnectionPoint.point.x, y: this.hoveredLaneConnectionPoint.point.y };
                    } else if (this.hoveredRoadConnectionPoint) {
                        this.draftRoad.end = { x: this.hoveredRoadConnectionPoint.point.x, y: this.hoveredRoadConnectionPoint.point.y };
                    } else {
                        this.draftRoad.end = { x: worldPos.x, y: worldPos.y };
                    }
                }
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (window.pathMode === "SPLINE") return;

            if (this.draftRoad && e.button === 0) {
                let worldPos = this.camera.getMousePosition(e);

                let endCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);

                if (!endCircle && this.hoveredLaneConnectionPoint) {
                    let pt = this.hoveredLaneConnectionPoint.point;
                    let segId = this.hoveredLaneConnectionPoint.segmentId;
                    let idx = this.hoveredLaneConnectionPoint.segmentIndex;
                    endCircle = this.splitSegmentAtPoint(segId, pt, idx);
                    this.hoveredLaneConnectionPoint = null;
                } else if (!endCircle && this.hoveredRoadConnectionPoint) {
                    let pt = this.hoveredRoadConnectionPoint.point;
                    let rdId = this.hoveredRoadConnectionPoint.roadId;
                    let segIdx = this.hoveredRoadConnectionPoint.segmentIndex;
                    let cType = this.roads[rdId].type;
                    endCircle = cType === "ONE_WAY_ROAD" ? this.addLaneNode(pt.x, pt.y) : this.addCircle(pt.x, pt.y);
                    this.splitRoadAtPoint(rdId, endCircle, segIdx, pt);
                    this.hoveredRoadConnectionPoint = null;
                } else if (!endCircle) {
                    endCircle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                }

                if (this.draftStartCircle !== endCircle) {
                    this.roadConstructor.addRoadWithIntersections(this.draftStartCircle, endCircle, window.segmentType);
                }

                this.draftRoad = null;
                this.draftStartCircle = null;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (window.activeTool === "BUILD") {
                    if (this.hoveredSegmentId !== null) {
                        let parentRoadId = null;
                        for (const key in this.roads) {
                            if (this.roads[key].segmentIds && this.roads[key].segmentIds.includes(Number(this.hoveredSegmentId))) {
                                parentRoadId = key;
                                break;
                            }
                        }
                        if (parentRoadId !== null) {
                            this.removeRoad(parentRoadId);
                        } else {
                            this.removeSegment(this.hoveredSegmentId);
                        }
                    }
                }
            }
        });
    }

    addCircle(x, y) {
        let newCircle = new Circle(x, y);
        this.circle[this.circleIdCount] = newCircle;
        newCircle.id = this.circleIdCount; 
        this.circleIdCount++;
        return newCircle;
    }

    addLaneNode(x, y) {
        let newNode = new Circle(x, y);
        newNode.radius = 4;
        newNode.color = "#3498db";
        this.laneNodes[this.laneNodeIdCount] = newNode;
        this.laneNodeIdCount++;
        return newNode;
    }

    addSegment(segment) {
        let id = this.segmentIdCount;
        this.segments[id] = segment;
        this.segmentIdCount++;
        return id;
    }

    removeNodeIfEmpty(node) {
        if (!node || !node.SegmentId) return;
        if (node.SegmentId.length === 0) {
            if (node.id !== undefined && this.circle[node.id]) {
                delete this.circle[node.id];
                delete this.intersections[node.id];
            } else {
                for (const key in this.laneNodes) {
                    if (this.laneNodes[key] === node) {
                        delete this.laneNodes[key];
                        break;
                    }
                }
            }
        }
    }

    getOrCreateLaneNode(x, y) {
        return this.addLaneNode(x, y);
    }

    removeSegment(segId) {
        let seg = this.segments[segId];
        if (!seg) return;

        // Detach from graph nodes (circles/laneNodes) so pathfinding ignores it
        if (seg.start && seg.start.SegmentId) {
            seg.start.SegmentId = seg.start.SegmentId.filter(s => s != segId);
            this.removeNodeIfEmpty(seg.start);
        }
        if (seg.end && seg.end.SegmentId) {
            seg.end.SegmentId = seg.end.SegmentId.filter(s => s != segId);
            this.removeNodeIfEmpty(seg.end);
        }

        // Remove from any parent Road that might contain it
        for (const key in this.roads) {
            let r = this.roads[key];
            if (r.segmentIds && r.segmentIds.includes(Number(segId))) {
                r.segmentIds = r.segmentIds.filter(s => s != segId);
            }
        }

        // Remove from intersection inner segments 
        for (const key in this.intersections) {
            let inter = this.intersections[key];
            if (inter.segmentIds && inter.segmentIds.includes(Number(segId))) {
                inter.segmentIds = inter.segmentIds.filter(s => s != segId);
            }
        }

        // Delete from global segments list
        delete this.segments[segId];
        this.hoveredSegmentId = null; // Reset hover so it doesn't break
    }

    removeRoad(id) {
        let road = this.roads[id];
        if (!road) return;

        if (road.segmentIds) {
            for (let segId of road.segmentIds) {
                let seg = this.segments[segId];
                if (seg) {
                    let ln1 = seg.start;
                    let ln2 = seg.end;
                    if (ln1 && ln1.SegmentId) {
                        ln1.SegmentId = ln1.SegmentId.filter(s => s !== segId);
                        this.removeNodeIfEmpty(ln1);
                    }
                    if (ln2 && ln2.SegmentId) {
                        ln2.SegmentId = ln2.SegmentId.filter(s => s !== segId);
                        this.removeNodeIfEmpty(ln2);
                    }
                    delete this.segments[segId];
                }
            }
        }

        let s1 = road.start;
        let s2 = road.end;
        delete this.roads[id];

        if (s1 && s1.id !== undefined) this.roadConstructor.updateIntersectionGeometry(s1);
        if (s2 && s2.id !== undefined) this.roadConstructor.updateIntersectionGeometry(s2);
    }


    draw(ctx) {
        // Draw Intersections Base Polygons FIRST
        for (const id in this.intersections) {
            let inter = this.intersections[id];
            let corners = inter.corners;
            if (!inter || !corners || corners.length < 3) continue;

            // 1. Draw Normal Straight Polygon
            ctx.beginPath();
            ctx.fillStyle = "#444"; // Asphalt color
            ctx.moveTo(corners[0].pt.x, corners[0].pt.y);
            for (let i = 1; i < corners.length; i++) {
                ctx.lineTo(corners[i].pt.x, corners[i].pt.y);
            }
            ctx.closePath();
            ctx.fill();

            // 2. Draw Curved Polygon Overlapping
            ctx.beginPath();
            ctx.fillStyle = "#444"; // Asphalt color
            ctx.moveTo(corners[0].pt.x, corners[0].pt.y);

            for (let i = 1; i <= corners.length; i++) {
                let current = corners[i % corners.length];
                let prev = corners[i - 1];

                if (current.road === prev.road) {
                    ctx.lineTo(current.pt.x, current.pt.y);
                } else {
                    let dx1 = prev.dir.x, dy1 = prev.dir.y;
                    let dx2 = current.dir.x, dy2 = current.dir.y;

                    let denom = dx1 * dy2 - dy1 * dx2;
                    let P = null;
                    if (Math.abs(denom) > 0.001) {
                        let u = ((current.pt.x - prev.pt.x) * dy2 - (current.pt.y - prev.pt.y) * dx2) / denom;
                        let v = ((current.pt.x - prev.pt.x) * dy1 - (current.pt.y - prev.pt.y) * dx1) / denom;

                        if (u < 0 && v < 0 && u > -200 && v > -200) {
                            P = { x: prev.pt.x + u * dx1, y: prev.pt.y + u * dy1 };
                        }
                    }

                    if (P) {
                        ctx.quadraticCurveTo(P.x, P.y, current.pt.x, current.pt.y);
                    } else {
                        ctx.lineTo(current.pt.x, current.pt.y);
                    }
                }
            }
            ctx.closePath();
            ctx.fill();
        }

        if (this.cars) {
            // Update all cars and remove finished ones FIRST (once per frame)
            for (let i = this.cars.length - 1; i >= 0; i--) {
                this.cars[i].update();
                if (this.cars[i].finished) {
                    this.cars.splice(i, 1);
                }
            }
        }

        // 1. Draw visual roads (bottom layer: normal roads)
        for (const key in this.roads) {
            let road = this.roads[key];
            if (road.type === "BRIDGE" || road.type === "ONE_WAY_BRIDGE") continue; // Skip bridges for now

            let isHovered = false;
            if (window.activeTool === "BUILD") {
                if (this.hoveredRoadConnectionPoint !== null && this.hoveredRoadConnectionPoint.roadId === key) {
                    isHovered = true;
                } else if (this.hoveredSegmentId !== null && road.segmentIds && road.segmentIds.includes(Number(this.hoveredSegmentId))) {
                    isHovered = true;
                }
            }
            road.draw(ctx, isHovered);
        }

        // 2. Draw Ground Cars (elevation 0)
        if (this.cars) {
            for (let car of this.cars) {
                if (!car.currentSegment || car.currentSegment.elevation === 0) {
                    car.draw(ctx);
                }
            }
        }

        // 3. Draw visual roads (top layer: bridges)
        for (const key in this.roads) {
            let road = this.roads[key];
            if (road.type !== "BRIDGE" && road.type !== "ONE_WAY_BRIDGE") continue; // Only bridges this time

            let isHovered = false;
            if (window.activeTool === "BUILD") {
                if (this.hoveredRoadConnectionPoint !== null && this.hoveredRoadConnectionPoint.roadId === key) {
                    isHovered = true;
                } else if (this.hoveredSegmentId !== null && road.segmentIds && road.segmentIds.includes(Number(this.hoveredSegmentId))) {
                    isHovered = true;
                }
            }
            road.draw(ctx, isHovered);
        }

        // 4. Draw Bridge Cars (elevation 1)
        if (this.cars) {
            for (let car of this.cars) {
                if (car.currentSegment && car.currentSegment.elevation === 1) {
                    car.draw(ctx);
                }
            }
        }

        // 5. Draw Hovers and Drafts
        if (window.activeTool === "BUILD" && this.hoveredRoadConnectionPoint) {
            let rd = this.roads[this.hoveredRoadConnectionPoint.roadId];
            if (rd) {
                ctx.beginPath();
                ctx.fillStyle = "rgba(46, 204, 113, 0.7)";
                ctx.arc(this.hoveredRoadConnectionPoint.point.x, this.hoveredRoadConnectionPoint.point.y, rd.width / 2, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (window.activeTool === "BUILD" && this.hoveredLaneConnectionPoint) {
            ctx.beginPath();
            ctx.fillStyle = "rgba(46, 204, 113, 0.7)";
            ctx.arc(this.hoveredLaneConnectionPoint.point.x, this.hoveredLaneConnectionPoint.point.y, 7.5, 0, Math.PI * 2);
            ctx.fill();
        }

        if (this.draftRoad) {
            this.draftRoad.draw(ctx);
        }

        // 6. Draw invisible logical segments (for debug only)
        for (const key in this.segments) {
            let seg = this.segments[key];
            let isHovered = (key == this.hoveredSegmentId);

            if (window.showSegments) {
                let oldWidth = seg.width;
                let oldColor = seg.color;
                seg.width = 1;
                seg.color = "rgba(255,255,255,0.8)";
                seg.draw(ctx);
                seg.width = oldWidth;
                seg.color = oldColor;

                // Draw directional arrows
                ctx.fillStyle = isHovered ? "#2ecc71" : "rgba(255,255,255,0.8)";
                let pts = seg.curvePoints || [seg.start, seg.end];
                let arrowSpacing = 40;
                let currentDist = arrowSpacing / 2;
                for (let i = 0; i < pts.length - 1; i++) {
                    let p1 = pts[i];
                    let p2 = pts[i + 1];
                    let dx = p2.x - p1.x;
                    let dy = p2.y - p1.y;
                    let dist = Math.hypot(dx, dy);
                    if (currentDist + dist >= arrowSpacing) {
                        let t = (arrowSpacing - currentDist) / dist;
                        let ax = p1.x + t * dx;
                        let ay = p1.y + t * dy;
                        let angle = Math.atan2(dy, dx);
                        ctx.save();
                        ctx.translate(ax, ay);
                        ctx.rotate(angle);
                        ctx.beginPath();
                        ctx.moveTo(-4, -4); ctx.lineTo(4, 0); ctx.lineTo(-4, 4);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();
                        currentDist = 0;
                    } else { currentDist += dist; }
                }
            } else if (seg.color !== "rgba(0,0,0,0)") {
                seg.draw(ctx);
            }
        }

        // 7. Draw Spline Preview
        if (this.draftSplinePoints && this.draftSplinePoints.length > 0) {
            let points = [...this.draftSplinePoints];
            if (this.mouseTarget) points.push(this.mouseTarget);
            if (points.length >= 2) {
                ctx.beginPath();
                ctx.strokeStyle = "rgba(150, 150, 150, 0.5)";
                ctx.lineWidth = 20;
                let fullCurve = [];
                for (let i = 0; i < points.length - 1; i++) {
                    let p0 = points[i - 1] || points[i];
                    let p1 = points[i];
                    let p2 = points[i + 1];
                    let p3 = points[i + 2] || p2;
                    fullCurve.push(...this.roadConstructor.getSplineSegmentPoints(p0, p1, p2, p3));
                }
                ctx.moveTo(fullCurve[0].x, fullCurve[0].y);
                for (let p of fullCurve) ctx.lineTo(p.x, p.y);
                ctx.stroke();
            }
            for (let c of this.draftSplinePoints) {
                ctx.beginPath();
                ctx.fillStyle = "rgba(150, 150, 150, 0.8)";
                ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // 8. Draw Nodes
        if (window.activeTool == "BUILD") {
            for (const key in this.circle) {
                this.circle[key].draw(ctx);
            }
        }
    }
}
