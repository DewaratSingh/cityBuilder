class Segment {
  constructor(i, color = "grey", width = 50, j = i) {
    this.color = color;
    this.width = width;
    this.start = i;
    this.end = j;
  }

  get startingPosition() {
    return road.roadBase[this.start];
  }

  get endingPosition() {
    return road.roadBase[this.end];
  }

  length() {
    const s = this.startingPosition;
    const e = this.endingPosition;

    return distance(s.x, s.y, e.x, e.y);
  }

  draw(ctx, arrow = true) {
    const s = this.startingPosition;
    const e = this.endingPosition;

    if (!s || !e) return;

    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();

    if (arrow && this.length() > 60) this.drawArrow(ctx);
  }

  drawArrow(ctx) {
    const s = this.startingPosition;
    const e = this.endingPosition;

    if (!s || !e) return;

    const x1 = s.x;
    const y1 = s.y;
    const x2 = e.x;
    const y2 = e.y;

    const angle = Math.atan2(y2 - y1, x2 - x1);
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;

    ctx.save();
    ctx.translate(mx, my);
    ctx.rotate(angle);

    ctx.beginPath();
    ctx.strokeStyle = "white";
    ctx.lineWidth = 3;
    ctx.moveTo(-10, 0);
    ctx.lineTo(10, 0);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(4, 6);
    ctx.lineTo(4, -6);
    ctx.closePath();
    ctx.fillStyle = "white";
    ctx.fill();

    ctx.restore();
  }
}
