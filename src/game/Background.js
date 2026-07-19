export class Background {
  constructor(canvasWidth, canvasHeight) {
    this.width = canvasWidth;
    this.height = canvasHeight;
    this.groundHeight = 64;
    this.groundOffset = 0;
    this.scrollSpeed = 1.7;

    // Clouds
    this.clouds = [
      { x: 50, y: 70, scale: 1.2, speed: 0.3 },
      { x: 300, y: 110, scale: 0.9, speed: 0.25 },
      { x: 520, y: 65, scale: 1.1, speed: 0.35 }
    ];

    // City Buildings Silhouette
    this.buildings = [
      { x: 20, w: 45, h: 90 },
      { x: 70, w: 35, h: 120 },
      { x: 110, w: 50, h: 75 },
      { x: 175, w: 40, h: 110 },
      { x: 230, w: 60, h: 85 },
      { x: 300, w: 45, h: 130 },
      { x: 355, w: 55, h: 95 },
      { x: 420, w: 38, h: 115 },
      { x: 470, w: 65, h: 80 },
      { x: 550, w: 40, h: 105 },
      { x: 600, w: 50, h: 125 }
    ];
  }

  update(isMoving = true) {
    if (isMoving) {
      this.groundOffset = (this.groundOffset + this.scrollSpeed) % 24;

      // Move clouds slowly
      this.clouds.forEach(cloud => {
        cloud.x -= cloud.speed;
        if (cloud.x + 120 * cloud.scale < 0) {
          cloud.x = this.width + 50;
        }
      });
    }
  }

  draw(ctx) {
    const horizonY = this.height - this.groundHeight;

    // 1. Sky Gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    skyGrad.addColorStop(0, '#B7E4E7');
    skyGrad.addColorStop(0.6, '#D6F0ED');
    skyGrad.addColorStop(1, '#EAF7F5');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, this.width, horizonY);

    // 2. City Silhouette Layer
    ctx.fillStyle = 'rgba(168, 212, 207, 0.45)';
    this.buildings.forEach(b => {
      ctx.fillRect(b.x, horizonY - b.h, b.w, b.h);
      // Small windows
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      for (let wx = b.x + 8; wx < b.x + b.w - 10; wx += 12) {
        for (let wy = horizonY - b.h + 12; wy < horizonY - 15; wy += 16) {
          ctx.fillRect(wx, wy, 5, 7);
        }
      }
      ctx.fillStyle = 'rgba(168, 212, 207, 0.45)';
    });

    // 3. Floating Clouds
    this.clouds.forEach(cloud => {
      this.drawCloud(ctx, cloud.x, cloud.y, cloud.scale);
    });

    // 4. Distant Green Hills
    ctx.fillStyle = '#83CFAB';
    ctx.beginPath();
    ctx.moveTo(0, horizonY);
    ctx.quadraticCurveTo(120, horizonY - 45, 260, horizonY);
    ctx.quadraticCurveTo(420, horizonY - 60, 580, horizonY);
    ctx.quadraticCurveTo(640, horizonY - 30, this.width, horizonY);
    ctx.lineTo(this.width, horizonY);
    ctx.lineTo(0, horizonY);
    ctx.closePath();
    ctx.fill();

    // 5. Trees on Horizon
    const treePositions = [40, 110, 180, 250, 340, 410, 490, 570, 630];
    treePositions.forEach(tx => {
      // Tree trunk
      ctx.fillStyle = '#5A8F73';
      ctx.fillRect(tx + 4, horizonY - 25, 4, 15);
      // Tree top
      ctx.fillStyle = '#4CA977';
      ctx.beginPath();
      ctx.arc(tx + 6, horizonY - 26, 12, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Grass & Ground Layer (Exact match to mockup screenshot)
    // Soil Base
    ctx.fillStyle = '#E3C18E';
    ctx.fillRect(0, horizonY, this.width, this.groundHeight);

    // Soil Top Border Line
    ctx.fillStyle = '#A38454';
    ctx.fillRect(0, horizonY, this.width, 3);

    // Grass Cap Layer (Vibrant Green)
    ctx.fillStyle = '#7BC644';
    ctx.fillRect(0, horizonY - 12, this.width, 12);

    // Darker Green Under-line for Grass Depth
    ctx.fillStyle = '#5EA42D';
    ctx.fillRect(0, horizonY, this.width, 4);

    // Animated Grass Tooth / Scallop Pattern
    ctx.fillStyle = '#7BC644';
    const toothWidth = 24;
    for (let x = -this.groundOffset; x < this.width + toothWidth; x += toothWidth) {
      ctx.beginPath();
      ctx.arc(x + 12, horizonY, 8, 0, Math.PI);
      ctx.fill();
    }
  }

  drawCloud(ctx, x, y, scale) {
    ctx.save();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 20 * scale, Math.PI * 0.5, Math.PI * 1.5);
    ctx.arc(x + 25 * scale, y - 15 * scale, 25 * scale, Math.PI * 1, Math.PI * 1.85);
    ctx.arc(x + 60 * scale, y - 10 * scale, 20 * scale, Math.PI * 1.37, Math.PI * 1.91);
    ctx.arc(x + 75 * scale, y, 18 * scale, Math.PI * 1.5, Math.PI * 0.5);
    ctx.moveTo(x + 75 * scale, y + 18 * scale);
    ctx.lineTo(x, y + 18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
