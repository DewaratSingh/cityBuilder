class Circle {
  constructor(x, y, color = "grey", width = 50) {
    this.color = color;
    this.width = width;
    this.position = { x, y };
  }

  draw(ctx, color) {
    ctx.beginPath();
    ctx.fillStyle = color || this.color;
    ctx.arc(
      this.position.x,
      this.position.y,
      this.width / 2,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}