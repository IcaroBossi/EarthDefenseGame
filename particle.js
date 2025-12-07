/**
 * Particle effect entity
 */
class Particle {
    constructor(x, y, color, speedMult = 1) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.life = 1.0;
        this.vx = (Math.random() - 0.5) * 4 * speedMult;
        this.vy = (Math.random() - 0.5) * 4 * speedMult;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life -= 0.05;
    }

    draw() {
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
    }
}
