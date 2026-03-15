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

        this.#addEventListeners();
    }

    #addEventListeners() {
        document.addEventListener("mousedown", (e) => {
            if (window.activeTool !== "MOVE") return;

            this.mouse.down = this.getMousePosition(e);
            this.mouse.drag = true;
            this.mouse.down.is = true;
        });

        document.addEventListener("mousemove", (e) => {
            this.mouse.move = this.getMousePosition(e);
            if (this.mouse.drag) {
                this.mouse.offset = {
                    x: this.mouse.move.x - this.mouse.down.x,
                    y: this.mouse.move.y - this.mouse.down.y,
                };
            }
        });

        document.addEventListener("mouseup", (e) => {
            this.mouse.down.is = false;
            if (this.mouse.drag) {
                this.Offset = {
                    x: this.Offset.x + this.mouse.offset.x,
                    y: this.Offset.y + this.mouse.offset.y,
                };
                let zoom = this.mouse.zoom;
                this.mouse = {
                    down: { x: 0, y: 0, is: false },
                    move: { x: 0, y: 0 },
                    up: { x: 0, y: 0 },
                    zoom: zoom,
                    drag: false,
                    offset: { x: 0, y: 0 },
                };
            }
        });

        document.addEventListener("wheel", (e) => {
            this.zoom(e);
        }, { passive: true });
    }

    getMousePosition(e) {
        return {
            x: (e.clientX - this.center.x) * this.mouse.zoom - this.Offset.x,
            y: (e.clientY - this.center.y) * this.mouse.zoom - this.Offset.y,
        };
    }

    zoom(e) {
        let dir = Math.sign(e.deltaY);
        this.mouse.zoom += dir * 0.1;
        this.mouse.zoom = Math.max(0.1, Math.min(7, this.mouse.zoom));
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
