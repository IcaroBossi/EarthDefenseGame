/**
 * Enemy entity
 */
class Enemy {
    constructor(type) {
        this.type = type;
        const stats = ENEMY_TYPES[type];
        this.hp = stats.hp * (1 + (state.wave * 0.2)); // HP scaling
        this.maxHp = this.hp;
        this.speed = stats.speed;
        this.baseSpeed = stats.speed;
        this.reward = stats.reward;
        this.color = stats.color;
        this.radius = stats.radius;
        
        this.pathIndex = 0;
        this.x = path[0].x;
        this.y = path[0].y;
        
        this.slowTimer = 0;
        this.frozen = false;
    }

    update() {
        // Apply status effects
        let currentSpeed = this.speed;
        if (this.slowTimer > 0) {
            currentSpeed *= 0.5;
            this.slowTimer--;
        }

        // Move along path
        const target = path[this.pathIndex + 1];
        if (!target) return; // Reached end

        const dx = target.x - this.x;
        const dy = target.y - this.y;
        const dist = Math.hypot(dx, dy);

        if (dist < currentSpeed) {
            this.x = target.x;
            this.y = target.y;
            this.pathIndex++;
            if (this.pathIndex >= path.length - 1) {
                this.reachBase();
            }
        } else {
            this.x += (dx / dist) * currentSpeed;
            this.y += (dy / dist) * currentSpeed;
        }
    }

    draw() {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (this.type === 'basic') {
            // Slime
            ctx.fillStyle = '#76ff03'; // Light Green
            ctx.beginPath();
            // Wobbly effect
            const wobble = Math.sin(state.frameCount * 0.2) * 2;
            ctx.ellipse(0, 0, this.radius + wobble, this.radius - wobble, 0, 0, Math.PI * 2);
            ctx.fill();
            // Eyes
            ctx.fillStyle = '#000';
            ctx.beginPath();
            ctx.arc(-4, -2, 2, 0, Math.PI * 2);
            ctx.arc(4, -2, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'fast') {
            // Speedster (Triangle)
            ctx.fillStyle = '#ff9100'; // Orange
            ctx.beginPath();
            ctx.moveTo(10, 0);
            ctx.lineTo(-8, 8);
            ctx.lineTo(-8, -8);
            ctx.fill();
            // Stripe
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(-8, 0);
            ctx.lineTo(6, 0);
            ctx.stroke();
        } else if (this.type === 'tank') {
            // Tank (Square with bolts)
            ctx.fillStyle = '#5d4037'; // Brown
            ctx.fillRect(-12, -12, 24, 24);
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.strokeRect(-12, -12, 24, 24);
            // Bolts
            ctx.fillStyle = '#aaa';
            ctx.beginPath();
            ctx.arc(-8, -8, 2, 0, Math.PI * 2);
            ctx.arc(8, -8, 2, 0, Math.PI * 2);
            ctx.arc(-8, 8, 2, 0, Math.PI * 2);
            ctx.arc(8, 8, 2, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'boss') {
            // Boss (Demon)
            ctx.fillStyle = '#4a148c'; // Purple
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
            // Horns
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.moveTo(-10, -10);
            ctx.lineTo(-20, -25);
            ctx.lineTo(-5, -15);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, -10);
            ctx.lineTo(20, -25);
            ctx.lineTo(5, -15);
            ctx.fill();
            // Angry Eyes
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.moveTo(-10, -5);
            ctx.lineTo(-5, 0);
            ctx.lineTo(-10, 5);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(10, -5);
            ctx.lineTo(5, 0);
            ctx.lineTo(10, 5);
            ctx.fill();
        } else {
            // Fallback
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }

        // Status Effects (Slow)
        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 4, 0, Math.PI * 2);
            ctx.stroke();
        }

        // Health bar
        const hpPercent = this.hp / this.maxHp;
        ctx.fillStyle = 'red';
        ctx.fillRect(-10, -this.radius - 10, 20, 4);
        ctx.fillStyle = '#0f0';
        ctx.fillRect(-10, -this.radius - 10, 20 * hpPercent, 4);

        ctx.restore();
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.die();
        } else {
            playSound('hit');
        }
    }

    die() {
        state.money += this.reward;
        state.score += this.reward * 10;
        updateUI();
        // Remove from array
        const index = state.enemies.indexOf(this);
        if (index > -1) state.enemies.splice(index, 1);
        
        // Spawn particles
        for(let i=0; i<5; i++) {
            state.particles.push(new Particle(this.x, this.y, this.color));
        }
    }

    reachBase() {
        state.lives--;
        updateUI();
        const index = state.enemies.indexOf(this);
        if (index > -1) state.enemies.splice(index, 1);
        
        if (state.lives <= 0) {
            gameOver();
        }
    }
}
