class RoadBase {
  constructor(x, y, color = "grey", width = 50) {
    this.color = color;
    this.width = width;
    this.position = { x, y };
  }

  draw(ctx, camera, color) {
    ctx.beginPath();
    ctx.fillStyle = color || this.color;
    ctx.arc(
      this.position.x + camera.x,
      this.position.y + camera.y,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------------

class Segment {
  constructor(x, y, color = "grey", width = 50, ex = x, ey = y) {
    this.type = "countryside";
    this.color = color;
    this.width = width;
    this.startingPosition = { x, y };
    this.endingPosition = { x: ex, y: ey };
    this.nextSegments = [];
    this.previousSegments = [];
    this.vector;
  }

  draw(ctx, camera) {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.moveTo(
      this.startingPosition.x + camera.x,
      this.startingPosition.y + camera.y
    );
    ctx.lineTo(
      this.endingPosition.x + camera.x,
      this.endingPosition.y + camera.y
    );
    ctx.stroke();
    const dx = this.endingPosition.x - this.startingPosition.x;
    const dy = this.endingPosition.y - this.startingPosition.y;
    const angle = Math.atan2(dy, dx);

    this.drawArrow(
      ctx,
      this.startingPosition.x + camera.x,
      this.startingPosition.y + camera.y,
      50,
      angle
    );
  }

  drawArrow(ctx, x, y, length = 100, angle = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 5;
    ctx.moveTo(0, 0);
    ctx.lineTo(length - 5, 0);
    ctx.stroke();
    const headSize = 15;
    ctx.beginPath();
    ctx.moveTo(length, 0);
    ctx.lineTo(length - headSize, headSize / 2);
    ctx.lineTo(length - headSize, -headSize / 2);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();
    ctx.restore();
  }
}
//--------------------------------------------------------------------------------------------------------------------------------------------------
class Road {
  constructor() {
    this.segments = [];
    this.roadBases = [];
    this.changeable = false;
    this.base = new RoadBase(-50, -50, "skyblue", 50);
  }

  createStartSegment(x, y, w = 50, color = "grey") {
    let newSegment = null;

    for (const base of this.roadBases) {
      const d = distance(x, y, base.position.x, base.position.y);
      if (d < base.width / 2) {
        let index = [];
        for (let i = 0; i < this.segments.length; i++) {
          if (
            this.segments[i].startingPosition.x == base.position.x &&
            this.segments[i].startingPosition.x == base.position.y
          ) {
            this.segments[i].previousSegments.push(this.segments.length);
            break;
          } else if (
            this.segments[i].endingPosition.x == base.position.x &&
            this.segments[i].endingPosition.x == base.position.y
          ) {
            this.segments[i].nextSegments.push(this.segments.length);
            break;
          }
        }
        newSegment = new Segment(base.position.x, base.position.y, color, w);
        this.segments.push(newSegment);
        break;
      }
    }
    if (newSegment === null) {
      const base = new RoadBase(x, y, color, w);
      this.roadBases.push(base);
      newSegment = new Segment(x, y, color, w);
      this.segments.push(newSegment);
    }

    this.changeable = true;
    return newSegment;
  }

  createEndSegment(x, y, w = 50, color = "grey") {
    const d = distance(
      x,
      y,
      this.segments[this.segments.length - 1].startingPosition.x,
      this.segments[this.segments.length - 1].startingPosition.y
    );
    if (d > 250) {
      let A = createVector(
        this.segments[this.segments.length - 1].startingPosition.x,
        this.segments[this.segments.length - 1].startingPosition.y
      );
      let B = createVector(x, y);
      let C = Vector.sub(B, A);
      C.setMag(200);
      let D = Vector.add(A, C);
      this.segments[this.segments.length - 1].endingPosition = {
        x: D.x,
        y: D.y,
      };
      this.segments[this.segments.length - 1].vector = Vector.sub(
        createVector(D.x, D.y),
        createVector(
          this.segments[this.segments.length - 1].startingPosition.x,
          this.segments[this.segments.length - 1].startingPosition.y
        )
      );
      const base = new RoadBase(D.x, D.y, color, w);
      this.roadBases.push(base);
      this.createStartSegment(D.x, D.y, w, color);
      this.createEndSegment(x, y, w, color);
    } else {
      let found = false;
      for (const base of this.roadBases) {
        const d = distance(x, y, base.position.x, base.position.y);
        if (d < base.width / 2) {
          this.segments[this.segments.length - 1].endingPosition = {
            x: base.position.x,
            y: base.position.y,
          };
          this.segments[this.segments.length - 1].vector = Vector.sub(
            createVector(base.position.x, base.position.y),
            createVector(
              this.segments[this.segments.length - 1].startingPosition.x,
              this.segments[this.segments.length - 1].startingPosition.y
            )
          );
          found = true;
          break;
        }
      }
      if (!found) {
        this.segments[this.segments.length - 1].endingPosition = { x, y };
        this.segments[this.segments.length - 1].vector = Vector.sub(
          createVector(x, y),
          createVector(
            this.segments[this.segments.length - 1].startingPosition.x,
            this.segments[this.segments.length - 1].startingPosition.y
          )
        );
        const base = new RoadBase(x, y, color, w);
        this.roadBases.push(base);
      }
    }
    this.changeable = false;
  }

  createEndSegmentMove(x, y, w = 50, color = "grey") {
    if (this.segments.length > 0 && this.changeable) {
      this.segments[this.segments.length - 1].endingPosition = { x, y };
    }
  }

  deleteSegmentAndBase(index) {
    this.segments.splice(index, 1);
    this.roadBases.splice(index, 1);
  }

  draw(ctx, camera, edit, { x, y, w }) {
    if (edit == "Road") {
      this.base.position.x = x;
      this.base.position.y = y;
      this.base.width = w;
      this.base.draw(ctx, camera);
      this.segments.forEach((segment) => segment.draw(ctx, camera));
      this.roadBases.forEach((base) => base.draw(ctx, camera, "blue"));
    } else {
      this.segments.forEach((segment) => segment.draw(ctx, camera));
      this.roadBases.forEach((base) => base.draw(ctx, camera));
    }
  }
}
