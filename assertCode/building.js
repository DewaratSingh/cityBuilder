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

  syncToChunks() {
    console.log("Building: Syncing to Chunks. RAM Size:", this.build.length);
    // 1. Reset ROM for active chunks
    window.contry.loadChunk.forEach(chunk => {
      chunk.build = [];
    });

    // 2. Dump RAM to ROM
    this.build.forEach(b => {
      if (b.chunk) {
        if (
          window.contry.chunks[b.chunk.x] &&
          window.contry.chunks[b.chunk.x][b.chunk.y]
        ) {
          window.contry.chunks[b.chunk.x][b.chunk.y].build.push(b);
        }
      }
    });
  }

  loadFromChunks() {
    this.build = [];
    window.contry.loadChunk.forEach((chunk) => {
      this.build.push(...chunk.build);
    });
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
        if (rectRectCollision(this, this.build[i])) {
          return true;
        }
      }
    }
    return false;
  }

  searchForArea() {
    const VALID_ZONE_COLORS = new Set([
      "rgba(255, 0, 0, 0.3)",
      "rgba(0, 0, 255, 0.3)",
      "rgba(0, 255, 0, 0.3)",
    ]);

    for (let i = 0; i < window.road.areaZone.length; i++) {
      const area = window.road.areaZone[i];

      if (area.sold) continue;

      const color = area.color;
      if (!VALID_ZONE_COLORS.has(color)) continue;

      const width = random(70, 150);
      const height = width + random(-20, 20);
      const angle = area.angle;

      let B = Vector.sub(area.position, area.roadPoint);
      B.normalize();
      B.setMag(height / 2 - 15);
      const position = Vector.add(area.position, B);

      let bigCollision = false;

      for (const id in window.road.segments) {
        if (id === "index") continue;

        const seg = window.road.segments[id];
        const start = window.road.roadBase[seg.start];
        const end = window.road.roadBase[seg.end];

        // Check if start and end points exist
        if (!start || !end) continue;

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
          bigCollision = true;
          break;
        }
      }

      if (!bigCollision) {
        for (let b of this.build) {
          if (
            rectRectCollision(
              { x: position.x, y: position.y, width, height, angle },
              b
            )
          ) {
            bigCollision = true;
            break;
          }
        }
      }

      if (!bigCollision) {
        area.sold = true;

        const chunkIdx = window.contry.getChunkIndex(position.x, position.y);
        const newBuild = new Build(
          position.x,
          position.y,
          width,
          height,
          angle,
          color,
          {
            segmentIndex: area.segmentIndex,
            point: area.roadPoint,
          },
          chunkIdx
        );

        let isActive = false;
        if (chunkIdx) {
          const chunk = window.contry.chunks[chunkIdx.x][chunkIdx.y];
          if (window.contry.loadChunk.includes(chunk)) {
            isActive = true;
          } else {
            chunk.build.push(newBuild);
          }
        }

        if (isActive || !chunkIdx) {
          this.build.push(newBuild);
        }

        continue;
      }

      let minBlocked = false;

      if (!minBlocked) {
        for (let b of this.build) {
          if (
            rectRectCollision(
              { x: position.x, y: position.y, width: 50, height: 50, angle },
              b
            )
          ) {
            minBlocked = true;
            break;
          }
        }
      }

      if (minBlocked) {
        area.sold = true;
      }
    }
  }

  placeBuilding() {
    if (this.color == "#f700ffff") {
      const chunkIdx = window.contry.getChunkIndex(this.position.x, this.position.y);
      const newBuild = new Build(
        this.position.x,
        this.position.y,
        this.width,
        this.height,
        this.angle,
        "#ff8400ff",
        this.zone,
        chunkIdx
      );

      let isActive = false;
      if (chunkIdx) {
        const chunk = window.contry.chunks[chunkIdx.x][chunkIdx.y];
        if (window.contry.loadChunk.includes(chunk)) {
          isActive = true;
        } else {
          chunk.build.push(newBuild);
        }
      }

      if (isActive || !chunkIdx) {
        this.build.push(newBuild);
      }
    }
  }

  draw(ctx, { x, y }) {
    // Calculate camera center viewpoint in world coordinates
    const viewPoint = window.camera.getMousePosition({
      clientX: ctx.canvas.width / 2,
      clientY: ctx.canvas.height / 2
    });

    // Sort buildings by distance from viewpoint (far to near)
    // This ensures proper depth ordering for 3D rendering
    const sortedBuildings = [...this.build].sort((a, b) => {
      const distA = Math.hypot(a.position.x - viewPoint.x, a.position.y - viewPoint.y);
      const distB = Math.hypot(b.position.x - viewPoint.x, b.position.y - viewPoint.y);
      return distB - distA; // Far buildings first, near buildings last
    });

    // Draw all buildings with 3D perspective
    sortedBuildings.forEach((build) => build.draw(ctx, viewPoint));

    if (Tab == "Building") {
      this.position.x = x;
      this.position.y = y;
      this.width = object.Building[object.select].width;
      this.height = object.Building[object.select].height;
      let collusion = false;
      this.color = "#cd2d2dbd";

      for (let i = 0; i < window.road.areaZone.length; i++) {
        let area = window.road.areaZone[i];
        let d = distance(x, y, area.position.x, area.position.y);

        if (d < 25) {
          this.angle = area.angle;

          let B = Vector.sub(area.position, area.roadPoint);
          B.normalize();
          B.setMag(this.height / 2 - 15);

          this.position = Vector.add(area.position, B);

          this.zone = {
            segmentIndex: window.road.areaZone.segmentIndex,
            point: window.road.areaZone.roadPoint,
          };

          collusion = this.buildingVSbuildingCollusion();

          for (const id in window.road.segments) {
            if (id === "index") continue;
            let seg = window.road.segments[id];
            let start = window.road.roadBase[seg.start];
            let end = window.road.roadBase[seg.end];

            // Check if start and end exist
            if (!start || !end) continue;

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
      let collusion = false;
      this.color = "#cd2d2dbd";

      collusion = this.buildingVSbuildingCollusion();

      for (const id in window.road.segments) {
        if (id === "index") continue;
        let seg = window.road.segments[id];
        let start = window.road.roadBase[seg.start];
        let end = window.road.roadBase[seg.end];

        // Check if start and end exist
        if (!start || !end) continue;

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

  saveToLocalStorage() {
    this.syncToChunks();
    const buildingsData = [];

    // Iterate ROM
    const chunks = window.contry.chunks;
    for (let y = 0; y < chunks.length; y++) {
      for (let x = 0; x < chunks[y].length; x++) {
        chunks[y][x].build.forEach(b => {
          buildingsData.push({
            x: b.position.x,
            y: b.position.y,
            w: b.width,
            h: b.height,
            angle: b.angle,
            color: b.color,
            zone: b.segmentIndexAndPoint,
            // Save house properties for consistent reload
            house: {
              width: b.house.width,
              height: b.house.height,
              offsetX: b.house.offsetX,
              offsetY: b.house.offsetY,
              roofStyle: b.house.roofStyle,
              wallColor: b.house.wallColor,
              roofColor: b.house.roofColor,
              buildingHeight: b.house.buildingHeight
            }
          });
        });
      }
    }

    localStorage.setItem("BUILDING_DATA", JSON.stringify(buildingsData));
  }

  loadFromLocalStorage() {
    const raw = localStorage.getItem("BUILDING_DATA");
    if (!raw) return;
    const data = JSON.parse(raw);

    // Clear ROM
    const chunks = window.contry.chunks;
    for (let y = 0; y < chunks.length; y++) {
      for (let x = 0; x < chunks[y].length; x++) {
        chunks[y][x].build = [];
      }
    }

    // Populate ROM
    data.forEach(b => {
      const chunkIdx = window.contry.getChunkIndex(b.x, b.y);
      if (chunkIdx) {
        const build = new Build(b.x, b.y, b.w, b.h, b.angle, b.color, b.zone, chunkIdx);

        // Restore house properties if saved
        if (b.house) {
          build.house.width = b.house.width;
          build.house.height = b.house.height;
          build.house.offsetX = b.house.offsetX;
          build.house.offsetY = b.house.offsetY;
          build.house.roofStyle = b.house.roofStyle;
          build.house.wallColor = b.house.wallColor;
          build.house.roofColor = b.house.roofColor;
          build.house.buildingHeight = b.house.buildingHeight;
        }

        window.contry.chunks[chunkIdx.x][chunkIdx.y].build.push(build);
      }
    });

    // Populate RAM
    this.loadFromChunks();
  }
}
