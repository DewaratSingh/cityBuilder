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
    const expand = lineWidth / 2;

    w += expand * 2;
    h += expand * 2;

    const cos = Math.cos(angle);
    const sin = Math.sin(angle);

    const hw = w / 2;
    const hh = h / 2;

    const corners = [
      { x: cx + (-hw * cos - -hh * sin), y: cy + (-hw * sin + -hh * cos) },
      { x: cx + (hw * cos - -hh * sin), y: cy + (hw * sin + -hh * cos) },
      { x: cx + (hw * cos - hh * sin), y: cy + (hw * sin + hh * cos) },
      { x: cx + (-hw * cos - hh * sin), y: cy + (-hw * sin + hh * cos) },
    ];

    function intersect(ax, ay, bx, by, cx, cy, dx, dy) {
      const den = (dy - cy) * (bx - ax) - (dx - cx) * (by - ay);
      if (Math.abs(den) < 0.00001) return false;

      const ua = ((dx - cx) * (ay - cy) - (dy - cy) * (ax - cx)) / den;
      const ub = ((bx - ax) * (ay - cy) - (by - ay) * (ax - cx)) / den;

      return ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1;
    }

    // 1️⃣ Line vs rectangle
    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];

      if (intersect(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
        return true;
      }
    }

    // 2️⃣ Building vs building (SAT) for current preview building
    if (this.build && this.build.length > 0) {
      const getCorners = (Z) => {
        const hw = Z.width / 2;
        const hh = Z.height / 2;
        const cos = Math.cos(Z.angle);
        const sin = Math.sin(Z.angle);

        return [
          { x: -hw, y: -hh },
          { x: hw, y: -hh },
          { x: hw, y: hh },
          { x: -hw, y: hh },
        ].map((p) => ({
          x: p.x * cos - p.y * sin + Z.position.x,
          y: p.x * sin + p.y * cos + Z.position.y,
        }));
      };

      const rect = {
        position: { x: cx, y: cy },
        width: w,
        height: h,
        angle: angle,
      };

      const cornersPreview = getCorners(rect);

      for (let i = 0; i < this.build.length; i++) {
        const placed = this.build[i];
        const dx = cx - placed.position.x;
        const dy = cy - placed.position.y;
        const r = (w + placed.width) / 4 + (h + placed.height) / 4; // cheap radius check
        if (dx * dx + dy * dy > r * r) continue;

        const cornersPlaced = getCorners(placed);

        const axes = [];
        const addAxes = (c) => {
          for (let k = 0; k < 4; k++) {
            const p1 = c[k];
            const p2 = c[(k + 1) % 4];
            let nx = -(p2.y - p1.y);
            let ny = p2.x - p1.x;
            const len = Math.hypot(nx, ny);
            nx /= len;
            ny /= len;
            axes.push({ x: nx, y: ny });
          }
        };

        addAxes(cornersPreview);
        addAxes(cornersPlaced);

        let collision = true;
        for (let axis of axes) {
          let minA = Infinity,
            maxA = -Infinity;
          let minB = Infinity,
            maxB = -Infinity;

          for (let p of cornersPreview) {
            const proj = p.x * axis.x + p.y * axis.y;
            minA = Math.min(minA, proj);
            maxA = Math.max(maxA, proj);
          }

          for (let p of cornersPlaced) {
            const proj = p.x * axis.x + p.y * axis.y;
            minB = Math.min(minB, proj);
            maxB = Math.max(maxB, proj);
          }

          if (maxA < minB || maxB < minA) {
            collision = false;
            break;
          }
        }

        if (collision) return true;
      }
    }

    return false;
  }

  searchForArea() {
    for (let i = 0; i < road.areaZone.length; i++) {
      const area = road.areaZone[i];

      if (area.sold) continue;

      const width = random(70, 150);
      const height = width+ random(-20, 20);

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
          break;
        }
      }
      if (!hasCollision) {
        area.sold = true;

        this.build.push(
          new Build(
            position.x,
            position.y,
            width,
            height,
            angle,
            randomColor(),
            {
              segmentIndex: area.segmentIndex,
              point: area.roadPoint,
            }
          )
        );
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
    // ctx.arc(this.position.x,this.position.y,this.radius,0,2*Math.PI)
    // ctx.fill()

    this.build.forEach((build) => build.draw(ctx));

    if (Tab == "Building") {
      this.position.x = x;
      this.position.y = y;
      this.width = object.Building[object.select].width;
      this.height = object.Building[object.select].height;
      this.color = "#cd2d2dbd";

      for (let i = 0; i < road.areaZone.length; i++) {
        let area = road.areaZone[i];
        let d = distance(x, y, area.position.x, area.position.y);

        if (d < 25) {
          this.angle = area.angle;

          let B = Vector.sub(area.position, area.roadPoint);
          B.normalize();
          B.setMag(this.height / 2 - 25);

          this.position = Vector.add(area.position, B);

          this.zone = {
            segmentIndex: road.areaZone.segmentIndex,
            point: road.areaZone.roadPoint,
          };

          for (const id in road.segments) {
            if (id === "index") continue;
            let seg = road.segments[id];
            let start = road.roadBase[seg.start];
            let end = road.roadBase[seg.end];

            this.color = "#f700ffff";
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
            }
          }

          break;
        } else {
          this.color = "#cd2d2dbd";
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
      this.width = object.Building[object.select].width;
      this.height = object.Building[object.select].height;
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
