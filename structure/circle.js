class Circle {
    constructor(x = 0, y = 0, color = "grey", radius = 10) {
        this.color = color;
        this.radius = radius;
        this.x = x;
        this.y = y;
        this.SegmentId = []
    }

    draw(ctx, color, x, y) {
        ctx.beginPath();
        ctx.fillStyle = color || this.color;
        ctx.arc(x || this.x, y || this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}
