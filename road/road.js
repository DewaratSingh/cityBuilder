class Road {
  constructor() {
    this.areaZone = [];
    this.roadBase = {
      index: 1,
      0: new Circle(0, 0, "skyblue", 50, true),
    };
    this.segments = {
      index: 0,
    };
    this.changeable = false;
    this.editMode = false;
  }

  addNode(x, y, color = "grey", w = 50) {
    const id = this.roadBase.index++;
    this.roadBase[id] = new Circle(x, y, color, w);
    return id;
  }

  addSegToNode(key, i) {
    this.roadBase[key].segment.push(i);
  }

  addSegment(key, color = "grey", w = 50, endKey) {
    const id = ++this.segments.index;
    this.segments[id] = new Segment(key, color, w, endKey);
    return id;
  }

  isalreadyRoad(x, y) {
    for (const key in this.roadBase) {
      if (key === "index" || key == "0") continue;

      const node = this.roadBase[key];
      const d = distance(x, y, node.x, node.y);

      if (d < node.width) {
        return key;
      }
    }
    return null;
  }
  createStartSegment({ x, y }, w = 50, color = "grey") {
    let key = this.isalreadyRoad(x, y);

    if (key) {
      this.addSegment(key);
    } else {
      key = this.addNode(x, y, color, w);
      this.addSegment(key, color, w);
    }
    this.addSegToNode(key, this.segments.index);
    this.changeable = true;
  }

  createEndSegmentMove({ x, y }) {
    if (this.changeable && this.segments.index > 0) {
      this.segments[this.segments.index].end = "0";
    }
  }

  createEndSegment({ x, y }) {
    const d = distance(
      x,
      y,
      this.roadBase[this.segments[this.segments.index].start].x,
      this.roadBase[this.segments[this.segments.index].start].y
    );
    if (d < 1) {
      delete this.roadBase[this.segments[this.segments.index].start];
      delete this.segments[this.segments.index];
      return;
    }

    if (d > 300) {
      let A = createVector(
        this.roadBase[this.segments[this.segments.index].start].x,
        this.roadBase[this.segments[this.segments.index].start].y
      );

      let B = createVector(x, y);
      let C = Vector.sub(B, A);
      C.setMag(250);
      let D = Vector.add(A, C);
      let hitPoint = this.checkforOtherRoad(D.x, D.y, x, y);
      if (hitPoint) {
        return;
      }
      let key = this.addNode(D.x, D.y);
      this.segments[this.segments.index].end = key;

      this.addSegToNode(key, this.segments.index);

      this.createZone();
      this.createStartSegment(D);
      this.createEndSegment({ x, y });
    } else {
      let key = this.isalreadyRoad(x, y);
      if (key) {
        let hitPoint = this.checkforOtherRoad(x, y, x, y);
        if (hitPoint) {
          return;
        }
        this.segments[this.segments.index].end = key;
      } else {
        let hitPoint = this.checkforOtherRoad(x, y, x, y);
        if (hitPoint) {
          return;
        }
        key = this.addNode(x, y);
        this.segments[this.segments.index].end = key;
      }
      this.addSegToNode(key, this.segments.index);
      this.createZone();
    }
    this.changeable = false;
  }

  checkforOtherRoad(Dx, Dy, x = false, y = false) {
    const currSeg = this.segments[this.segments.index];
    const A = createVector(
      this.roadBase[this.segments[this.segments.index].start].x,
      this.roadBase[this.segments[this.segments.index].start].y
    );
    const B = createVector(Dx, Dy);

    const lineIntersection = (p1, p2, p3, p4) => {
      const s1x = p2.x - p1.x;
      const s1y = p2.y - p1.y;
      const s2x = p4.x - p3.x;
      const s2y = p4.y - p3.y;

      const denom = -s2x * s1y + s1x * s2y;
      if (Math.abs(denom) < 0.00001) return null;

      const s = (-s1y * (p1.x - p3.x) + s1x * (p1.y - p3.y)) / denom;
      const t = (s2x * (p1.y - p3.y) - s2y * (p1.x - p3.x)) / denom;

      const EPS = 0.01;

      if (s > EPS && s < 1 - EPS && t > EPS && t < 1 - EPS) {
        return createVector(p1.x + t * s1x, p1.y + t * s1y);
      }

      return null;
    };

    for (const i in this.segments) {
      if (i === "index") continue;
      const seg = this.segments[i];

      if (!seg.start || !seg.end) continue;

      const C = createVector(
        this.roadBase[seg.start].x,
        this.roadBase[seg.start].y
      );
      const D = createVector(
        this.roadBase[seg.end].x,
        this.roadBase[seg.end].y
      );

      const hitPoint = lineIntersection(A, B, C, D);

      if (hitPoint) {
        console.log("Intersection detected");

        let key = this.addNode(hitPoint.x, hitPoint.y);

        let segment = this.addSegment(key, seg.color, seg.width, seg.end);

        this.addSegToNode(key, Number(i));

        const segId = Number(i);
        this.roadBase[seg.end].segment = this.roadBase[seg.end].segment.filter(
          (sid) => sid !== segId
        );

        this.addSegToNode(key, segment);

        this.addSegToNode(seg.end, segment);

        this.segments[this.segments.index - 1].end = key;

        this.addSegToNode(key, this.segments.index - 1);

        this.createZone(50, this.segments.index - 1);
        this.createZone();

        seg.end = key;

        if (x !== false && y !== false) {
          const d = distance(hitPoint.x, hitPoint.y, x, y);
          if (d > 5) {
            this.createStartSegment(hitPoint.copy());
            this.createEndSegment({ x, y });
          }
        }
        return hitPoint;
      }
    }

    return null;
  }

  createZone(w = 50, index) {
    let areaLength=this.areaZone.length
    let length = this.segments.length - 1;
    let A = createVector(
      this.roadBase[this.segments[index ? index : this.segments.index].start].x,
      this.roadBase[this.segments[index ? index : this.segments.index].start].y
    );
    let B = createVector(
      this.roadBase[this.segments[index ? index : this.segments.index].end].x,
      this.roadBase[this.segments[index ? index : this.segments.index].end].y
    );

    let C = Vector.sub(B, A);
    let Cmag = C.mag();
    C.normalize();

    let mag = 0;
    while (mag <= Cmag) {
      let step = C.copy().mult(mag);
      let D = Vector.add(A, step);
      let perpLeft = createVector(-C.y, C.x);
      perpLeft.setMag(55);
      let finalPosLeft = Vector.add(D, perpLeft);
      this.areaZone.push(
        new AreaZone(
          finalPosLeft.x,
          finalPosLeft.y,
          w,
          w,
          C.angle(),
          index ? index : this.segments.index,
          D
        )
      );

      let perpRight = createVector(C.y, -C.x);
      perpRight.setMag(55);
      let finalPosRight = Vector.add(D, perpRight);
      this.areaZone.push(
        new AreaZone(
          finalPosRight.x,
          finalPosRight.y,
          w,
          w,
          C.angle(),
          index ? index : this.segments.index,
          D
        )
      );

      mag += 5;
      this.zoneDeletor(areaLength);
    }
   // this.zoneDeletor();
  }

  zoneDeletor(l) {
    for (let i = this.areaZone.length - 1; i >= l; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const A = this.areaZone[i];
        const B = this.areaZone[j];
        const dx = A.position.x - B.position.x;
        const dy = A.position.y - B.position.y;
        const r = A.radius + B.radius;
        if (dx * dx + dy * dy > r * r) continue;

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

        const cornersA = getCorners(A);
        const cornersB = getCorners(B);
        const axes = [];

        const addAxes = (corners) => {
          for (let k = 0; k < 4; k++) {
            const p1 = corners[k];
            const p2 = corners[(k + 1) % 4];
            const edgeX = p2.x - p1.x;
            const edgeY = p2.y - p1.y;

            let nx = -edgeY;
            let ny = edgeX;
            const len = Math.hypot(nx, ny);
            nx /= len;
            ny /= len;

            axes.push({ x: nx, y: ny });
          }
        };
        addAxes(cornersA);
        addAxes(cornersB);
        let collision = true;

        for (let axis of axes) {
          let minA = Infinity,
            maxA = -Infinity;
          let minB = Infinity,
            maxB = -Infinity;

          for (let p of cornersA) {
            const proj = p.x * axis.x + p.y * axis.y;
            minA = Math.min(minA, proj);
            maxA = Math.max(maxA, proj);
          }

          for (let p of cornersB) {
            const proj = p.x * axis.x + p.y * axis.y;
            minB = Math.min(minB, proj);
            maxB = Math.max(maxB, proj);
          }

          if (maxA < minB || maxB < minA) {
            collision = false;
            break;
          }
        }

        if (collision) {
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

      for (const j in this.segments) {
        if (j === "index") continue;
        

        const seg = this.segments[j];
        const A = seg.startingPosition;
        const B = seg.endingPosition;

        if (distance(circle.position.x,circle.position.y,A.x,A.y)>300) continue;

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

    let road = this.roadBase[this.segments[this.segments.index].start];
    let road2 = this.roadBase[this.segments[this.segments.index].end];
    this.removeBuildingsCollidingWithRoad(
      road.x,
      road.y,
      road2.x,
      road2.y,
      (road.width = 45)
    );
  }

  removeBuildingsCollidingWithRoad(x1, y1, x2, y2, lineWidth = 45) {
    for (let i = building.build.length - 1; i >= 0; i--) {
      const b = building.build[i];

      if (distance(x1,y1,b.position.x,b.position.y)>300) continue;

      const hit = this.lineRotatedRectCollision(
        x1,
        y1,
        x2,
        y2,
        b.position.x,
        b.position.y,
        b.width,
        b.height,
        b.angle,
        lineWidth
      );

      if (hit) {
        building.build.splice(i, 1);
      }
    }
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

    for (let i = 0; i < 4; i++) {
      const p1 = corners[i];
      const p2 = corners[(i + 1) % 4];

      if (intersect(x1, y1, x2, y2, p1.x, p1.y, p2.x, p2.y)) {
        return true;
      }
    }

    return false;
  }

  saveToLocalStorage() {
    const roadBaseData = {};

    for (const key in this.roadBase) {
      if (key === "index") continue;

      const b = this.roadBase[key];
      roadBaseData[key] = {
        x: b.position.x,
        y: b.position.y,
        color: b.color,
        radius: b.radius,
        isBase: b.isBase || false,
      };
    }

    const data = {
      segments: this.segments.map((s) => ({
        startNode: s.startNode,
        endNode: s.endNode,
        color: s.color,
        width: s.width,
        nextSegments: s.nextSegments,
        previousSegments: s.previousSegments,
      })),

      areaZone: this.areaZone.map((z) => ({
        position: { x: z.position.x, y: z.position.y },
        width: z.width,
        height: z.height,
        angle: z.angle,
        color: z.color,
      })),

      roadBase: roadBaseData,
      roadBaseIndex: this.roadBase.index,
    };

    localStorage.setItem("ROAD_DATA", JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const raw = localStorage.getItem("ROAD_DATA");
    if (!raw) return;

    const data = JSON.parse(raw);

    // clear existing
    this.segments = [];
    this.areaZone = [];
    this.roadBase = { index: data.roadBaseIndex || 0 };

    /* ===== restore nodes ===== */
    for (const key in data.roadBase) {
      const b = data.roadBase[key];
      this.roadBase[key] = new Circle(b.x, b.y, b.color, b.radius, b.isBase);
    }

    /* ===== restore segments ===== */
    for (const s of data.segments) {
      const seg = new Segment(s.startNode, s.color, s.width);
      seg.endNode = s.endNode;
      seg.nextSegments = s.nextSegments || [];
      seg.previousSegments = s.previousSegments || [];
      this.segments.push(seg);
    }

    /* ===== restore zones ===== */
    for (const z of data.areaZone) {
      const zone = new AreaZone(
        z.position.x,
        z.position.y,
        z.width,
        z.height,
        z.angle,
        z.color
      );
      this.areaZone.push(zone);
    }
  }

  deleteSegmentAt({ x, y }) {
    const clickRadius = 30;

    for (const id in this.segments) {
      if (id === "index") continue;

      const seg = this.segments[id];
      if (!seg) continue;

      const startNode = this.roadBase[seg.start];
      const endNode = this.roadBase[seg.end];
      if (!startNode || !endNode) continue;

      // ---- segment endpoints ----
      const A = createVector(startNode.x, startNode.y);
      const B = createVector(endNode.x, endNode.y);

      // ---- projection math ----
      const ABx = B.x - A.x;
      const ABy = B.y - A.y;
      const APx = x - A.x;
      const APy = y - A.y;

      const ab2 = ABx * ABx + ABy * ABy;
      if (ab2 === 0) continue; // safety

      let t = (APx * ABx + APy * ABy) / ab2;
      t = Math.max(0, Math.min(1, t));

      const Cx = A.x + ABx * t;
      const Cy = A.y + ABy * t;

      const dx = x - Cx;
      const dy = y - Cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // ---- hit test ----
      if (dist > seg.width / 2 + clickRadius) continue;

      // ================= DELETE LOGIC =================

      const segId = Number(id); // normalize

      // remove from start node
      startNode.segment = startNode.segment.filter((sid) => sid !== segId);
      if (startNode.segment.length === 0) {
        delete this.roadBase[seg.start];
      }

      // remove from end node
      endNode.segment = endNode.segment.filter((sid) => sid !== segId);
      if (endNode.segment.length === 0) {
        delete this.roadBase[seg.end];
      }

      // delete segment itself
      delete this.segments[segId];

      return; // stop after deleting one segment
    }
  }

  draw(ctx, { x, y }, zone) {
    if (this.editMode) {
      this.areaZone.forEach((zone) => zone.draw(ctx, zone));

      for (const id in this.segments) {
        if (id === "index") continue;
        this.segments[id].draw(ctx);
      }

      for (const id in this.roadBase) {
        if (id === "index" || id == "0") continue;
        this.roadBase[id].draw(ctx, "blue");
      }

      this.roadBase["0"].draw(ctx, null, x, y);
    } else {
      if(Tab != "Move"){
      this.areaZone.forEach((areazone) => areazone.draw(ctx, zone));
      }
      for (const id in this.segments) {
        if (id === "index") continue;
        this.segments[id].draw(ctx);
      }

      for (const id in this.roadBase) {
        if (id === "index" || id == "0") continue;
        this.roadBase[id].draw(ctx);
      }
    }
  }
}
