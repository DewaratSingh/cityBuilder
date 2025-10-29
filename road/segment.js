class Segment {
  constructor({ x, y }, color = "grey", width = 50, ex = x, ey = y) {
    this.color = color;
    this.width = width;
    this.startingPosition = createVector(x, y);
    this.endingPosition = createVector(ex, ey);
    this.nextSegments = [];
    this.previousSegments = [];
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.strokeStyle = this.color;
    ctx.lineWidth = this.width;
    ctx.moveTo(this.startingPosition.x, this.startingPosition.y);
    ctx.lineTo(this.endingPosition.x, this.endingPosition.y);
    ctx.stroke();
    // if (this.width == 50) {
    //this.drawArrow(ctx);
    
    //  }
  }

  drawArrow(ctx) {
  const dx = this.endingPosition.x - this.startingPosition.x;
  const dy = this.endingPosition.y - this.startingPosition.y;
  const angle = Math.atan2(dy, dx);
  const length = Math.sqrt(dx * dx + dy * dy);

  ctx.save();
  ctx.translate(this.startingPosition.x, this.startingPosition.y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.strokeStyle = "white";
  ctx.lineWidth = 5;
  ctx.moveTo(length - 30, 0);
  ctx.lineTo(length - 5, 0);
  ctx.stroke();
  const headSize = 15;
  ctx.beginPath();
  ctx.moveTo(length, 0);
  ctx.lineTo(length - headSize, headSize / 2);
  ctx.lineTo(length - headSize, -headSize / 2);
  ctx.closePath();
  ctx.fillStyle = "white";
  ctx.fill();
  ctx.restore();
}

}
