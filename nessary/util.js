function distance(x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}
function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function randomColor() {
  return (
    "#" +
    Math.floor(Math.random() * 16777215)
      .toString(16)
      .padStart(6, "0")
  );
}

function rectRectCollision(A, B) {
  const axes = [
    { x: Math.cos(A.angle), y: Math.sin(A.angle) },
    { x: -Math.sin(A.angle), y: Math.cos(A.angle) },
    { x: Math.cos(B.angle), y: Math.sin(B.angle) },
    { x: -Math.sin(B.angle), y: Math.cos(B.angle) },
  ];

  const hwA = A.width / 2;
  const hhA = A.height / 2;
  const hwB = B.width / 2;
  const hhB = B.height / 2;

  const ax = A.position ? A.position.x : A.x;
  const ay = A.position ? A.position.y : A.y;

  const bx = B.position ? B.position.x : B.x;
  const by = B.position ? B.position.y : B.y;

  const dx = bx - ax;
  const dy = by - ay;

  for (let axis of axes) {
    const dist = Math.abs(dx * axis.x + dy * axis.y);

    const projA =
      hwA * Math.abs(axis.x * Math.cos(A.angle) + axis.y * Math.sin(A.angle)) +
      hhA * Math.abs(axis.x * -Math.sin(A.angle) + axis.y * Math.cos(A.angle));

    const projB =
      hwB * Math.abs(axis.x * Math.cos(B.angle) + axis.y * Math.sin(B.angle)) +
      hhB * Math.abs(axis.x * -Math.sin(B.angle) + axis.y * Math.cos(B.angle));

    if (dist > projA + projB) {
      return false;
    }
  }

  return true;
}

// ==========================
// 3D PERSPECTIVE UTILITIES
// ==========================

// Calculate midpoint between two points
function average(p1, p2) {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2
  };
}

// Get fake 3D point offset from viewpoint
function getFake3dPoint(point, viewPoint, height) {
  const dx = point.x - viewPoint.x;
  const dy = point.y - viewPoint.y;
  const dist = Math.hypot(dx, dy) + 0.0001; // Avoid division by zero

  // Clamp minimum distance to prevent extreme distortion near center
  const minDist = 200; // Minimum distance threshold
  const effectiveDist = Math.max(dist, minDist);

  const scale = height / effectiveDist;

  return {
    x: point.x + dx * scale,
    y: point.y + dy * scale
  };
}

// Polygon class for rendering building faces
class Polygon {
  constructor(points) {
    this.points = points;
  }

  draw(ctx, style = {}) {
    ctx.beginPath();
    ctx.moveTo(this.points[0].x, this.points[0].y);
    for (let i = 1; i < this.points.length; i++) {
      ctx.lineTo(this.points[i].x, this.points[i].y);
    }
    ctx.closePath();

    if (style.fill) {
      ctx.fillStyle = style.fill;
      ctx.fill();
    }

    if (style.stroke) {
      ctx.strokeStyle = style.stroke;
      ctx.lineWidth = style.lineWidth || 1;
      ctx.lineJoin = style.join || "miter";
      ctx.stroke();
    }
  }

  distanceToPoint(p) {
    let cx = 0, cy = 0;
    for (const pt of this.points) {
      cx += pt.x;
      cy += pt.y;
    }
    cx /= this.points.length;
    cy /= this.points.length;
    return Math.hypot(cx - p.x, cy - p.y);
  }
}


