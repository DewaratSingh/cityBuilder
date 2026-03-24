class ConstructRoad {
    constructor(world) {
        this.world = world;
    }

    addRoad(road) {
        let id = this.world.roadIdCount;
        this.world.roads[id] = road;
        road.id = id;
        this.world.roadIdCount++;
        road.segmentIds = [];

        let c1 = road.start;
        let c2 = road.end;

        let ensureInDict = (node) => {
            if (!node) return;
            if (node.radius === 4) { // lane node
                let found = false;
                for (const key in this.world.laneNodes) if (this.world.laneNodes[key] === node) found = true;
                if (!found) {
                    this.world.laneNodes[this.world.laneNodeIdCount] = node;
                    this.world.laneNodeIdCount++;
                }
            } else { // major circle
                let found = false;
                for (const key in this.world.circle) if (this.world.circle[key] === node) found = true;
                if (!found) {
                    if (node.id !== undefined) {
                        this.world.circle[node.id] = node;
                    } else {
                        this.world.circle[this.world.circleIdCount] = node;
                        node.id = this.world.circleIdCount;
                        this.world.circleIdCount++;
                    }
                }
            }
        };
        ensureInDict(c1);
        ensureInDict(c2);

        let baseArray = road.curvePoints || [{ x: c1.x, y: c1.y }, { x: c2.x, y: c2.y }];

        if (road.type === "ONE_WAY_ROAD") {
            let pts = baseArray;
            let ln1 = c1.radius === 4 ? c1 : this.world.addLaneNode(pts[0].x, pts[0].y);
            let ln2 = c2.radius === 4 ? c2 : this.world.addLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);

            let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
            seg.curvePoints = pts;
            seg.baseCurvePoints = [...pts];
            seg.length = this.calculatePathLength(pts);
            let idSeg = this.world.addSegment(seg);
            ln1.SegmentId.push(idSeg);
            ln2.SegmentId.push(idSeg);
            road.segmentIds.push(idSeg);

        } else if (road.type === "NORMAL") {
            let rightPoints = this.getOffsetCurve(baseArray, 7.5);
            let lnR1 = this.world.getOrCreateLaneNode(rightPoints[0].x, rightPoints[0].y);
            let lnR2 = this.world.getOrCreateLaneNode(rightPoints[rightPoints.length - 1].x, rightPoints[rightPoints.length - 1].y);
            let rightSeg = new Segment(lnR1, "rgba(0,0,0,0)", 1, lnR2);
            rightSeg.curvePoints = rightPoints;
            rightSeg.baseCurvePoints = [...rightPoints];
            rightSeg.length = this.calculatePathLength(rightPoints);
            let idRight = this.world.addSegment(rightSeg);
            lnR1.SegmentId.push(idRight);
            lnR2.SegmentId.push(idRight);
            road.segmentIds.push(idRight);

            let reverseBase = [...baseArray].reverse();
            let leftPoints = this.getOffsetCurve(reverseBase, 7.5);
            let lnL1 = this.world.getOrCreateLaneNode(leftPoints[0].x, leftPoints[0].y);
            let lnL2 = this.world.getOrCreateLaneNode(leftPoints[leftPoints.length - 1].x, leftPoints[leftPoints.length - 1].y);
            let leftSeg = new Segment(lnL1, "rgba(0,0,0,0)", 1, lnL2);
            leftSeg.curvePoints = leftPoints;
            leftSeg.baseCurvePoints = [...leftPoints];
            leftSeg.length = this.calculatePathLength(leftPoints);
            let idLeft = this.world.addSegment(leftSeg);
            lnL1.SegmentId.push(idLeft);
            lnL2.SegmentId.push(idLeft);
            road.segmentIds.push(idLeft);

        } else if (road.type === "HIGHWAY") {
            let r1 = this.getOffsetCurve(baseArray, 7.5);
            let r2 = this.getOffsetCurve(baseArray, -7.5);

            let createLane = (pts) => {
                let ln1 = this.world.getOrCreateLaneNode(pts[0].x, pts[0].y);
                let ln2 = this.world.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);
                let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
                seg.curvePoints = pts;
                seg.baseCurvePoints = [...pts];
                seg.length = this.calculatePathLength(pts);
                let segId = this.world.addSegment(seg);
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
                let ln1 = this.world.getOrCreateLaneNode(pts[0].x, pts[0].y);
                let ln2 = this.world.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);
                let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
                seg.curvePoints = pts;
                seg.baseCurvePoints = [...pts];
                seg.length = this.calculatePathLength(pts);
                let segId = this.world.addSegment(seg);
                ln1.SegmentId.push(segId);
                ln2.SegmentId.push(segId);
                road.segmentIds.push(segId);
            };

            createLane(rightInner);
            createLane(rightOuter);
            createLane(leftInner);
            createLane(leftOuter);

        } else if (road.type === "BRIDGE") {
            let rightPoints = this.getOffsetCurve(baseArray, 7.5);
            let reverseBase = [...baseArray].reverse();
            let leftPoints = this.getOffsetCurve(reverseBase, 7.5);

            let createLane = (pts) => {
                let ln1 = this.world.getOrCreateLaneNode(pts[0].x, pts[0].y);
                let ln2 = this.world.getOrCreateLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);
                let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
                seg.curvePoints = pts;
                seg.baseCurvePoints = [...pts];
                seg.length = this.calculatePathLength(pts);
                seg.elevation = 1; // Mark as bridge
                let segId = this.world.addSegment(seg);
                ln1.SegmentId.push(segId);
                ln2.SegmentId.push(segId);
                road.segmentIds.push(segId);
            };
            createLane(rightPoints);
            createLane(leftPoints);

        } else if (road.type === "ONE_WAY_BRIDGE") {
            let pts = baseArray;
            let ln1 = c1.radius === 4 ? c1 : this.world.addLaneNode(pts[0].x, pts[0].y);
            let ln2 = c2.radius === 4 ? c2 : this.world.addLaneNode(pts[pts.length - 1].x, pts[pts.length - 1].y);

            let seg = new Segment(ln1, "rgba(0,0,0,0)", 1, ln2);
            seg.curvePoints = pts;
            seg.baseCurvePoints = [...pts];
            seg.length = this.calculatePathLength(pts);
            seg.elevation = 1; // Mark as bridge
            
            let idSeg = this.world.addSegment(seg);
            ln1.SegmentId.push(idSeg);
            ln2.SegmentId.push(idSeg);
            road.segmentIds.push(idSeg);
        }

        if (c1 && c1.id !== undefined) this.updateIntersectionGeometry(c1);
        if (c2 && c2.id !== undefined) this.updateIntersectionGeometry(c2);

        return id;
    }

    addRoadWithIntersections(startCircle, endCircle, type, curvePoints = null) {
        let incomingBase = curvePoints || [{ x: startCircle.x, y: startCircle.y }, { x: endCircle.x, y: endCircle.y }];

        let closestIntersection = null;
        let closestDist = Infinity;
        let intersectedRoadId = null;
        let incomingHitIndex = -1;
        let existingHitIndex = -1;

        for (const key in this.world.roads) {
            let existingRoad = this.world.roads[key];

            let existingBase = existingRoad.curvePoints || [
                { x: existingRoad.start.x, y: existingRoad.start.y },
                { x: existingRoad.end.x, y: existingRoad.end.y }
            ];

            // If the incoming road shares a start or end with existing road, skip to prevent self-intersection at corners
            if (startCircle === existingRoad.start || startCircle === existingRoad.end ||
                endCircle === existingRoad.start || endCircle === existingRoad.end) continue;

            // --- BRIDGE LOGIC: Skip intersections for bridges ---
            if (type === "BRIDGE" || type === "ONE_WAY_BRIDGE" || existingRoad.type === "BRIDGE" || existingRoad.type === "ONE_WAY_BRIDGE") continue;
            // -----------------------------------------------------

            // Prevent newly drafted off-ramps from treating their parent LaneNode anchor as a massive intersection
            if (startCircle.parentRoadId === key || endCircle.parentRoadId === key) continue;

            for (let i = 0; i < incomingBase.length - 1; i++) {
                let p1 = incomingBase[i];
                let p2 = incomingBase[i + 1];

                for (let j = 0; j < existingBase.length - 1; j++) {
                    let p3 = existingBase[j];
                    let p4 = existingBase[j + 1];

                    let hit = this.doSegmentsIntersect(p1, p2, p3, p4);
                    if (hit) {
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
                this.world.addLaneNode(closestIntersection.x, closestIntersection.y) :
                this.world.addCircle(closestIntersection.x, closestIntersection.y);

            let intersectedRoad = this.world.roads[intersectedRoadId];
            let erStart = intersectedRoad.start;
            let erEnd = intersectedRoad.end;
            let erType = intersectedRoad.type;
            let erCurvePoints = intersectedRoad.curvePoints;

            this.world.removeRoad(intersectedRoadId);

            let erCurve1 = null;
            let erCurve2 = null;
            if (erCurvePoints) {
                erCurve1 = erCurvePoints.slice(0, existingHitIndex + 1);
                erCurve1.push(closestIntersection);

                erCurve2 = [closestIntersection];
                erCurve2.push(...erCurvePoints.slice(existingHitIndex + 1));
            }

            let inCurve1 = null;
            let inCurve2 = null;
            if (curvePoints) {
                inCurve1 = curvePoints.slice(0, incomingHitIndex + 1);
                inCurve1.push(closestIntersection);

                inCurve2 = [closestIntersection];
                inCurve2.push(...curvePoints.slice(incomingHitIndex + 1));
            }

            this.addRoadWithIntersections(erStart, intersectionCircle, erType, erCurve1);
            this.addRoadWithIntersections(intersectionCircle, erEnd, erType, erCurve2);
            this.addRoadWithIntersections(startCircle, intersectionCircle, type, inCurve1);
            this.addRoadWithIntersections(intersectionCircle, endCircle, type, inCurve2);
        } else {
            let newRoad = new Road(startCircle, endCircle, type, curvePoints);
            this.addRoad(newRoad);
        }
    }

    splitRoadAtPoint(roadId, newCircle, splitSegmentIndex, exactPoint) {
        let intersectedRoad = this.world.roads[roadId];
        if (!intersectedRoad) return;

        let erStart = intersectedRoad.start;
        let erEnd = intersectedRoad.end;
        let erType = intersectedRoad.type;
        let erCurvePoints = intersectedRoad.curvePoints;

        this.world.removeRoad(roadId);

        let erCurve1 = null;
        let erCurve2 = null;
        if (erCurvePoints) {
            erCurve1 = erCurvePoints.slice(0, splitSegmentIndex + 1);
            erCurve1.push(exactPoint);

            erCurve2 = [exactPoint];
            erCurve2.push(...erCurvePoints.slice(splitSegmentIndex + 1));
        }

        this.addRoadWithIntersections(erStart, newCircle, erType, erCurve1);
        this.addRoadWithIntersections(newCircle, erEnd, erType, erCurve2);
    }

    splitSegmentAtPoint(segId, exactPoint, splitIndex) {
        let seg = this.world.segments[segId];
        if (!seg) return null;

        let originalCurve = seg.baseCurvePoints || seg.curvePoints || [seg.start, seg.end];
        let originalEnd = seg.end;

        let newLaneNode = this.world.addLaneNode(exactPoint.x, exactPoint.y);

        let parentRoad = null;
        let pId = null;
        for (const key in this.world.roads) {
            if (this.world.roads[key].segmentIds && this.world.roads[key].segmentIds.includes(Number(segId))) {
                parentRoad = this.world.roads[key];
                pId = key;
                newLaneNode.parentRoadId = pId;
                break;
            }
        }

        if (originalEnd && originalEnd.SegmentId) {
            originalEnd.SegmentId = originalEnd.SegmentId.filter(id => id != Number(segId));
        }
        seg.end = newLaneNode;
        if (!newLaneNode.SegmentId) newLaneNode.SegmentId = [];
        newLaneNode.SegmentId.push(Number(segId));

        let curve1 = originalCurve.slice(0, splitIndex + 1);
        curve1.push(exactPoint);
        seg.curvePoints = curve1;
        seg.baseCurvePoints = [...curve1];

        let curve2 = [exactPoint, ...originalCurve.slice(splitIndex + 1)];
        let seg2 = new Segment(newLaneNode, "rgba(241, 37, 170, 0)", 1, originalEnd);
        seg2.curvePoints = curve2;
        seg2.baseCurvePoints = [...curve2];

        let id2 = this.world.addSegment(seg2);
        newLaneNode.SegmentId.push(id2);
        if (originalEnd && originalEnd.SegmentId) originalEnd.SegmentId.push(id2);

        if (parentRoad) {
            parentRoad.segmentIds.push(id2);
            if (parentRoad.start && parentRoad.start.id !== undefined) this.updateIntersectionGeometry(parentRoad.start);
            if (parentRoad.end && parentRoad.end.id !== undefined) this.updateIntersectionGeometry(parentRoad.end);
        }

        this.updateIntersectionGeometry(newLaneNode);
        return newLaneNode;
    }

    updateIntersectionGeometry(circle) {
        if (!circle || circle.id === undefined) return;

        let connectedRoads = [];
        for (const key in this.world.roads) {
            let r = this.world.roads[key];
            if (r.start.id === circle.id || r.end.id === circle.id) {
                connectedRoads.push(r);
            }
        }

        if (connectedRoads.length === 0) {
            delete this.world.intersections[circle.id];
            if (circle.SegmentId && circle.SegmentId.length === 0) {
                this.world.removeNodeIfEmpty(circle);
            }
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

        offsetDist = Math.min(offsetDist, 150);
        let corners = [];

        for (let road of connectedRoads) {
            let isStart = road.start.id === circle.id;
            let pts = road.curvePoints || [{ x: road.start.x, y: road.start.y }, { x: road.end.x, y: road.end.y }];
            let pCenter = { x: circle.x, y: circle.y };
            let pAdj = isStart ? pts[1] : pts[pts.length - 2];
            if (!pAdj) pAdj = isStart ? pts[0] : pts[pts.length - 1];

            let dx = pAdj.x - pCenter.x;
            let dy = pAdj.y - pCenter.y;
            let len = Math.hypot(dx, dy);

            let dirX = dx / len;
            let dirY = dy / len;

            if (isStart) road.pullbackStart = offsetDist;
            else road.pullbackEnd = offsetDist;

            for (let segId of road.segmentIds) {
                let seg = this.world.segments[segId];
                if (seg && seg.baseCurvePoints && seg.baseCurvePoints.length >= 2) {
                    let pFirst = seg.baseCurvePoints[0];
                    let rStart = road.start;
                    let rEnd = road.end;

                    let dFirstToStart = Math.hypot(pFirst.x - rStart.x, pFirst.y - rStart.y);
                    let dFirstToEnd = Math.hypot(pFirst.x - rEnd.x, pFirst.y - rEnd.y);
                    let isBackward = dFirstToEnd < dFirstToStart;

                    let cutStart = 0;
                    let cutEnd = 0;

                    if (seg.start.parentRoadId != road.id) {
                        cutStart = isBackward ? (road.pullbackEnd || 0) : (road.pullbackStart || 0);
                    }
                    if (seg.end.parentRoadId != road.id) {
                        cutEnd = isBackward ? (road.pullbackStart || 0) : (road.pullbackEnd || 0);
                    }

                    seg.curvePoints = this.slicePolyline(seg.baseCurvePoints, cutStart, cutEnd);
                }
            }

            let pIntersect = {
                x: pCenter.x + dirX * offsetDist,
                y: pCenter.y + dirY * offsetDist
            };

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

            let angleLeft = Math.atan2(cLeft.y - pCenter.y, cLeft.x - pCenter.x);
            let angleRight = Math.atan2(cRight.y - pCenter.y, cRight.x - pCenter.x);

            corners.push({ pt: cLeft, angle: angleLeft, road: road, dir: { x: dirX, y: dirY } });
            corners.push({ pt: cRight, angle: angleRight, road: road, dir: { x: dirX, y: dirY } });
        }

        corners.sort((a, b) => a.angle - b.angle);

        this.world.intersections[circle.id] = {
            center: { x: circle.x, y: circle.y },
            corners: corners,
            connectedRoads: connectedRoads,
            segmentIds: this.world.intersections[circle.id]?.segmentIds || []
        };

        this.generateInternalSegments(circle);
    }

    generateInternalSegments(circle) {
        let inter = this.world.intersections[circle.id];
        if (!inter) return;

        if (inter.segmentIds) {
            for (let id of inter.segmentIds) {
                let seg = this.world.segments[id];
                if (seg) {
                    if (seg.start && seg.start.SegmentId) seg.start.SegmentId = seg.start.SegmentId.filter(s => s !== id);
                    if (seg.end && seg.end.SegmentId) seg.end.SegmentId = seg.end.SegmentId.filter(s => s !== id);
                    delete this.world.segments[id];
                }
            }
        }
        inter.segmentIds = [];

        let incoming = [];
        let outgoing = [];

        for (let road of inter.connectedRoads) {
            let roadMinDist = Infinity;
            let tempRoadLanes = [];

            for (let segId of road.segmentIds) {
                let seg = this.world.segments[segId];
                if (!seg || !seg.start || !seg.end || !seg.curvePoints || seg.curvePoints.length < 2) continue;

                let dStart = Math.hypot(seg.start.x - circle.x, seg.start.y - circle.y);
                let dEnd = Math.hypot(seg.end.x - circle.x, seg.end.y - circle.y);
                let approachingDist = Math.min(dStart, dEnd);
                
                let maxDist = circle.radius <= 4 ? 2 : 160;
                if (approachingDist > maxDist) continue;

                roadMinDist = Math.min(roadMinDist, approachingDist);
                tempRoadLanes.push({ seg, dStart, dEnd, approachingDist });
            }

            for (let lane of tempRoadLanes) {
                if (lane.approachingDist > roadMinDist + 20) continue;

                if (lane.dStart < lane.dEnd) {
                    outgoing.push({
                        node: lane.seg.start,
                        road: road,
                        p1: lane.seg.curvePoints[0],
                        p2: lane.seg.curvePoints[1]
                    });
                } else {
                    incoming.push({
                        node: lane.seg.end,
                        road: road,
                        p1: lane.seg.curvePoints[lane.seg.curvePoints.length - 1],
                        p0: lane.seg.curvePoints[lane.seg.curvePoints.length - 2]
                    });
                }
            }
        }

        for (let inData of incoming) {
            for (let outData of outgoing) {
                if (inData.road === outData.road) continue;
                if (inData.node === outData.node) continue;

                let startP = inData.p1;
                let endP = outData.p1;

                let inDx = startP.x - inData.p0.x;
                let inDy = startP.y - inData.p0.y;
                let inLen = Math.hypot(inDx, inDy) || 1;
                let inDir = { x: inDx / inLen, y: inDy / inLen };

                let outDx = outData.p2.x - endP.x;
                let outDy = outData.p2.y - endP.y;
                let outLen = Math.hypot(outDx, outDy) || 1;
                let outDir = { x: outDx / outLen, y: outDy / outLen };

                let directDist = Math.hypot(endP.x - startP.x, endP.y - startP.y);

                let dot = inDir.x * outDir.x + inDir.y * outDir.y;
                if (dot < -0.5) continue;

                let curvePoints;
                if (directDist < 1) {
                    curvePoints = [startP, endP];
                } else {
                    let tension = 0.45;
                    let controlDist = directDist * tension;

                    let cp1 = {
                        x: startP.x + inDir.x * controlDist,
                        y: startP.y + inDir.y * controlDist
                    };

                    let cp2 = {
                        x: endP.x - outDir.x * controlDist,
                        y: endP.y - outDir.y * controlDist
                    };

                    curvePoints = this.getCubicBezierPoints(startP, cp1, cp2, endP, 0.05);
                }

                let invisColor = "rgba(0,0,0,0)";
                let seg = new Segment(inData.node, invisColor, 1, outData.node);
                seg.curvePoints = curvePoints;
                seg.length = this.calculatePathLength(curvePoints);
                seg.isInternal = true;

                let idSeg = this.world.addSegment(seg);
                inData.node.SegmentId.push(idSeg);
                outData.node.SegmentId.push(idSeg);
                inter.segmentIds.push(idSeg);
            }
        }
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
        let pLast = curve[curve.length - 1];
        let pPrev = curve[curve.length - 2];
        let dxEnd = pLast.x - pPrev.x;
        let dyEnd = pLast.y - pPrev.y;
        let lenEnd = Math.hypot(dxEnd, dyEnd);
        result.push({ x: pLast.x + (-dyEnd / lenEnd) * width, y: pLast.y + (dxEnd / lenEnd) * width });
        return result;
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
                break;
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
}
