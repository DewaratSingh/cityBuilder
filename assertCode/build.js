class Build {
  constructor(x = 0, y = 0, w = 0, h = 0, a = 0, color = "#cd2d2dbd", zone, chunk, buildingHeight = 50) {
    this.position = createVector(x, y);
    this.segmentIndexAndPoint = zone;
    this.height = h;
    this.width = w;
    this.angle = a;
    this.color = color;
    this.chunk = chunk;

    this.house = new House(w, h, buildingHeight);
  }

  draw(ctx, viewPoint) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.fillStyle = 'green';
    ctx.strokeStyle = "grey";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
    this.house.draw(ctx, this.position, this.angle, viewPoint);
  }
}
