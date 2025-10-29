class AreaZone {
  constructor(x, y, w, h, a, color = "grey") {
    this.position = createVector(x, y);
    this.roadPoint = null;
    this.segmentIndex = null;
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