class RoadBase {
  constructor(x, y, color = "grey", width = 50) {
    this.color = color;
    this.width = width;
    this.position = { x, y };
  }

  draw(ctx, color, editWidth) {
    ctx.beginPath();
    ctx.fillStyle = color || this.color;
    ctx.arc(
      this.position.x,
      this.position.y,
      editWidth / 2 || this.width / 2,
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

  draw(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.moveTo(this.startingPosition.x, this.startingPosition.y);
    ctx.lineTo(this.endingPosition.x, this.endingPosition.y);
    ctx.stroke();

    if (this.width == 50) {
      const dx = this.endingPosition.x - this.startingPosition.x;
      const dy = this.endingPosition.y - this.startingPosition.y;
      const angle = Math.atan2(dy, dx);
      this.drawArrow(
        ctx,
        this.startingPosition.x,
        this.startingPosition.y,
        50,
        angle
      );
    }
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
class AreaZone {
  constructor(x, y, w, h, a, color = "grey") {
    this.position = createVector(x, y);
    this.height = h;
    this.width = w;
    this.radius = Math.sqrt(h * h + w * w);
    this.angle = a;
    this.color = color;
  }
  draw(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.lineWidth = 4;
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}

//--------------------------------------------------------------------------------------------------------------------------------------------------
class Road {
  constructor() {
    this.segments = [];
    this.roadBases = [];
    this.areaZone = [];
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
      this.createZone();
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
      this.createZone();
    }
    this.changeable = false;
  }

  createZone() {
    let length = this.segments.length - 1;
    let A = createVector(
      this.segments[length].startingPosition.x,
      this.segments[length].startingPosition.y
    );
    let B = createVector(
      this.segments[length].endingPosition.x,
      this.segments[length].endingPosition.y
    );
    let C = Vector.sub(B, A);
    let Cmag = C.mag();
    C.normalize();

    let mag = 25;
    while (mag <= Cmag) {
      let step = C.copy().mult(mag);
      let D = Vector.add(A, step);
      let perpLeft = createVector(-C.y, C.x);
      perpLeft.setMag(60);
      let finalPosLeft = Vector.add(D, perpLeft);
      this.areaZone.push(
        new AreaZone(finalPosLeft.x, finalPosLeft.y, 50, 50, C.angle())
      );

      let perpRight = createVector(C.y, -C.x);
      perpRight.setMag(60);
      let finalPosRight = Vector.add(D, perpRight);
      this.areaZone.push(
        new AreaZone(finalPosRight.x, finalPosRight.y, 50, 50, C.angle())
      );

      mag += 55;
    }
    this.zoneDeletor();
  }

  zoneDeletor() {
    for (let i = this.areaZone.length - 1; i >= 0; i--) {
      for (let j = i - 1; j >= 0; j--) {
        let d = distance(
          this.areaZone[i].position.x,
          this.areaZone[i].position.y,
          this.areaZone[j].position.x,
          this.areaZone[j].position.y
        );
        if (d < 50) {
          this.areaZone.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.areaZone.length - 1; i >= 0; i--) {
      const circle = this.areaZone[i];
      const P = circle.position;
      const r = 50;

      let collided = false;

      for (let j = 0; j < this.segments.length; j++) {
        const seg = this.segments[j];
        const A = seg.startingPosition;
        const B = seg.endingPosition;

        const AB = { x: B.x - A.x, y: B.y - A.y };
        const AP = { x: P.x - A.x, y: P.y - A.y };

        const ab2 = AB.x * AB.x + AB.y * AB.y;
        const ap_dot_ab = AP.x * AB.x + AP.y * AB.y;

        let t = ap_dot_ab / ab2;
        t = Math.max(0, Math.min(1, t));

        const C = {
          x: A.x + AB.x * t,
          y: A.y + AB.y * t,
        };

        const dx = P.x - C.x;
        const dy = P.y - C.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= r) {
          collided = true;
          break;
        }
      }

      if (collided) {
        this.areaZone.splice(i, 1);
      }
    }
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

  sort() {
    const normal = [];
    const wide = [];
    for (let i = 0; i < this.segments.length; i++) {
      if (this.segments[i].width == 50) {
        wide.push(this.segments[i]);
      } else {
        normal.push(this.segments[i]);
      }
    }

    this.segments = [...normal, ...wide];
  }

  pathWayBase() {
    this.roadBases.forEach((base) => {
      if (base.width == 25 / 2) {
        base.width = 1;
      }
    });
  }

  draw(ctx, { x, y }, edit = true) {
    if (edit) {
      this.segments.forEach((segment) => segment.draw(ctx));
      this.roadBases.forEach((base) => {
        if (base.width == 1) {
          base.width = 25 / 2;
          base.draw(ctx, "blue");
        } else {
          base.draw(ctx, "blue");
        }
      });
      this.areaZone.forEach((zone) => zone.draw(ctx));
    } else {
      this.segments.forEach((segment) => segment.draw(ctx));
      this.roadBases.forEach((base) => base.draw(ctx));
      this.areaZone.forEach((zone) => zone.draw(ctx));
    }
    this.base.position.x = x;
    this.base.position.y = y;
    this.base.draw(ctx);
  }
}
