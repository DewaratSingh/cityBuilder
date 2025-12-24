class AreaZone {
  constructor(x, y, w, h, a,index,point) {
    this.position = createVector(x, y);
    this.roadPoint = point;
    this.segmentIndex = index;
    this.height = h;
    this.width = w;
    this.radius = Math.sqrt(h * h + w * w);
    this.angle = a;
    this.color = "#45454572";
    this.sold=false;
  }

  static drawZone(zone) {
    if (zone.down) {
      ctx.beginPath();
      ctx.fillStyle = object[Tab][object.select].color;
      ctx.fillRect(
        zone.start.x,
        zone.start.y,
        zone.move.x - zone.start.x,
        zone.move.y - zone.start.y
      );
    }
  }

  draw(ctx, zone) {
    if (Tab === "Zone") {
      const minX = Math.min(zone.start.x, zone.move.x);
      const maxX = Math.max(zone.start.x, zone.move.x);
      const minY = Math.min(zone.start.y, zone.move.y);
      const maxY = Math.max(zone.start.y, zone.move.y);

      if (
        this.position.x >= minX &&
        this.position.x <= maxX &&
        this.position.y >= minY &&
        this.position.y <= maxY
      ) {
        this.color = object[Tab][object.select].color;
      }
    }
    // ctx.arc(this.position.x,this.position.y,this.radius,0,2*Math.PI)
    // ctx.fill()
    ctx.save();
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.angle);
    ctx.beginPath();
    //ctx.strokeStyle = "red";
    //ctx.lineWidth = 4;
    //ctx.rect(-this.width / 2, -this.height / 2, this.width, this.height);
    ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);

    //  ctx.stroke();
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.restore();
  }
}
