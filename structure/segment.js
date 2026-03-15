class Segment {
    constructor(i, color = "rgba(0,0,0,0)", width = 1, j = i) {
        this.color = color;
        this.width = width;
        this.start = i;
        this.end = j;
    }


    draw(ctx) {
        if (!this.start || !this.end) return;

        ctx.beginPath();
        ctx.strokeStyle = this.color;
        ctx.lineWidth = this.width;

        if (this.curvePoints && this.curvePoints.length > 0) {
            ctx.moveTo(this.curvePoints[0].x, this.curvePoints[0].y);
            for (let i = 1; i < this.curvePoints.length; i++) {
                ctx.lineTo(this.curvePoints[i].x, this.curvePoints[i].y);
            }
        } else {
            ctx.moveTo(this.start.x, this.start.y);
            ctx.lineTo(this.end.x, this.end.y);
        }
        ctx.stroke();
    }
}
