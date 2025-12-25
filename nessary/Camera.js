class Camera {
  constructor(canvas) {
    this.canvas = canvas;
    this.center = { x: canvas.width / 2, y: canvas.height / 2 };
    this.Offset = { x: this.center.x * -1, y: this.center.y * -1 };
    this.mouse = {
      down: { x: 0, y: 0, is: false },
      move: { x: 0, y: 0 },
      up: { x: 0, y: 0 },
      zoom: 1,
      drag: false,
      offset: { x: 0, y: 0 },
    };
  }



  getMousePosition(e) {
    return {
      x: (e.clientX - this.center.x) * this.mouse.zoom - this.Offset.x,
      y: (e.clientY - this.center.y) * this.mouse.zoom - this.Offset.y,
    };
  }
  setZoom() {
    if (this.mouse.zoom > 7 && Tab != "Move") {
      this.mouse.zoom += -0.1;
      this.mouse.zoom = Math.max(1, Math.min(5, this.mouse.zoom));
    }
  }
  zoom(e) {
    let dir = Math.sign(e.deltaY);
    this.mouse.zoom += dir * 0.1;
    if (Tab == "Move") {
      this.mouse.zoom = Math.max(1, Math.min(7, this.mouse.zoom));
    } else {
      this.mouse.zoom = Math.max(1, Math.min(2, this.mouse.zoom));
    }
  }

  restore(ctx) {
    ctx.restore();
    let offset = {
      x: this.Offset.x + this.mouse.offset.x,
      y: this.Offset.y + this.mouse.offset.y,
    };
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.save();
    ctx.translate(this.center.x, this.center.y);
    ctx.scale(1 / this.mouse.zoom, 1 / this.mouse.zoom);
    ctx.translate(offset.x, offset.y);
  }
}
