class House {
    constructor(lotWidth, lotHeight, buildingHeight = 50) {
        // Random size between 50-100% of lot dimensions
        const sizePercent = 0.5 + Math.random() * 0.5; // 50-100%
        this.width = lotWidth * sizePercent;
        this.height = lotHeight * sizePercent;

        // Random offset within the lot to position the smaller house
        const maxOffsetX = (lotWidth - this.width) / 2;
        const maxOffsetY = (lotHeight - this.height) / 2;
        this.offsetX = (Math.random() - 0.5) * maxOffsetX;
        this.offsetY = (Math.random() - 0.5) * maxOffsetY;

        this.buildingHeight = buildingHeight;

        // Random roof style - all buildings have roofs
        this.roofStyle = Math.random() > 0.5 ? 'peaked' : 'flat';

        // Random colors for variety - light walls, dark roofs
        const wallColors = ['#fafafa', '#f5f5dc', '#ffe4c4', '#faf0e6', '#fff8dc', '#f0f8ff'];
        const roofColors = ['#8B4513', '#654321', '#5c4033', '#4a3728', '#8B7355', '#a0522d'];
        this.wallColor = wallColors[Math.floor(Math.random() * wallColors.length)];
        this.roofColor = roofColors[Math.floor(Math.random() * roofColors.length)];
    }

    draw(ctx, lotPosition, lotAngle, viewPoint) {
        // Calculate house position relative to lot center
        const cos = Math.cos(lotAngle);
        const sin = Math.sin(lotAngle);
        const houseX = lotPosition.x + (this.offsetX * cos - this.offsetY * sin);
        const houseY = lotPosition.y + (this.offsetX * sin + this.offsetY * cos);

        const hw = this.width / 2;
        const hh = this.height / 2;

        // Calculate base rectangle corners
        const basePoints = [
            {
                x: houseX + (-hw * cos + hh * sin),
                y: houseY + (-hw * sin - hh * cos)
            },
            {
                x: houseX + (hw * cos + hh * sin),
                y: houseY + (hw * sin - hh * cos)
            },
            {
                x: houseX + (hw * cos - hh * sin),
                y: houseY + (hw * sin + hh * cos)
            },
            {
                x: houseX + (-hw * cos - hh * sin),
                y: houseY + (-hw * sin + hh * cos)
            }
        ];

        // Generate ceiling corners using fake 3D perspective
        const topPoints = basePoints.map(p =>
            getFake3dPoint(p, viewPoint, this.buildingHeight * 0.6)
        );
        const ceiling = new Polygon(topPoints);

        // Create wall polygons (4 quads connecting base to ceiling)
        const walls = [];
        for (let i = 0; i < basePoints.length; i++) {
            const n = (i + 1) % basePoints.length;
            walls.push(
                new Polygon([
                    basePoints[i],
                    basePoints[n],
                    topPoints[n],
                    topPoints[i]
                ])
            );
        }

        // Sort walls by distance from viewpoint (far to near)
        walls.sort((a, b) =>
            b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
        );

        // Create roof polygons - all buildings have roofs
        let roofPolys = [];
        if (this.roofStyle === 'peaked') {
            // Peaked triangular roof
            const baseMid = [
                average(basePoints[0], basePoints[1]),
                average(basePoints[2], basePoints[3])
            ];

            const topMid = baseMid.map(p =>
                getFake3dPoint(p, viewPoint, this.buildingHeight)
            );

            roofPolys = [
                new Polygon([topPoints[0], topPoints[3], topMid[1], topMid[0]]),
                new Polygon([topPoints[2], topPoints[1], topMid[0], topMid[1]])
            ];
        } else {
            // Flat straight roof - slightly elevated ceiling (same color as walls)
            const flatRoofPoints = basePoints.map(p =>
                getFake3dPoint(p, viewPoint, this.buildingHeight * 0.65)
            );
            roofPolys = [new Polygon(flatRoofPoints)];
        }

        // Sort roof polygons by distance
        roofPolys.sort((a, b) =>
            b.distanceToPoint(viewPoint) - a.distanceToPoint(viewPoint)
        );

        // ==========================
        // RENDER IN CORRECT ORDER
        // ==========================

        // 1. Draw base (foundation/shadow)
        const base = new Polygon(basePoints);
        base.draw(ctx, {
            fill: "#aaa",
            stroke: "rgba(0,0,0,0.2)",
            lineWidth: 2
        });

        // 2. Draw walls (sorted far to near)
        walls.forEach(wall =>
            wall.draw(ctx, {
                fill: this.wallColor,
                stroke: "#999",
                lineWidth: 1
            })
        );

        // 3. Draw ceiling
        ceiling.draw(ctx, {
            fill: this.wallColor,
            stroke: "#ccc",
            lineWidth: 1
        });

        // 4. Draw roof (sorted far to near)
        roofPolys.forEach(roof =>
            roof.draw(ctx, {
                fill: this.roofStyle === 'peaked' ? this.roofColor : this.wallColor,
                stroke: this.roofStyle === 'peaked' ? '#654321' : '#534f4fff',
                lineWidth: this.roofStyle === 'peaked' ? 2 : 3,
                join: "round"
            })
        );
    }
}