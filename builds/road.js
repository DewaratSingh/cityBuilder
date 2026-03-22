class Road {
    constructor(start, end, type = "NORMAL", curvePoints = null) {
        this.start = start;
        this.end = end;
        this.type = type;
        this.curvePoints = curvePoints;
        
        // Map types to visual base widths (15 pixels per physical lane + padding)
        if (type === "ONE_WAY_ROAD") this.width = 15;
        else if (type === "NORMAL" || type === "HIGHWAY") this.width = 30;
        else if (type === "FOUR_LANE_ROAD") this.width = 60;
        else if (type === "TWO_WAY_HIGHWAY") this.width = 70;
        else this.width = 30; // fallback

        this.color = "#444"; // Asphalt color
        this.lineColor = "#fff"; // Dashed white line
        this.yellowLine = "#f1c40f"; // Solid/Dashed yellow divider
    }

    _getOffsetCurve(curve, width) {
        if (!curve || curve.length < 2) return curve;
        let result = [];
        for (let i = 0; i < curve.length - 1; i++) {
            let p1 = curve[i];
            let p2 = curve[i + 1];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let len = Math.hypot(dx, dy);
            result.push({ x: p1.x + (-dy / len) * width, y: p1.y + (dx / len) * width });
        }
        let pL = curve[curve.length - 1];
        let pP = curve[curve.length - 2];
        let dxEnd = pL.x - pP.x;
        let dyEnd = pL.y - pP.y;
        let lenEnd = Math.hypot(dxEnd, dyEnd);
        result.push({ x: pL.x + (-dyEnd / lenEnd) * width, y: pL.y + (dxEnd / lenEnd) * width });
        return result;
    }

    _drawPath(ctx, points, color, lineWidth, dashed = false) {
        if (!points || points.length < 2) return;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = lineWidth;
        if (dashed) ctx.setLineDash([10, 15]);
        
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        if (dashed) ctx.setLineDash([]);
    }

    _slicePolyline(points, cutStart, cutEnd) {
        if (!points || points.length < 2) return points;
        let totalLen = 0;
        let segLengths = [];
        for (let i = 0; i < points.length - 1; i++) {
            let dx = points[i+1].x - points[i].x;
            let dy = points[i+1].y - points[i].y;
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
            let p2 = points[i+1];
            let segDist = segLengths[i];

            let segStartDist = currentDist;
            let segEndDist = currentDist + segDist;

            if (!startAdded && cutStart <= segEndDist) {
                let t = (cutStart - segStartDist) / segDist;
                t = Math.max(0, Math.min(1, t));
                result.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
                startAdded = true;
            }

            if (startAdded && cutEndFromStart > segStartDist && cutEndFromStart < segEndDist) {
                let t = (cutEndFromStart - segStartDist) / segDist;
                result.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
                break; // End cut reached
            } else if (startAdded && cutEndFromStart >= segEndDist) {
                result.push(p2);
            }

            currentDist += segDist;
        }

        return result.length > 1 ? result : points; // return original if sliced to oblivion
    }

    draw(ctx, isHovered = false) {
        if (!this.start || !this.end) return;

        let baseArray = this.curvePoints || [ {x: this.start.x, y: this.start.y}, {x: this.end.x, y: this.end.y} ];
        
        baseArray = this._slicePolyline(baseArray, this.pullbackStart || 0, this.pullbackEnd || 0);

        // 1. Draw solid continuous Asphalt block
        let drawColor = isHovered ? "#e74c3c" : this.color;
        this._drawPath(ctx, baseArray, drawColor, this.width, false);

        // 2. Draw Dividers based on road type
        if (this.type === "NORMAL" || this.type === "SPLINE") {
            // Bi-directional dashed yellow down the center
            this._drawPath(ctx, baseArray, this.yellowLine, 2, true);
            
        } else if (this.type === "HIGHWAY") {
            // Uni-directional dashed white down the center
            this._drawPath(ctx, baseArray, this.lineColor, 2, true);

        } else if (this.type === "FOUR_LANE_ROAD") {
            // Solid double yellow in center
            let shiftLeft = this._getOffsetCurve(baseArray, -2);
            let shiftRight = this._getOffsetCurve(baseArray, 2);
            this._drawPath(ctx, shiftLeft, this.yellowLine, 2, false);
            this._drawPath(ctx, shiftRight, this.yellowLine, 2, false);

            // Dashed white between specific driving lanes (at offset 15)
            let laneBorder1 = this._getOffsetCurve(baseArray, -15);
            let laneBorder2 = this._getOffsetCurve(baseArray, 15);
            this._drawPath(ctx, laneBorder1, this.lineColor, 2, true);
            this._drawPath(ctx, laneBorder2, this.lineColor, 2, true);

        } else if (this.type === "TWO_WAY_HIGHWAY") {
            // Thick concrete/asphalt median block at center
            this._drawPath(ctx, baseArray, "#222", 6, false);
            
            // Solid yellow safety borders hugging median
            let shiftLeft = this._getOffsetCurve(baseArray, -4);
            let shiftRight = this._getOffsetCurve(baseArray, 4);
            this._drawPath(ctx, shiftLeft, this.yellowLine, 2, false);
            this._drawPath(ctx, shiftRight, this.yellowLine, 2, false);

            // Dashed white between lanes (at offset 17.5 due to thicker center)
            let laneBorder1 = this._getOffsetCurve(baseArray, -17.5);
            let laneBorder2 = this._getOffsetCurve(baseArray, 17.5);
            this._drawPath(ctx, laneBorder1, this.lineColor, 2, true);
            this._drawPath(ctx, laneBorder2, this.lineColor, 2, true);
        }
        // ONE_WAY_ROAD gets no dividers, just a clean slab of 15px asphalt.
    }
}
