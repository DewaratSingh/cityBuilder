class Build {
  constructor(x = 0, y = 0, w = 0, h = 0, a = 0, color = "#cd2d2dbd") {
    this.position = createVector(x, y);
    this.zone = null;
    this.height = h;
    this.width = w;
    this.angle = a;
    this.color = color;
  }

  draw(ctx) {
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
