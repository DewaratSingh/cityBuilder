class rectObj {
  constructor(x, y, h = 100, w = 100, color = "rgb(247, 211, 148)") {
    this.position = { x, y };
    this.height = h;
    this.width = w;
    this.color = color;
  }

  draw(ctx, camera) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.fillStyle = this.color;
    ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.fill();
    ctx.restore();
  }
}

class onlyPutableObj {
  constructor() {
    this.index0 = [];
    this.index1 = [];
    this.index3 = [];
  }
  draw(ctx, camera,edit,{x,y}) {
    this.index0.forEach((i)=> i.draw(ctx,camera))
  }
}
