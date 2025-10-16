class RoadBase {
  constructor(x, y, color = "grey", width = 50) {
    this.color = color;
    this.width = width;
    this.position = { x, y };
  }

  draw(ctx, camera, color) {
    ctx.beginPath();
    if (color) {
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = this.color;
    }
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
  }
}
//--------------------------------------------------------------------------------------------------------------------------------------------------
class Road {
  constructor() {
    this.segments = [];
    this.roadBases = [new RoadBase(0, 0)];
    this.changeable = false;
  }

  createStartSegment(x, y, w = 50, color = "grey") {
    let newSegment = null;

    for (const base of this.roadBases) {
      const d = distance(x, y, base.position.x, base.position.y);
      if (d < base.width / 2) {
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
      const base = new RoadBase(D.x, D.y, color, w);
      this.roadBases.push(base);
      this.createStartSegment(D.x, D.y);
      this.createEndSegment(x, y);
    } else {
      let found = false;
      for (const base of this.roadBases) {
        const d = distance(x, y, base.position.x, base.position.y);
        if (d < base.width / 2) {
          this.segments[this.segments.length - 1].endingPosition = {
            x: base.position.x,
            y: base.position.y,
          };
          found = true;
          break;
        }
      }
      if (!found) {
        this.segments[this.segments.length - 1].endingPosition = { x, y };
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

  draw(ctx, camera, edit) {
    if (edit) {
      this.segments.forEach((segment) => segment.draw(ctx, camera));
      this.roadBases.forEach((base) => base.draw(ctx, camera, "blue"));
    } else {
      this.roadBases.forEach((base) => base.draw(ctx, camera));
      this.segments.forEach((segment) => segment.draw(ctx, camera));
    }
  }
}
