class Car {
    constructor(world, pathSegIds, color) {
        this.world = world;
        this.pathSegIds = pathSegIds;
        this.currentPathIndex = 0;
        this.color = color;

        let firstSeg = this.world.segments[this.pathSegIds[0]];
        if (!firstSeg) {
            this.finished = true;
            return;
        }
        this.x = firstSeg.start.x;
        this.y = firstSeg.start.y;

        this.currentSegment = firstSeg;
        if (this.currentSegment.curvePoints) {
            this.curveIndex = 0;
            this.target = this.currentSegment.curvePoints[this.curveIndex];
        } else {
            this.target = firstSeg.end;
        }

        this.maxSpeed = 0.5;
        this.speed = this.maxSpeed;
        this.finished = false;

        // Size properties for collision
        this.width = 10;
        this.height = 10;
        this.waitTimer = 0;

        // Check for spawn overlap
        for (let otherCar of this.world.cars) {
            if (otherCar === this) continue;
            let dX = otherCar.x - this.x;
            let dY = otherCar.y - this.y;
            if (Math.sqrt(dX * dX + dY * dY) < this.width + 5) {
                this.finished = true;
                return;
            }
        }
    }

    update() {
        if (this.finished) return;

        // Collision Check Logic
        let closestCarDist = Infinity;
        for (let otherCar of this.world.cars) {
            if (otherCar === this || otherCar.finished) continue;

            // Only collide if on same elevation level
            if (otherCar.currentSegment && this.currentSegment) {
                if (otherCar.currentSegment.elevation !== this.currentSegment.elevation) continue;
            }

            // Simplified collision: distance between cars
            let dX = otherCar.x - this.x;
            let dY = otherCar.y - this.y;
            let distToOther = Math.sqrt(dX * dX + dY * dY);

            // Rough check to ensure the car we are looking at is actually roughly "ahead" of us 
            // by using the dot product of our moving direction against the vector to the other car
            let myDirX = this.target.x - this.x;
            let myDirY = this.target.y - this.y;
            let myDirLen = Math.sqrt(myDirX * myDirX + myDirY * myDirY);
            let dirDot = 0;
            if (myDirLen > 0) {
                dirDot = ((dX / distToOther) * (myDirX / myDirLen)) + ((dY / distToOther) * (myDirY / myDirLen));
            }

            // If the car is generally in front of us
            if (dirDot > 0.5 && distToOther < closestCarDist) {
                closestCarDist = distToOther;
            }
        }

        let stopDistance = this.height; // equals 25
        let slowRadius = 60;
        let fastRadius = 120; // past this, go max speed

        if (closestCarDist <= stopDistance) {
            this.speed = 0;
        } else if (closestCarDist <= slowRadius) {
            // Scale speed between 0.1 and maxSpeed depending on how close we are to the stop boundary
            let ratio = (closestCarDist - stopDistance) / (slowRadius - stopDistance);
            this.speed = 0.1 + ratio * (this.maxSpeed - 0.1);
        } else {
            this.speed = this.maxSpeed;
        }

        if (this.speed === 0) {
            this.waitTimer++;
            // 600 frames is approximately 10 seconds at 60 FPS
            if (this.waitTimer > 200) {
                this.finished = true;
            }
            return; // Completely stopped
        } else {
            this.waitTimer = 0;
        }

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
                        if (!nextSeg) {
                            this.finished = true;
                            break;
                        }
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

        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        ctx.restore();
    }
}
