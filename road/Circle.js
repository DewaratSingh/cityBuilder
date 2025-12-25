class Circle {
  constructor(x = 0, y = 0, color = "grey", width = 50, mouse,chunk) {
    this.color = color;
    this.width = width;
    this.x = x;
    this.y = y;
    this.mouse = mouse;
    this.segment=[];
    this.chunk=chunk;
  }

  draw(ctx, color, x, y) {
    ctx.beginPath();

    if (x && y) {
      this.x = x;
      this.y = y;
    }

    ctx.fillStyle = this.mouse ? "skyblue" : color || this.color;
    ctx.arc(x || this.x, y || this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();
  }
}
