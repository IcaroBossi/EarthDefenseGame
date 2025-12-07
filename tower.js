/**
 * Tower entity
 */
class Tower {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.stats = TOWER_TYPES[type];
        this.cooldown = 0;
        this.range = this.stats.range;
    }

    update() {
        if (this.stats.type === 'trap') {
            // Bomb logic: check for collision
            for (const enemy of state.enemies) {
                const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
                if (dist < this.stats.range + enemy.radius) {
                    this.explode();
                    return; // Destroyed
                }
            }
            return;
        }

        if (this.cooldown > 0) {
            this.cooldown--;
            return;
        }

        // Find target
        const target = this.findTarget();
        if (target) {
            this.shoot(target);
            this.cooldown = this.stats.fireRate;
        }
    }

    findTarget() {
        // Simple logic: closest enemy or first in line
        // Let's pick the one furthest along the path (closest to base)
        let bestTarget = null;
        let maxPathIndex = -1;
        let minDistToNext = Infinity;

        for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.range) {
                // Priority: Path Index (further is better) -> Distance to next node (smaller is better)
                if (enemy.pathIndex > maxPathIndex) {
                    bestTarget = enemy;
                    maxPathIndex = enemy.pathIndex;
                    // Calculate dist to next node for tie breaking
                    const nextNode = path[enemy.pathIndex + 1];
                    if (nextNode) {
                        minDistToNext = Math.hypot(nextNode.x - enemy.x, nextNode.y - enemy.y);
                    }
                } else if (enemy.pathIndex === maxPathIndex) {
                    const nextNode = path[enemy.pathIndex + 1];
                    if (nextNode) {
                        const distToNext = Math.hypot(nextNode.x - enemy.x, nextNode.y - enemy.y);
                        if (distToNext < minDistToNext) {
                            bestTarget = enemy;
                            minDistToNext = distToNext;
                        }
                    }
                }
            }
        }
        return bestTarget;
    }

    shoot(target) {
        playSound('shoot');
        if (this.stats.type === 'instant') {
            // Sniper logic
            target.takeDamage(this.stats.damage);
            // Add beam visual
            state.beams.push({
                startX: this.x,
                startY: this.y,
                endX: target.x,
                endY: target.y,
                life: 10 // Lasts 10 frames
            });
        } else {
            state.projectiles.push(new Projectile(this.x, this.y, target, this.type));
        }
    }

    explode() {
        playSound('explosion');
        // AOE Damage
        for (const enemy of state.enemies) {
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist <= this.stats.aoe) {
                enemy.takeDamage(this.stats.damage);
            }
        }
        // Visual effect
        for(let i=0; i<10; i++) {
            state.particles.push(new Particle(this.x, this.y, '#ff5500', 3));
        }
        
        // Remove tower (trap)
        const index = state.towers.indexOf(this);
        if (index > -1) state.towers.splice(index, 1);
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'archer') {
            // Wooden Tower Base
            ctx.fillStyle = '#8B4513'; // SaddleBrown
            ctx.fillRect(-12, -12, 24, 24);
            // Top Platform
            ctx.fillStyle = '#A0522D'; // Sienna
            ctx.fillRect(-14, -14, 28, 6);
            ctx.fillRect(-14, 8, 28, 6);
            ctx.fillRect(-14, -14, 6, 28);
            ctx.fillRect(8, -14, 6, 28);
            // Crossbow
            ctx.fillStyle = '#DEB887'; // Burlywood
            ctx.beginPath();
            ctx.moveTo(0, -8);
            ctx.lineTo(-8, 8);
            ctx.lineTo(8, 8);
            ctx.fill();
            // Arrow
            ctx.strokeStyle = '#FFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -12);
            ctx.stroke();
        } else if (this.type === 'cannon') {
            // Stone Base
            ctx.fillStyle = '#696969'; // DimGray
            ctx.beginPath();
            ctx.arc(0, 0, 15, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#444';
            ctx.lineWidth = 2;
            ctx.stroke();
            // Cannon Barrel
            ctx.fillStyle = '#222';
            ctx.fillRect(-6, -18, 12, 24);
            // Fuse/Back
            ctx.fillStyle = '#111';
            ctx.beginPath();
            ctx.arc(0, 4, 7, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'mage') {
            // Spire Base
            ctx.fillStyle = '#483D8B'; // DarkSlateBlue
            ctx.beginPath();
            ctx.moveTo(-12, 12);
            ctx.lineTo(12, 12);
            ctx.lineTo(0, -15);
            ctx.fill();
            // Floating Crystal
            ctx.fillStyle = '#00FFFF'; // Cyan
            const pulse = Math.sin(state.frameCount * 0.1) * 2;
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#00FFFF';
            ctx.beginPath();
            ctx.arc(0, -22 + pulse, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else if (this.type === 'sniper') {
            // Camo Bunker
            ctx.fillStyle = '#556B2F'; // DarkOliveGreen
            ctx.beginPath();
            ctx.arc(0, 0, 14, 0, Math.PI * 2);
            ctx.fill();
            // Long Barrel
            ctx.fillStyle = '#111';
            ctx.fillRect(-2, -28, 4, 30);
            // Scope
            ctx.fillStyle = '#87CEEB'; // SkyBlue
            ctx.beginPath();
            ctx.arc(2, -10, 3, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'bomb') {
            // Mine Body
            ctx.fillStyle = '#333';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
            // Spikes
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 2;
            for(let i=0; i<8; i++) {
                ctx.beginPath();
                ctx.moveTo(0, 0);
                const angle = (i / 8) * Math.PI * 2;
                ctx.lineTo(Math.cos(angle) * 14, Math.sin(angle) * 14);
                ctx.stroke();
            }
            // Blinking Light
            ctx.fillStyle = (Math.floor(state.frameCount / 15) % 2 === 0) ? '#FF0000' : '#550000';
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }
}
