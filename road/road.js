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

  syncToChunks() {
    console.log("Road: Syncing to Chunks. RAM Size:", Object.keys(this.roadBase).length);
    // 1. Reset active chunks ROM
    window.contry.loadChunk.forEach((chunk) => {
      chunk.roadBase = {};
      chunk.segments = {};
      chunk.areaZone = [];
    });

    // 2. Dump RAM to ROM (RoadBase)
    for (const key in this.roadBase) {
      if (key === "index") continue;
      const node = this.roadBase[key];
      if (node.chunk) {
        if (
          window.contry.chunks[node.chunk.x] &&
          window.contry.chunks[node.chunk.x][node.chunk.y]
        ) {
          window.contry.chunks[node.chunk.x][node.chunk.y].roadBase[key] = node;
        }
      }
    }

    // 3. Dump RAM to ROM (Segments)
    for (const key in this.segments) {
      if (key === "index") continue;
      const seg = this.segments[key];
      if (seg.chunk) {
        if (
          window.contry.chunks[seg.chunk.x] &&
          window.contry.chunks[seg.chunk.x][seg.chunk.y]
        ) {
          window.contry.chunks[seg.chunk.x][seg.chunk.y].segments[key] = seg;
        }
      }
    }

    // 4. Dump RAM to ROM (AreaZone)
    this.areaZone.forEach((zone) => {
      if (zone.chunk) {
        if (
          window.contry.chunks[zone.chunk.x] &&
          window.contry.chunks[zone.chunk.x][zone.chunk.y]
        ) {
          window.contry.chunks[zone.chunk.x][zone.chunk.y].areaZone.push(zone);
        }
      }
    });
  }

  loadFromChunks() {
    // 1. Clear RAM (preserve indices)
    const currentRoadBaseIndex = this.roadBase.index;
    this.roadBase = {
      index: currentRoadBaseIndex,
      0: new Circle(0, 0, "skyblue", 50, true),
    };
    const currentSegmentsIndex = this.segments.index;
    this.segments = {
      index: currentSegmentsIndex,
    };
    this.areaZone = [];

    // 2. Load from NEW active chunks
    window.contry.loadChunk.forEach((chunk) => {
      // Merge roadBase
      for (const key in chunk.roadBase) {
        this.roadBase[key] = chunk.roadBase[key];
      }
      // Merge segments
      for (const key in chunk.segments) {
        this.segments[key] = chunk.segments[key];
      }
      // Merge areaZone
      this.areaZone.push(...chunk.areaZone);
    });
  }

  addNode(x, y, color = "grey", w = 50) {
    const id = this.roadBase.index++;
    const chunkIdx = window.contry.getChunkIndex(x, y);
    const node = new Circle(
      x,
      y,
      color,
      w,
      null,
      chunkIdx
    );

    // Check if chunk is active
    let isActive = false;
    if (chunkIdx) {
      const chunk = window.contry.chunks[chunkIdx.x][chunkIdx.y];
      if (window.contry.loadChunk.includes(chunk)) {
        isActive = true;
      } else {
        // Inactive: Add directly to ROM
        chunk.roadBase[id] = node;
      }
    }

    // Always add to RAM if active (or if chunkIdx failed, fallback to RAM)
    if (isActive || !chunkIdx) {
      this.roadBase[id] = node;
    }

    return id;
  }

  addSegToNode(key, i) {
    this.roadBase[key].segment.push(i);
  }

  addSegment(key, color = "grey", w = 50, endKey) {
    const id = ++this.segments.index;

    // Use the position of the START node to determine the chunk
    let chunkIdx = null;
    const startNode = this.roadBase[key];
    if (startNode) {
      chunkIdx = window.contry.getChunkIndex(startNode.x, startNode.y);
    } else {
      // Fallback: use mouse if node not found (should be rare)
      chunkIdx = window.contry.getChunkIndex(camera.mouse.move.x, camera.mouse.move.y);
    }

    const segment = new Segment(
      key,
      color,
      w,
      endKey,
      chunkIdx
    );

    let isActive = false;
    if (chunkIdx) {
      const chunk = window.contry.chunks[chunkIdx.x][chunkIdx.y];
      if (window.contry.loadChunk.includes(chunk)) {
        isActive = true;
      } else {
        chunk.segments[id] = segment;
      }
    }

    if (isActive || !chunkIdx) {
      this.segments[id] = segment;
    }

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

      // Check if the road nodes actually exist in roadBase
      const startNode = this.roadBase[seg.start];
      const endNode = this.roadBase[seg.end];
      if (!startNode || !endNode) continue;

      const C = createVector(
        startNode.x,
        startNode.y
      );
      const D = createVector(
        endNode.x,
        endNode.y
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

  createZone(w = 30, index) {
    let areaLength = this.areaZone.length;
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
      perpLeft.setMag(45);
      let finalPosLeft = Vector.add(D, perpLeft);
      const chunkIdxL = window.contry.getChunkIndex(finalPosLeft.x, finalPosLeft.y);
      const zone = new AreaZone(
        finalPosLeft.x,
        finalPosLeft.y,
        w,
        w,
        C.angle(),
        index ? index : this.segments.index,
        D,
        chunkIdxL
      );

      let isActiveL = false;
      if (chunkIdxL) {
        const chunk = window.contry.chunks[chunkIdxL.x][chunkIdxL.y];
        if (window.contry.loadChunk.includes(chunk)) {
          isActiveL = true;
        } else {
          chunk.areaZone.push(zone);
        }
      }

      if (isActiveL || !chunkIdxL) {
        this.areaZone.push(zone);
      }

      let perpRight = createVector(C.y, -C.x);
      perpRight.setMag(45);
      let finalPosRight = Vector.add(D, perpRight);
      const chunkIdxR = window.contry.getChunkIndex(finalPosRight.x, finalPosRight.y);
      const zoneR = new AreaZone(
        finalPosRight.x,
        finalPosRight.y,
        w,
        w,
        C.angle(),
        index ? index : this.segments.index,
        D,
        chunkIdxR
      );

      let isActiveR = false;
      if (chunkIdxR) {
        const chunk = window.contry.chunks[chunkIdxR.x][chunkIdxR.y];
        if (window.contry.loadChunk.includes(chunk)) {
          isActiveR = true;
        } else {
          chunk.areaZone.push(zoneR);
        }
      }

      if (isActiveR || !chunkIdxR) {
        this.areaZone.push(zoneR);
      }

      mag += 31;
    }
    this.zoneDeletor(areaLength);
  }

  zoneDeletor(l) {
    for (let i = this.areaZone.length - 1; i >= l; i--) {
      for (let j = i - 1; j >= 0; j--) {
        const A = this.areaZone[i];
        const B = this.areaZone[j];
        const dx = A.position.x - B.position.x;
        const dy = A.position.y - B.position.y;
        const r = A.radius + B.radius;
        if (
          distance(A.position.x, A.position.y, B.position.x, B.position.y) < 30
        ) {
          this.areaZone.splice(i, 1);
          break;
        }
      }
    }

    for (let i = this.areaZone.length - 1; i >= 0; i--) {
      const circle = this.areaZone[i];
      const P = circle.position;
      const r = 40;

      let collided = false;

      for (const j in this.segments) {
        if (j === "index") continue;

        const seg = this.segments[j];
        const A = seg.startingPosition;
        const B = seg.endingPosition;

        if (distance(circle.position.x, circle.position.y, A.x, A.y) > 300)
          continue;

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
    for (let i = window.building.build.length - 1; i >= 0; i--) {
      const b = window.building.build[i];

      if (distance(x1, y1, b.position.x, b.position.y) > 300) continue;

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
        window.building.build.splice(i, 1);
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
    // Ensure RAM is synced to ROM before saving
    this.syncToChunks();

    const roadBaseData = {};
    const segmentsData = [];
    const areaZoneData = [];

    // Iterate over All Chunks (ROM)
    const chunks = window.contry.chunks;
    for (let y = 0; y < chunks.length; y++) {
      for (let x = 0; x < chunks[y].length; x++) {
        const chunk = chunks[y][x];

        // Collect roadBase
        for (const key in chunk.roadBase) {
          if (key === "index" || key === "0") continue;
          const b = chunk.roadBase[key];
          // Use key as ID. IDs are unique globally.
          roadBaseData[key] = {
            x: b.position.x,
            y: b.position.y,
            color: b.color,
            radius: b.radius,
            isBase: b.isBase || false,
          };
        }

        // Collect segments
        for (const key in chunk.segments) {
          if (key === "index") continue;
          const s = chunk.segments[key];
          segmentsData.push({
            id: key,
            startNode: s.start, // Note: segment.js uses 'start'/'end' which are IDs
            endNode: s.end,
            color: s.color,
            width: s.width,
          });
        }

        // Collect areaZone
        chunk.areaZone.forEach((z) => {
          areaZoneData.push({
            position: { x: z.position.x, y: z.position.y },
            width: z.width,
            height: z.height,
            angle: z.angle,
            color: z.color,
          });
        });
      }
    }

    const data = {
      segments: segmentsData,
      areaZone: areaZoneData,
      roadBase: roadBaseData,
      roadBaseIndex: this.roadBase.index,
      segmentsIndex: this.segments.index
    };

    localStorage.setItem("ROAD_DATA", JSON.stringify(data));
  }

  loadFromLocalStorage() {
    const raw = localStorage.getItem("ROAD_DATA");
    if (!raw) return;

    const data = JSON.parse(raw);

    // 1. Clear ALL Chunks contents (ROM)
    const chunks = window.contry.chunks;
    for (let y = 0; y < chunks.length; y++) {
      for (let x = 0; x < chunks[y].length; x++) {
        chunks[y][x].roadBase = {};
        chunks[y][x].segments = {};
        chunks[y][x].areaZone = [];
      }
    }

    // 2. Clear RAM (Indices will be restored from data)
    this.roadBase = { index: data.roadBaseIndex || 1, 0: new Circle(0, 0, "skyblue", 50, true) };
    this.segments = { index: data.segmentsIndex || 0 };
    this.areaZone = [];


    /* ===== restore nodes to ROM ===== */
    for (const key in data.roadBase) {
      const b = data.roadBase[key];
      const chunkIdx = window.contry.getChunkIndex(b.x, b.y);
      if (chunkIdx) {
        // We need to pass chunk to constructor so it has .chunk property
        const node = new Circle(b.x, b.y, b.color, b.radius, b.isBase, chunkIdx);
        window.contry.chunks[chunkIdx.x][chunkIdx.y].roadBase[key] = node;
      }
    }

    /* ===== restore segments to ROM ===== */
    const nodePositions = {};
    for (const key in data.roadBase) {
      nodePositions[key] = data.roadBase[key];
    }

    for (const s of data.segments) {
      const startNodeData = nodePositions[s.startNode];
      if (!startNodeData) continue;

      const chunkIdx = window.contry.getChunkIndex(startNodeData.x, startNodeData.y);
      if (chunkIdx) {
        const seg = new Segment(s.startNode, s.color, s.width, s.endNode, chunkIdx);
        window.contry.chunks[chunkIdx.x][chunkIdx.y].segments[s.id] = seg;
      }
    }

    /* ===== restore zones to ROM ===== */
    for (const z of data.areaZone) {
      const chunkIdx = window.contry.getChunkIndex(z.position.x, z.position.y);
      if (chunkIdx) {
        const zone = new AreaZone(
          z.position.x,
          z.position.y,
          z.width,
          z.height,
          z.angle,
          null, // segmentIndex not critical for rendering, maybe critical for deletion?
          null, // point
          chunkIdx
        );
        zone.color = z.color;
        window.contry.chunks[chunkIdx.x][chunkIdx.y].areaZone.push(zone);
      }
    }

    // 3. Load ROM to RAM (Active Chunks)
    this.loadFromChunks();
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
      if (Tab != "Move") {
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
