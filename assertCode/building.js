class Building {
  constructor(x = 0, y = 0, w = 0, h = 0, a = 0, color = "#cd2d2dbd") {
    this.position = createVector(x, y);
    this.zone = null;
    this.height = h;
    this.width = w;
    this.angle = a;
    this.color = color;
    this.build = [];
    this.zone = {};
    this.time = Time;
    this.autoGenerator = {};
  }

  lineRotatedRectCollision(
    x1,
    y1,
    x2,
    y2,
    cx,
    cy,
    w,
    h,
    angle,
    lineWidth = 45
  ) {
    // Cheap early exit (rectangle center vs line midpoint)
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    if (distance(cx, cy, mx, my) > 350) return false;

    // Expand rectangle by line thickness
    const expand = lineWidth / 2;
    w += expand * 2;
    h += expand * 2;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const hw = w / 2;
    const hh = h / 2;

    // Rectangle corners
    const corners = [
      { x: cx + (-hw * cos + hh * sin), y: cy + (-hw * sin - hh * cos) },
      { x: cx + (hw * cos + hh * sin), y: cy + (hw * sin - hh * cos) },
      { x: cx + (hw * cos - hh * sin), y: cy + (hw * sin + hh * cos) },
      { x: cx + (-hw * cos - hh * sin), y: cy + (-hw * sin + hh * cos) },
    ];

    function intersect(ax, ay, bx, by, cx, cy, dx, dy) {
      const den = (dy - cy) * (bx - ax) - (dx - cx) * (by - ay);
      if (Math.abs(den) < 1e-6) return false;

      const ua = ((dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)) / den;
      const ub = ((bx - ax) * (ay - cy) - (by - ay) * (ax - cx)) / den;

      return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    // Line vs rectangle edges
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];
      if (intersect(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
        return true;
      }
    }

    // Line endpoint inside rectangle
    function pointInRotatedRect(px, py) {
      const dx = px - cx;
      const dy = py - cy;

      const lx = dx * cos + dy * sin;
      const ly = -dx * sin + dy * cos;

      return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
    }

    if (pointInRotatedRect(x1, y1) || pointInRotatedRect(x2, y2)) {
      return true;
    }

    return false;
  }

  buildingVSbuildingCollusion() {
    for (let i = 0; i < this.build.length; i++) {
      if (
        distance(
          this.position.x,
          this.position.y,
          this.build[i].position.x,
          this.build[i].position.y
        ) < 300
      ) {
        console.log(4)
        if (rectRectCollision(this, this.build[i])) {
          return true;
        }
      }
    }
    return false;
  }

  searchForArea() {
    for (let i = 0; i < road.areaZone.length; i++) {
      const area = road.areaZone[i];
      let color = area.color;

      if (area.sold) continue;

      const width = random(70, 150);
      const height = width + random(-20, 20);

      let B = Vector.sub(area.position, area.roadPoint);
      B.normalize();
      B.setMag(height / 2 - 25);

      const position = Vector.add(area.position, B);
      const angle = area.angle;

      let hasCollision = false;

      for (const id in road.segments) {
        if (id === "index") continue;

        const seg = road.segments[id];
        const start = road.roadBase[seg.start];
        const end = road.roadBase[seg.end];

        console.log(color);
        if (
          color == "rgba(255, 0, 0, 0.3)" ||
          color == "rgba(0, 0, 255, 0.3)" ||
          color == "rgba(0, 255, 0, 0.3)"
        ) {
          console.log(2);
          if (
            this.lineRotatedRectCollision(
              start.x,
              start.y,
              end.x,
              end.y,
              position.x,
              position.y,
              width,
              height,
              angle
            )
          ) {
            hasCollision = true;
            if (
              this.lineRotatedRectCollision(
                start.x,
                start.y,
                end.x,
                end.y,
                position.x,
                position.y,
                50,
                50,
                angle
              )
            ) {
              area.sold = true;
              break;
            }
            break;
          }
        }
      }
      if (!hasCollision) {
        area.sold = true;

        if (
          color == "rgba(255, 0, 0, 0.3)" ||
          color == "rgba(0, 0, 255, 0.3)" ||
          color == "rgba(0, 255, 0, 0.3)"
        ) {
          this.build.push(
            new Build(position.x, position.y, width, height, angle, color, {
              segmentIndex: area.segmentIndex,
              point: area.roadPoint,
            })
          );
        }
      }
    }
  }

  placeBuilding() {
    if (this.color == "#f700ffff") {
      this.build.push(
        new Build(
          this.position.x,
          this.position.y,
          this.width,
          this.height,
          this.angle,
          "#ff8400ff",
          this.zone
        )
      );
    }
  }

  draw(ctx, { x, y }) {
    this.build.forEach((build) => build.draw(ctx));

    if (Tab == "Building") {
      this.position.x = x;
      this.position.y = y;
      this.width = object.Building[object.select].width;
      this.height = object.Building[object.select].height;
      let collusion = false;
      this.color="#cd2d2dbd"

      for (let i = 0; i < road.areaZone.length; i++) {
        let area = road.areaZone[i];
        let d = distance(x, y, area.position.x, area.position.y);

        if (d < 25) {
          this.angle = area.angle;

          let B = Vector.sub(area.position, area.roadPoint);
          B.normalize();
          B.setMag(this.height / 2 - 15);

          this.position = Vector.add(area.position, B);

          this.zone = {
            segmentIndex: road.areaZone.segmentIndex,
            point: road.areaZone.roadPoint,
          };

          collusion = this.buildingVSbuildingCollusion();

          for (const id in road.segments) {
            if (id === "index") continue;
            let seg = road.segments[id];
            let start = road.roadBase[seg.start];
            let end = road.roadBase[seg.end];

            if (
              this.lineRotatedRectCollision(
                start.x,
                start.y,
                end.x,
                end.y,
                this.position.x,
                this.position.y,
                this.width,
                this.height,
                this.angle
              )
            ) {
              collusion = true;
              break;
            }
          }
          this.color = collusion ? "#cd2d2dbd" : "#f700ffff";
        }
      }

      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      //ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      //  ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    } else if (Tab == "Trees") {
      this.position.x = x;
      this.position.y = y;
      this.width = object.Trees[object.select].width;
      this.height = object.Trees[object.select].height;
      this.color = "#f700ffff";

      for (const id in road.segments) {
        if (id === "index") continue;
        let seg = road.segments[id];

        let start = road.roadBase[seg.start];
        let end = road.roadBase[seg.end];

        if (
          this.lineRotatedRectCollision(
            start.x,
            start.y,
            end.x,
            end.y,
            this.position.x,
            this.position.y,
            this.width,
            this.height,
            this.angle
          )
        ) {
          this.color = "#cd2d2dbd";
          break;
        } else {
          this.color = "#f700ffff";
        }
      }

      ctx.save();
      ctx.translate(this.position.x, this.position.y);
      ctx.rotate(this.angle);
      ctx.beginPath();
      //ctx.strokeStyle = "red";
      ctx.lineWidth = 4;
      ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
      //  ctx.stroke();
      ctx.fillStyle = this.color;
      ctx.fill();
      ctx.restore();
    }
  }
}
