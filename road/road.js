class Road {
  constructor() {
    this.segments = [];
    this.areaZone = [];
    this.roadBase = [];
    this.base = new Circle(-50, -50, "skyblue", 50);
    this.changeable = false;
    this.editMode = false;
  }

  isalreadyRoad(x, y) {
    for (let i = 0; i < this.segments.length; i++) {
      const segment = this.segments[i];

      const d1 = distance(
        x,
        y,
        segment.startingPosition.x,
        segment.startingPosition.y
      );
      const d2 = distance(
        x,
        y,
        segment.endingPosition.x,
        segment.endingPosition.y
      );

      if (d1 < segment.width / 2) {
        segment.previousSegments.push(this.segments.length);
        let newSegment = new Segment(segment.startingPosition);
        newSegment.previousSegments.push(i);
        this.segments.push(newSegment);
        return true;
      } else if (d2 < segment.width / 2) {
        segment.nextSegments.push(this.segments.length);
        let newSegment = new Segment(segment.endingPosition);
        newSegment.previousSegments.push(i);
        this.segments.push(newSegment);
        return true;
      }
    }

    return false;
  }

  createStartSegment({ x, y }, w = 50, color = "grey") {
    let newSegment = this.isalreadyRoad(x, y);

    if (!newSegment) {
      let segment = new Segment({ x, y }, color, w);
      this.segments.push(segment);
    }
    this.changeable = true;
  }

  createEndSegmentMove({ x, y }) {
    if (this.segments.length > 0 && this.changeable) {
      this.segments[this.segments.length - 1].endingPosition.x = x;
      this.segments[this.segments.length - 1].endingPosition.y = y;
    }
  }

  createEndSegment({ x, y }) {
    const d = distance(
      x,
      y,
      this.segments[this.segments.length - 1].startingPosition.x,
      this.segments[this.segments.length - 1].startingPosition.y
    );
    if (d < 1) {
      this.segments.splice(this.segments.length - 1, 1);
      return;
    }
    this.roadBase.push(
      new Circle(
        this.segments[this.segments.length - 1].startingPosition.x,
        this.segments[this.segments.length - 1].startingPosition.y,
        "grey",
        50
      )
    );

    if (d > 300) {
      let A = this.segments[this.segments.length - 1].startingPosition;

      let B = createVector(x, y);
      let C = Vector.sub(B, A);
      C.setMag(250);
      let D = Vector.add(A, C);
      this.segments[this.segments.length - 1].endingPosition = createVector(
        D.x,
        D.y
      );
      this.roadBase.push(new Circle(D.x, D.y, "grey", 50));

      this.createZone();
      this.createStartSegment(D);
      this.createEndSegment({ x, y });
    } else {
      let found = false;
      for (let i = 0; i < this.segments.length - 1; i++) {
        const segment = this.segments[i];

        const d1 = distance(
          x,
          y,
          segment.startingPosition.x,
          segment.startingPosition.y
        );
        const d2 = distance(
          x,
          y,
          segment.endingPosition.x,
          segment.endingPosition.y
        );
        if (d1 < segment.width / 2) {
          segment.previousSegments.push(this.segments.length);
          this.segments[this.segments.length - 1].nextSegments.push(i);
          this.segments[this.segments.length - 1].endingPosition =
            segment.startingPosition;
          found = true;
          break;
        } else if (d2 < segment.width / 2) {
          segment.nextSegments.push(this.segments.length);
          this.segments[this.segments.length - 1].nextSegments.push(i);
          this.segments[this.segments.length - 1].endingPosition =
            segment.endingPosition;
          found = true;
          break;
        }
      }

      if (!found) {
        this.segments[this.segments.length - 1].endingPosition = createVector(
          x,
          y
        );

        this.roadBase.push(new Circle(x, y, "grey", 50));
      }
      this.createZone();
    }
    this.changeable = false;
  }

  createZone() {
    let length = this.segments.length - 1;
    let A = this.segments[length].startingPosition;
    let B = this.segments[length].endingPosition;

    let C = Vector.sub(B, A);
    let Cmag = C.mag();
    C.normalize();

    let mag = 25;
    while (mag <= Cmag) {
      let step = C.copy().mult(mag);
      let D = Vector.add(A, step);
      let perpLeft = createVector(-C.y, C.x);
      perpLeft.setMag(80);
      let finalPosLeft = Vector.add(D, perpLeft);
      this.areaZone.push(
        new AreaZone(finalPosLeft.x, finalPosLeft.y, 100, 100, C.angle())
      );

      let perpRight = createVector(C.y, -C.x);
      perpRight.setMag(80);
      let finalPosRight = Vector.add(D, perpRight);
      this.areaZone.push(
        new AreaZone(finalPosRight.x, finalPosRight.y, 100, 100, C.angle())
      );

      mag += 110; //55
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
        if (d < 100) {
          this.areaZone.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.areaZone.length - 1; i >= 0; i--) {
      const circle = this.areaZone[i];
      const P = circle.position;
      const r = 70;

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

  deleteSegmentAndBase(index) {
    this.segments.splice(index, 1);
    this.roadBases.splice(index, 1);
  }

  draw(ctx, { x, y }, zone) {
    if (this.editMode) {
      this.segments.forEach((segment) => segment.draw(ctx));
      this.roadBase.forEach((segment) => segment.draw(ctx, "blue"));
      this.areaZone.forEach((zone) => zone.draw(ctx,zone));
      this.base.position.x = x;
      this.base.position.y = y;
      this.base.draw(ctx);
    } else {
      this.segments.forEach((segment) => segment.draw(ctx));
      this.roadBase.forEach((segment) => segment.draw(ctx));
      this.areaZone.forEach((areazone) => areazone.draw(ctx,zone));
    }
  }
}
