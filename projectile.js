/**
 * Projectile entity
 */
class Projectile {
    constructor(x, y, target, towerType) {
        this.x = x;
        this.y = y;
        this.target = target;
        this.type = towerType;
        this.stats = TOWER_TYPES[towerType];
        this.speed = this.stats.projectileSpeed;
        this.active = true;
    }

    update() {
        if (!this.active) return;

        // Homing logic
        if (state.enemies.indexOf(this.target) === -1) {
            this.active = false; // Target dead
            return;
        }

        const dx = this.target.x - this.x;
        const dy = this.target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < this.speed) {
            this.hit(this.target);
        } else {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
    }

    hit(target) {
        this.active = false;
        if (this.stats.aoe) {
            playSound('explosion');
            // AOE Logic
            for (const enemy of state.enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist <= this.stats.aoe) {
                    enemy.takeDamage(this.stats.damage);
                }
            }
            // Explosion particles
            for(let i=0; i<5; i++) {
                state.particles.push(new Particle(this.x, this.y, 'orange'));
            }
        } else {
            target.takeDamage(this.stats.damage);
            if (this.stats.slowEffect) {
                target.slowTimer = this.stats.slowDuration;
            }
        }
    }

    draw() {
        ctx.fillStyle = this.stats.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
        ctx.fill();
    }
}
