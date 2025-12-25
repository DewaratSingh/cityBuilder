class Chunck {
  constructor(x, y, px, py) {
    this.position = createVector(x, y);
    this.chunckID = { x: px, y: py };
    this.width = 512;
    this.height = 512;
    this.color = "rgba(255, 1, 1, 0.15)";
  }

  draw(ctx) {
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.beginPath();
    ctx.rect(0, 0, this.width, this.height);

    ctx.fillStyle = "green";
    ctx.fill();
    ctx.fillStyle = "rgba(255, 255, 255, 0.82)";
    ctx.font = "12px monospace";
    ctx.fillText(`${this.chunckID.x},${this.chunckID.y}`, 6, 14);
    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.69)";

    ctx.stroke();
    ctx.restore();
  }
}
