class Country {
  constructor(w, h) {
    this.width = w;
    this.height = h;
    this.chunks = [];

    for (let y = 0; y < h; y++) {
      this.chunks[y] = [];
      for (let x = 0; x < w; x++) {
        const worldX = (x - w / 2) * 512;
        const worldY = (y - h / 2) * 512;
        this.chunks[y][x] = new Chunck(worldX, worldY, y, x);
      }
    }
  }

  getChunkIndex(x, y) {
    const chunkSize = 512;

    const chunkX = Math.floor(x / chunkSize + this.width / 2);
    const chunkY = Math.floor(y / chunkSize + this.height / 2);

    if (
      chunkX < 0 ||
      chunkX >= this.width ||
      chunkY < 0 ||
      chunkY >= this.height
    ) {
      return null;
    }
    return { x: chunkY, y: chunkX };
  }

  draw(ctx) {
    const camera = window.camera;
    const zoom = camera.mouse.zoom;
    const chunkSize = 512;

    const viewW = ctx.canvas.width * zoom;
    const viewH = ctx.canvas.height * zoom;

    const cam = camera.getMousePosition({
      clientX: ctx.canvas.width / 2,
      clientY: ctx.canvas.height / 2,
    });

    const camX = cam.x;
    const camY = cam.y;

    const left = camX - viewW / 2;
    const right = camX + viewW / 2;
    const top = camY - viewH / 2;
    const bottom = camY + viewH / 2;

    const startX = Math.max(0, Math.floor(left / chunkSize + this.width / 2));

    const endX = Math.min(
      this.width - 1,
      Math.floor(right / chunkSize + this.width / 2)
    );

    const startY = Math.max(0, Math.floor(top / chunkSize + this.height / 2));

    const endY = Math.min(
      this.height - 1,
      Math.floor(bottom / chunkSize + this.height / 2)
    );

    for (let y = startY; y <= endY; y++) {
      for (let x = startX; x <= endX; x++) {
        this.chunks[y][x].draw(ctx);
      }
    }
  }
}
