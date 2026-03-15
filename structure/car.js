class Car {
    constructor(world, pathSegIds, color) {
        this.world = world;
        this.pathSegIds = pathSegIds;
        this.currentPathIndex = 0;
        this.color = color;

        let firstSeg = this.world.segments[this.pathSegIds[0]];
        this.x = firstSeg.start.x;
        this.y = firstSeg.start.y;

        this.currentSegment = firstSeg;
        if (this.currentSegment.curvePoints) {
            this.curveIndex = 0;
            this.target = this.currentSegment.curvePoints[this.curveIndex];
        } else {
            this.target = firstSeg.end;
        }

        this.speed = 0.5;
        this.finished = false;
    }

    update() {
        if (this.finished) return;

        let speedLeft = this.speed;

        while (speedLeft > 0 && !this.finished) {
            let dx = this.target.x - this.x;
            let dy = this.target.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= speedLeft) {
                this.x = this.target.x;
                this.y = this.target.y;
                speedLeft -= distance;

                if (this.currentSegment && this.currentSegment.curvePoints && this.curveIndex < this.currentSegment.curvePoints.length - 1) {
                    this.curveIndex++;
                    this.target = this.currentSegment.curvePoints[this.curveIndex];
                } else {
                    this.currentPathIndex++;

                    if (this.currentPathIndex < this.pathSegIds.length) {
                        let nextSeg = this.world.segments[this.pathSegIds[this.currentPathIndex]];
                        this.currentSegment = nextSeg;
                        if (this.currentSegment.curvePoints) {
                            this.curveIndex = 0;
                            this.target = this.currentSegment.curvePoints[this.curveIndex];
                        } else {
                            this.target = nextSeg.end;
                        }
                    } else {
                        this.finished = true;
                    }
                }
            } else {
                this.x += (dx / distance) * speedLeft;
                this.y += (dy / distance) * speedLeft;
                speedLeft = 0;
            }
        }
    }

    draw(ctx) {

        let dx = this.target.x - this.x;
        let dy = this.target.y - this.y;
        let angle = Math.atan2(dy, dx);

        ctx.save();

        ctx.translate(this.x, this.y);
        ctx.rotate(angle);

        ctx.fillStyle = this.color;

        let width = 20;
        let height = 10;

        ctx.fillRect(-width / 2, -height / 2, width, height);

        ctx.restore();
    }
}
