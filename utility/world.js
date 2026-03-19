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

                    let curvePoints = this.getSplineSegmentPoints(p0, p1, p2, p3);
                    this.addRoadWithIntersections(c1, c2, window.segmentType, curvePoints);
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
                    circle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                }
                this.draftSplinePoints.push(circle);
                this.mouseTarget = { x: worldPos.x, y: worldPos.y };
            } else {
                if (hoveredCircle) {
                    this.draftStartCircle = hoveredCircle;
                } else {
                    this.draftStartCircle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                }
                this.draftRoad = new Road(this.draftStartCircle, { x: worldPos.x, y: worldPos.y }, window.segmentType);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            let worldPos = this.camera.getMousePosition(e);
            if (window.pathMode === "SPLINE") {
                let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);
                if (hoveredCircle) {
                    this.mouseTarget = { x: hoveredCircle.x, y: hoveredCircle.y };
                } else {
                    this.mouseTarget = { x: worldPos.x, y: worldPos.y };
                }
            } else {
                if (this.draftRoad) {
                    let hoveredCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);
                    if (hoveredCircle) {
                        this.draftRoad.end = { x: hoveredCircle.x, y: hoveredCircle.y };
                    } else {
                        this.draftRoad.end = { x: worldPos.x, y: worldPos.y };
                    }
                }
            }
            this.hoveredSegmentId = this.getHoveredSegment(worldPos.x, worldPos.y);
        });

        this.canvas.addEventListener('mouseup', (e) => {
            if (window.pathMode === "SPLINE") return;

            if (this.draftRoad && e.button === 0) {
                let worldPos = this.camera.getMousePosition(e);

                let endCircle = this.getRelevantHoveredNode(worldPos.x, worldPos.y);

                if (!endCircle) {
                    endCircle = window.segmentType === "ONE_WAY_ROAD" ? this.addLaneNode(worldPos.x, worldPos.y) : this.addCircle(worldPos.x, worldPos.y);
                }

                if (this.draftStartCircle !== endCircle) {
                    this.addRoadWithIntersections(this.draftStartCircle, endCircle, window.segmentType);
                }

                this.draftRoad = null;
                this.draftStartCircle = null;
            }
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (this.hoveredSegmentId !== null) {
                    this.removeSegment(this.hoveredSegmentId);
                }
            }
        });
    }

    addCircle(x, y) {
        let newCircle = new Circle(x, y);
        this.circle[this.circleIdCount] = newCircle;
        newCircle.id = this.circleIdCount; // helpful for intersections dictionary
        this.circleIdCount++;
        return newCircle;
    }

    addLaneNode(x, y) {
        let newNode = new Circle(x, y);
        newNode.radius = 4; // Smaller radius for lane nodes
        newNode.color = "#3498db"; // Blue color for distinguishability
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

    getSplineSegmentPoints(p0, p1, p2, p3, step = 0.02) {
        let curve = [];
        for (let t = 0; t <= 1; t += step) {
            let t2 = t * t;
            let t3 = t2 * t;
            let x = 0.5 * ((2 * p1.x) + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);
            let y = 0.5 * ((2 * p1.y) + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);
            curve.push({ x, y });
        }
        return curve;
    }

    getCubicBezierPoints(p0, p1, p2, p3, step = 0.05) {
        let curve = [];
        for (let t = 0; t <= 1; t += step) {
            let u = 1 - t;
            let tt = t * t;
            let uu = u * u;
            let uuu = uu * u;
            let ttt = tt * t;

            let x = uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x;
            let y = uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y;
            curve.push({ x, y });
        }
        // Ensure final point is exactly p3
        curve.push({ x: p3.x, y: p3.y });
        return curve;
    }

    getOffsetCurve(curve, width) {
        if (!curve || curve.length < 2) return curve;
        let result = [];
        for (let i = 0; i < curve.length - 1; i++) {
            let p1 = curve[i];
            let p2 = curve[i + 1];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let len = Math.hypot(dx, dy);
            let nx = -dy / len;
            let ny = dx / len;
            result.push({ x: p1.x + nx * width, y: p1.y + ny * width });
        }
        // Duplicate the last displacement vector for the final node
        let pLast = curve[curve.length - 1];
        let pPrev = curve[curve.length - 2];
        let dxEnd = pLast.x - pPrev.x;
        let dyEnd = pLast.y - pPrev.y;
        let lenEnd = Math.hypot(dxEnd, dyEnd);
        result.push({ x: pLast.x + (-dyEnd / lenEnd) * width, y: pLast.y + (dxEnd / lenEnd) * width });
        return result;
    }

    getOrCreateLaneNode(x, y) {
        return this.addLaneNode(x, y);
    }

    doSegmentsIntersect(p1, p2, p3, p4) {
        const s1x = p2.x - p1.x;
        const s1y = p2.y - p1.y;
        const s2x = p4.x - p3.x;
        const s2y = p4.y - p3.y;

        const denom = -s2x * s1y + s1x * s2y;
        if (Math.abs(denom) < 0.00001) return null;

        const s = (-s1y * (p1.x - p3.x) + s1x * (p1.y - p3.y)) / denom;
        const t = (s2x * (p1.y - p3.y) - s2y * (p1.x - p3.x)) / denom;

        const EPS = 0.01;

        if (s > EPS && s < 1 - EPS && t > EPS && t < 1 - EPS) {
            return { x: p1.x + t * s1x, y: p1.y + t * s1y };
        }
        return null;
    }

    removeSegment(segId) {
        let seg = this.segments[segId];
        if (!seg) return;

        // Detach from graph nodes (circles/laneNodes) so pathfinding ignores it
        if (seg.start && seg.start.SegmentId) {
            seg.start.SegmentId = seg.start.SegmentId.filter(s => s != segId);
        }
        if (seg.end && seg.end.SegmentId) {
            seg.end.SegmentId = seg.end.SegmentId.filter(s => s != segId);
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
                    }
                    if (ln2 && ln2.SegmentId) {
                        ln2.SegmentId = ln2.SegmentId.filter(s => s !== segId);
                    }
                    delete this.segments[segId];
                }
            }
        }

        let s1 = road.start;
        let s2 = road.end;
        delete this.roads[id];

        if (s1 && s1.id !== undefined) this.updateIntersectionGeometry(s1);
        if (s2 && s2.id !== undefined) this.updateIntersectionGeometry(s2);
    }

    addRoadWithIntersections(startCircle, endCircle, type, curvePoints = null) {
        let incomingBase = curvePoints || [{ x: startCircle.x, y: startCircle.y }, { x: endCircle.x, y: endCircle.y }];

        let closestIntersection = null;
        let closestDist = Infinity;
        let intersectedRoadId = null;
        let incomingHitIndex = -1; // the segment index on the incoming road where the hit occurred
        let existingHitIndex = -1; // the segment index on the existing road where the hit occurred

        for (const key in this.roads) {
            let existingRoad = this.roads[key];

            let existingBase = existingRoad.curvePoints || [
                { x: existingRoad.start.x, y: existingRoad.start.y },
                { x: existingRoad.end.x, y: existingRoad.end.y }
            ];

            // Check every segment of incomingBase against every segment of existingBase
            for (let i = 0; i < incomingBase.length - 1; i++) {
                let p1 = incomingBase[i];
                let p2 = incomingBase[i + 1];

                for (let j = 0; j < existingBase.length - 1; j++) {
                    let p3 = existingBase[j];
                    let p4 = existingBase[j + 1];

                    let hit = this.doSegmentsIntersect(p1, p2, p3, p4);
                    if (hit) {
                        // Check distance from the VERY start of the incoming curve sequence
                        let dist = Math.hypot(hit.x - incomingBase[0].x, hit.y - incomingBase[0].y);
                        if (dist < closestDist) {
                            closestDist = dist;
                            closestIntersection = hit;
                            intersectedRoadId = key;
                            incomingHitIndex = i;
                            existingHitIndex = j;
                        }
                    }
                }
            }
        }

        if (closestIntersection) {
            let intersectionCircle = type === "ONE_WAY_ROAD" ?
                this.addLaneNode(closestIntersection.x, closestIntersection.y) :
                this.addCircle(closestIntersection.x, closestIntersection.y);

            let intersectedRoad = this.roads[intersectedRoadId];
            let erStart = intersectedRoad.start;
            let erEnd = intersectedRoad.end;
            let erType = intersectedRoad.type;
            let erCurvePoints = intersectedRoad.curvePoints;

            this.removeRoad(intersectedRoadId);

            // Calculate split points for Existing Road
            let erCurve1 = null;
            let erCurve2 = null;
            if (erCurvePoints) {
                // Split the existing road's curve points
                erCurve1 = erCurvePoints.slice(0, existingHitIndex + 1);
                erCurve1.push(closestIntersection);

                erCurve2 = [closestIntersection];
                erCurve2.push(...erCurvePoints.slice(existingHitIndex + 1));
            }

            // Calculate split points for Incoming Road
            let inCurve1 = null;
            let inCurve2 = null;
            if (curvePoints) {
                // Split the incoming road's curve points
                inCurve1 = curvePoints.slice(0, incomingHitIndex + 1);
                inCurve1.push(closestIntersection);

                inCurve2 = [closestIntersection];
                inCurve2.push(...curvePoints.slice(incomingHitIndex + 1));
            }

            // Re-add the existing road parts (recurse to check if these parts hit anything else)
            this.addRoadWithIntersections(erStart, intersectionCircle, erType, erCurve1);
            this.addRoadWithIntersections(intersectionCircle, erEnd, erType, erCurve2);

            // Re-add the incoming road parts (recurse)
            this.addRoadWithIntersections(startCircle, intersectionCircle, type, inCurve1);
            this.addRoadWithIntersections(intersectionCircle, endCircle, type, inCurve2);
        } else {
            let newRoad = new Road(startCircle, endCircle, type, curvePoints);
            this.addRoad(newRoad);
        }
    }

    addRoad(road) {
        let id = this.roadIdCount;
        this.roads[id] = road;
        this.roadIdCount++;
        road.segmentIds = [];

        let c1 = road.start;
        let c2 = road.end;

        let baseArray = road.curvePoints || [{ x: c1.x, y: c1.y }, { x: c2.x, y: c2.y }];

        if (road.type === "ONE_WAY_ROAD") {
            let pts = baseArray;
            let ln1 = c1.radius === 4 ? c1 : this.getOrCreateLaneNode(pts[0].x, pts[0].y);
            let ln2 = c2.radius === 4 ? c2 : this.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);

            let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
            seg.curvePoints = pts;
            seg.baseCurvePoints = [...pts];
            seg.length = this.calculatePathLength(pts);
            let idSeg = this.addSegment(seg);
            ln1.SegmentId.push(idSeg);
            ln2.SegmentId.push(idSeg);
            road.segmentIds.push(idSeg);

        } else if (road.type === "NORMAL") {
            let rightPoints = this.getOffsetCurve(baseArray, 7.5);
            let lnR1 = this.getOrCreateLaneNode(rightPoints[0].x, rightPoints[0].y);
            let lnR2 = this.getOrCreateLaneNode(rightPoints[rightPoints.length - 1].x, rightPoints[rightPoints.length - 1].y);
            let rightSeg = new Segment(lnR1, "rgba(0,0,0,0)", 1, lnR2);
            rightSeg.curvePoints = rightPoints;
            rightSeg.baseCurvePoints = [...rightPoints];
            rightSeg.length = this.calculatePathLength(rightPoints);
            let idRight = this.addSegment(rightSeg);
            lnR1.SegmentId.push(idRight);
            lnR2.SegmentId.push(idRight);
            road.segmentIds.push(idRight);

            let reverseBase = [...baseArray].reverse();
            let leftPoints = this.getOffsetCurve(reverseBase, 7.5);
            let lnL1 = this.getOrCreateLaneNode(leftPoints[0].x, leftPoints[0].y);
            let lnL2 = this.getOrCreateLaneNode(leftPoints[leftPoints.length - 1].x, leftPoints[leftPoints.length - 1].y);
            let leftSeg = new Segment(lnL1, "rgba(0,0,0,0)", 1, lnL2);
            leftSeg.curvePoints = leftPoints;
            leftSeg.baseCurvePoints = [...leftPoints];
            leftSeg.length = this.calculatePathLength(leftPoints);
            let idLeft = this.addSegment(leftSeg);
            lnL1.SegmentId.push(idLeft);
            lnL2.SegmentId.push(idLeft);
            road.segmentIds.push(idLeft);

        } else if (road.type === "HIGHWAY") {
            // Two lanes, same direction!
            let r1 = this.getOffsetCurve(baseArray, 7.5);
            let r2 = this.getOffsetCurve(baseArray, -7.5);

            let createLane = (pts) => {
                let ln1 = this.getOrCreateLaneNode(pts[0].x, pts[0].y);
                let ln2 = this.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);
                let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
                seg.curvePoints = pts;
                seg.baseCurvePoints = [...pts];
                seg.length = this.calculatePathLength(pts);
                let segId = this.addSegment(seg);
                ln1.SegmentId.push(segId);
                ln2.SegmentId.push(segId);
                road.segmentIds.push(segId);
            };
            createLane(r1);
            createLane(r2);

        } else if (road.type === "FOUR_LANE_ROAD" || road.type === "TWO_WAY_HIGHWAY") {
            let offsetInner = road.type === "FOUR_LANE_ROAD" ? 7.5 : 10;
            let offsetOuter = road.type === "FOUR_LANE_ROAD" ? 22.5 : 25;

            // Forward lanes
            let rightInner = this.getOffsetCurve(baseArray, offsetInner);
            let rightOuter = this.getOffsetCurve(baseArray, offsetOuter);

            // Backward lanes
            let reverseBase = [...baseArray].reverse();
            let leftInner = this.getOffsetCurve(reverseBase, offsetInner);
            let leftOuter = this.getOffsetCurve(reverseBase, offsetOuter);

            let createLane = (pts) => {
                let ln1 = this.getOrCreateLaneNode(pts[0].x, pts[0].y);
                let ln2 = this.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);
                let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
                seg.curvePoints = pts;
                seg.baseCurvePoints = [...pts];
                seg.length = this.calculatePathLength(pts);
                let segId = this.addSegment(seg);
                ln1.SegmentId.push(segId);
                ln2.SegmentId.push(segId);
                road.segmentIds.push(segId);
            };

            createLane(rightInner);
            createLane(rightOuter);
            createLane(leftInner);
            createLane(leftOuter);
        }

        if (c1 && c1.id !== undefined) this.updateIntersectionGeometry(c1);
        if (c2 && c2.id !== undefined) this.updateIntersectionGeometry(c2);

        return id;
    }

    slicePolyline(points, cutStart, cutEnd) {
        if (!points || points.length < 2) return points;
        let totalLen = 0;
        let segLengths = [];
        for (let i = 0; i < points.length - 1; i++) {
            let dx = points[i + 1].x - points[i].x;
            let dy = points[i + 1].y - points[i].y;
            let d = Math.hypot(dx, dy);
            segLengths.push(d);
            totalLen += d;
        }

        cutStart = cutStart || 0;
        cutEnd = cutEnd || 0;
        let cutEndFromStart = Math.max(cutStart + 0.1, totalLen - cutEnd);

        let result = [];
        let currentDist = 0;
        let startAdded = false;

        for (let i = 0; i < points.length - 1; i++) {
            let p1 = points[i];
            let p2 = points[i + 1];
            let segDist = segLengths[i];

            let segStartDist = currentDist;
            let segEndDist = currentDist + segDist;

            if (!startAdded && cutStart <= segEndDist) {
                let t = (cutStart - segStartDist) / segDist;
                t = Math.max(0, Math.min(1, t));
                result.push({
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                });
                startAdded = true;
            }

            if (startAdded && cutEndFromStart > segStartDist && cutEndFromStart < segEndDist) {
                let t = (cutEndFromStart - segStartDist) / segDist;
                result.push({
                    x: p1.x + t * (p2.x - p1.x),
                    y: p1.y + t * (p2.y - p1.y)
                });
                break; // End cut reached
            } else if (startAdded && cutEndFromStart >= segEndDist) {
                result.push(p2);
            }

            currentDist += segDist;
        }

        return result.length > 1 ? result : points;
    }

    calculatePathLength(points) {
        let length = 0;
        for (let j = 0; j < points.length - 1; j++) {
            let dx = points[j + 1].x - points[j].x;
            let dy = points[j + 1].y - points[j].y;
            length += Math.sqrt(dx * dx + dy * dy);
        }
        return length;
    }

    updateIntersectionGeometry(circle) {
        if (!circle || circle.id === undefined) return;

        let connectedRoads = [];
        for (const key in this.roads) {
            let r = this.roads[key];
            if (r.start.id === circle.id || r.end.id === circle.id) {
                connectedRoads.push(r);
            }
        }

        if (connectedRoads.length === 0) {
            delete this.intersections[circle.id];
            return;
        }

        let maxWidth = Math.max(...connectedRoads.map(r => r.width || 30));
        let offsetDist = maxWidth / 2;

        if (connectedRoads.length > 1) {
            let roadData = connectedRoads.map(road => {
                let isStart = road.start.id === circle.id;
                let pts = road.curvePoints || [{ x: road.start.x, y: road.start.y }, { x: road.end.x, y: road.end.y }];
                let pAdj = isStart ? pts[1] : pts[pts.length - 2];
                if (!pAdj) pAdj = isStart ? pts[0] : pts[pts.length - 1];

                let dx = pAdj.x - circle.x;
                let dy = pAdj.y - circle.y;
                let len = Math.hypot(dx, dy) || 1;
                /* Note: Math.atan2 takes y, x */
                let angle = Math.atan2(dy, dx);
                if (angle < 0) angle += 2 * Math.PI;

                return { angle, width: road.width || 30 };
            });

            roadData.sort((a, b) => a.angle - b.angle);

            for (let i = 0; i < roadData.length; i++) {
                let r1 = roadData[i];
                let r2 = roadData[(i + 1) % roadData.length];

                let dAngle = r2.angle - r1.angle;
                if (dAngle <= 0) dAngle += 2 * Math.PI;

                // Only apply pullback if roads merge into a sharp "V" (< 180 deg)
                if (dAngle > 0.05 && dAngle < Math.PI - 0.05) {
                    let sinTheta = Math.sin(dAngle);
                    let cosTheta = Math.cos(dAngle);
                    let w1 = r1.width;
                    let w2 = r2.width;

                    let t = (w2 / 2 + (w1 / 2) * cosTheta) / sinTheta;
                    let s = (w1 / 2 + (w2 / 2) * cosTheta) / sinTheta;

                    offsetDist = Math.max(offsetDist, t, s);
                }
            }
        }

        // Cap the offset to prevent ridiculously huge intersections that eat the whole road
        offsetDist = Math.min(offsetDist, 150);

        let corners = [];

        for (let road of connectedRoads) {
            let isStart = road.start.id === circle.id;

            // Get the immediate adjacent point to determine the entry angle
            let pts = road.curvePoints || [{ x: road.start.x, y: road.start.y }, { x: road.end.x, y: road.end.y }];
            let pCenter = { x: circle.x, y: circle.y };
            let pAdj = isStart ? pts[1] : pts[pts.length - 2];

            if (!pAdj) pAdj = isStart ? pts[0] : pts[pts.length - 1]; // safety fallback

            let dx = pAdj.x - pCenter.x;
            let dy = pAdj.y - pCenter.y;
            let len = Math.hypot(dx, dy);

            let dirX = dx / len;
            let dirY = dy / len;

            // Apply pullback distance to the road object itself for visual rendering
            if (isStart) road.pullbackStart = offsetDist;
            else road.pullbackEnd = offsetDist;

            // Dynamically slice the logical segments to perfectly match the visual end of the road!
            for (let segId of road.segmentIds) {
                let seg = this.segments[segId];
                if (seg && seg.baseCurvePoints && seg.baseCurvePoints.length >= 2) {
                    let pFirst = seg.baseCurvePoints[0];
                    let rStart = road.start;
                    let rEnd = road.end;

                    let dFirstToStart = Math.hypot(pFirst.x - rStart.x, pFirst.y - rStart.y);
                    let dFirstToEnd = Math.hypot(pFirst.x - rEnd.x, pFirst.y - rEnd.y);
                    let isBackward = dFirstToEnd < dFirstToStart;

                    let cutStart = road.pullbackStart || 0;
                    let cutEnd = road.pullbackEnd || 0;
                    if (isBackward) {
                        cutStart = road.pullbackEnd || 0;
                        cutEnd = road.pullbackStart || 0;
                    }

                    seg.curvePoints = this.slicePolyline(seg.baseCurvePoints, cutStart, cutEnd);
                }
            }

            // The point immediately before the road visually begins 
            let pIntersect = {
                x: pCenter.x + dirX * offsetDist,
                y: pCenter.y + dirY * offsetDist
            };

            // Compute the perpendicular offset for the road's own width (to get corners)
            let rWidth = road.width || 30;
            let perpX = -dirY;
            let perpY = dirX;

            let cLeft = {
                x: pIntersect.x + perpX * (rWidth / 2),
                y: pIntersect.y + perpY * (rWidth / 2)
            };
            let cRight = {
                x: pIntersect.x - perpX * (rWidth / 2),
                y: pIntersect.y - perpY * (rWidth / 2)
            };

            // Calculate angle for sorting
            let angleLeft = Math.atan2(cLeft.y - pCenter.y, cLeft.x - pCenter.x);
            let angleRight = Math.atan2(cRight.y - pCenter.y, cRight.x - pCenter.x);

            corners.push({ pt: cLeft, angle: angleLeft, road: road, dir: { x: dirX, y: dirY } });
            corners.push({ pt: cRight, angle: angleRight, road: road, dir: { x: dirX, y: dirY } });
        }

        // Sort corners clockwise around the center for the polygon
        corners.sort((a, b) => a.angle - b.angle);

        this.intersections[circle.id] = {
            center: { x: circle.x, y: circle.y },
            corners: corners,
            connectedRoads: connectedRoads,
            segmentIds: this.intersections[circle.id]?.segmentIds || []
        };

        this.generateInternalSegments(circle);
    }

    generateInternalSegments(circle) {
        let inter = this.intersections[circle.id];
        if (!inter) return;

        // Clean up old internal segments
        if (inter.segmentIds) {
            for (let id of inter.segmentIds) {
                let seg = this.segments[id];
                if (seg) {
                    if (seg.start && seg.start.SegmentId) seg.start.SegmentId = seg.start.SegmentId.filter(s => s !== id);
                    if (seg.end && seg.end.SegmentId) seg.end.SegmentId = seg.end.SegmentId.filter(s => s !== id);
                    delete this.segments[id];
                }
            }
        }
        inter.segmentIds = [];

        let incoming = [];
        let outgoing = [];

        // Gather all incoming and outgoing lane nodes at this intersection
        for (let road of inter.connectedRoads) {
            for (let segId of road.segmentIds) {
                let seg = this.segments[segId];
                if (!seg || !seg.start || !seg.end || !seg.curvePoints || seg.curvePoints.length < 2) continue;

                let dStart = Math.hypot(seg.start.x - circle.x, seg.start.y - circle.y);
                let dEnd = Math.hypot(seg.end.x - circle.x, seg.end.y - circle.y);

                if (Math.min(dStart, dEnd) > 200) continue; // too far, safety guard

                if (dStart < dEnd) {
                    // Start of segment is at intersection - it points OUT of the intersection
                    outgoing.push({
                        node: seg.start,
                        road: road,
                        p1: seg.curvePoints[0],
                        p2: seg.curvePoints[1] // For spline tangency
                    });
                } else {
                    // End of segment is at intersection - it points INTO the intersection
                    incoming.push({
                        node: seg.end,
                        road: road,
                        p1: seg.curvePoints[seg.curvePoints.length - 1],
                        p0: seg.curvePoints[seg.curvePoints.length - 2] // For spline tangency
                    });
                }
            }
        }

        // Connect every incoming to every outgoing (except U-turns for now)
        for (let inData of incoming) {
            for (let outData of outgoing) {
                if (inData.road === outData.road) continue; // No U-turns

                // Create a Cubic Bezier curve inside the intersection to prevent scribbles/overshoots
                let startP = inData.p1;
                let endP = outData.p1;

                // Incoming tangent
                let inDx = startP.x - inData.p0.x;
                let inDy = startP.y - inData.p0.y;
                let inLen = Math.hypot(inDx, inDy) || 1;
                let inDir = { x: inDx / inLen, y: inDy / inLen };

                // Outgoing tangent
                let outDx = outData.p2.x - endP.x;
                let outDy = outData.p2.y - endP.y;
                let outLen = Math.hypot(outDx, outDy) || 1;
                let outDir = { x: outDx / outLen, y: outDy / outLen };

                // Calculate distance across the intersection to adjust control point strength
                let directDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);
                let tension = 0.45; // 0.45 creates a tight reliable turn without loops
                let controlDist = directDist * tension;

                let cp1 = {
                    x: startP.x + inDir.x * controlDist,
                    y: startP.y + inDir.y * controlDist
                };

                let cp2 = {
                    x: endP.x - outDir.x * controlDist,
                    y: endP.y - outDir.y * controlDist
                };

                let curvePoints = this.getCubicBezierPoints(startP, cp1, cp2, endP, 0.05);

                let invisColor = "rgba(0,0,0,0)";
                let seg = new Segment(inData.node, invisColor, 1, outData.node);
                seg.curvePoints = curvePoints;
                seg.length = this.calculatePathLength(curvePoints);
                seg.isInternal = true;

                let idSeg = this.addSegment(seg);
                inData.node.SegmentId.push(idSeg);
                outData.node.SegmentId.push(idSeg);
                inter.segmentIds.push(idSeg);
            }
        }
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

        // Draw visual roads (bottom layer)
        for (const key in this.roads) {
            this.roads[key].draw(ctx);
        }

        if (this.draftRoad) {
            this.draftRoad.draw(ctx);
        }

        // Draw invisible logical segments (for debug only, thickness is 1)
        for (const key in this.segments) {
            let seg = this.segments[key];
            let isHovered = (key == this.hoveredSegmentId);

            if (isHovered && window.showSegments) {
                let oldWidth = seg.width;
                let oldColor = seg.color;
                seg.width = 1;
                seg.color = "#2ecc71"; // green highlight
                seg.draw(ctx);
                seg.width = oldWidth;
                seg.color = oldColor;
            } else if (window.showSegments && seg.color === "rgba(0,0,0,0)") {
                // Keep the same segment but draw it visibly for debugging
                let oldColor = seg.color;
                seg.color = "rgba(255,255,255,0.8)";
                seg.draw(ctx);
                seg.color = oldColor;
            } else {
                seg.draw(ctx);
            }

            // Draw directional arrows if Show Segments is ON
            if (window.showSegments && (seg.curvePoints || (seg.start && seg.end))) {
                ctx.fillStyle = isHovered ? "#2ecc71" : "rgba(255,255,255,0.8)";
                if (isHovered) {
                    console.log("Hovered Segment:", key);
                }
                let pts = seg.curvePoints || [seg.start, seg.end];

                let arrowSpacing = 40;
                let currentDist = arrowSpacing / 2; // offset first arrow slightly

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
                        ctx.moveTo(-4, -4);
                        ctx.lineTo(4, 0);
                        ctx.lineTo(-4, 4);
                        ctx.closePath();
                        ctx.fill();
                        ctx.restore();

                        currentDist = 0;
                    } else {
                        currentDist += dist;
                    }
                }
            }
        }

        if (this.draftSplinePoints && this.draftSplinePoints.length > 0) {
            let points = [...this.draftSplinePoints];
            if (this.mouseTarget) {
                points.push(this.mouseTarget);
            }
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
                    fullCurve.push(...this.getSplineSegmentPoints(p0, p1, p2, p3));
                }
                ctx.moveTo(fullCurve[0].x, fullCurve[0].y);
                for (let p of fullCurve) {
                    ctx.lineTo(p.x, p.y);
                }
                ctx.stroke();
            }
            for (let c of this.draftSplinePoints) {
                ctx.beginPath();
                ctx.fillStyle = "rgba(150, 150, 150, 0.8)";
                ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        if (window.activeTool == "BUILD") {
            for (const key in this.circle) {
                this.circle[key].draw(ctx);
            }
        }

        if (window.segmentType === "ONE_WAY_ROAD") {
            for (const key in this.laneNodes) {
                this.laneNodes[key].draw(ctx);
            }
        }

        if (this.cars) {
            for (let i = this.cars.length - 1; i >= 0; i--) {
                let car = this.cars[i];
                car.update();
                car.draw(ctx);

                if (car.finished) {
                    this.cars.splice(i, 1);
                }
            }
        }
    }
}
