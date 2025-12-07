/**
 * Tower Defense Game
 * 
 * Core Logic
 */

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Game Constants
const TILE_SIZE = 32; // Grid size for placement logic (virtual)
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576; // 16:9 aspect ratio

// Set canvas resolution
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;

// Game State
const state = {
    money: 100,
    lives: 20,
    wave: 1,
    enemies: [],
    towers: [],
    projectiles: [],
    particles: [],
    gameActive: false,
    selectedTowerType: null,
    waveActive: false,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    score: 0,
    frameCount: 0,
    stars: []
};

// Map Path (Waypoints)
const path = [
    { x: 0, y: 100 },
    { x: 200, y: 100 },
    { x: 200, y: 400 },
    { x: 500, y: 400 },
    { x: 500, y: 200 },
    { x: 800, y: 200 },
    { x: 800, y: 450 },
    { x: GAME_WIDTH, y: 450 }
];

// Tower Definitions
const TOWER_TYPES = {
    archer: {
        name: 'Arqueiro',
        cost: 50,
        range: 150,
        damage: 10,
        fireRate: 30, // Frames between shots (60fps) -> 0.5s
        color: '#aaffaa',
        type: 'projectile',
        projectileSpeed: 10,
        description: "Rápida e barata. Boa contra inimigos velozes."
    },
    cannon: {
        name: 'Canhão',
        cost: 150,
        range: 120,
        damage: 40,
        fireRate: 120, // 2s
        color: '#ffaaaa',
        type: 'projectile',
        projectileSpeed: 6,
        aoe: 80, // Area of Effect radius
        description: "Dano em área. Lenta, mas devastadora contra grupos."
    },
    mage: {
        name: 'Mago',
        cost: 200,
        range: 200,
        damage: 15,
        fireRate: 45, // 0.75s
        color: '#aaaaff',
        type: 'projectile',
        projectileSpeed: 8,
        slowEffect: 0.5, // 50% speed
        slowDuration: 120, // 2s
        description: "Tiros mágicos que causam lentidão (Slow)."
    },
    sniper: {
        name: 'Sniper',
        cost: 300,
        range: 400,
        damage: 100,
        fireRate: 180, // 3s
        color: '#ffffaa',
        type: 'instant', // Hitscan
        description: "Alcance infinito e dano massivo. Mata alvos fortes."
    },
    bomb: {
        name: 'Bomba',
        cost: 25,
        range: 30, // Trigger radius
        damage: 200,
        fireRate: 0,
        color: '#ffaa55',
        type: 'trap',
        aoe: 100,
        description: "Armadilha barata. Explode ao contato com inimigos."
    }
};

// Enemy Definitions
const ENEMY_TYPES = {
    basic: { hp: 30, speed: 2, reward: 5, color: '#ff0000', radius: 10, name: "Slime", description: "Inimigo básico e fraco." },
    fast: { hp: 15, speed: 4, reward: 7, color: '#ff8800', radius: 8, name: "Corredor", description: "Muito rápido, mas pouca vida." },
    tank: { hp: 80, speed: 1, reward: 15, color: '#880000', radius: 14, name: "Tanque", description: "Lento e resistente." },
    boss: { hp: 500, speed: 0.5, reward: 100, color: '#440044', radius: 25, name: "Chefe", description: "Extremamente forte." }
};

// Audio Context
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Background Music
let bgmInterval = null;
let bgmNoteIndex = 0;
const bgmNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C Major Arpeggio

function startBGM() {
    if (bgmInterval) return;
    bgmInterval = setInterval(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (!state.gameActive) return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        const freq = bgmNotes[bgmNoteIndex % bgmNotes.length];
        bgmNoteIndex++;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gainNode.gain.setValueAtTime(0.02, now); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }, 600); // Play a note every 600ms
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'build') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'gameover') {
        stopBGM();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(50, now + 1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1);
        osc.start(now);
        osc.stop(now + 1);
    }
}

// Classes

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

        // Homing missile logic? Or simple linear?
        // Let's do homing for simplicity so we don't miss
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

// Game Functions

function init() {
    // Reset state
    state.money = 450; // Starting money
    state.lives = 20;
    state.wave = 1;
    state.enemies = [];
    state.towers = [];
    state.projectiles = [];
    state.beams = [];
    state.particles = [];
    state.gameActive = false;
    state.score = 0;
    
    // Init Stars
    state.stars = [];
    for(let i=0; i<100; i++) {
        state.stars.push({
            x: Math.random() * GAME_WIDTH,
            y: Math.random() * GAME_HEIGHT,
            size: Math.random() * 2,
            alpha: Math.random()
        });
    }
    
    updateUI();
    
    // Event Listeners
    canvas.addEventListener('click', handleCanvasClick);
    
    // Start Loop
    requestAnimationFrame(loop);
}

function startGame() {
    document.getElementById('start-screen').classList.add('hidden');
    document.getElementById('game-over-screen').classList.add('hidden');
    state.gameActive = true;
    startBGM();
    startWave();
}

function restartGame() {
    init();
    startGame();
}

function startWave() {
    state.waveActive = true;
    state.enemiesToSpawn = 5 + Math.floor(state.wave * 2.5);
    state.spawnTimer = 0;
    updateUI();
}

function spawnEnemy() {
    let type = 'basic';
    const rand = Math.random();
    
    if (state.wave > 3 && rand < 0.2) type = 'fast';
    if (state.wave > 5 && rand < 0.1) type = 'tank';
    if (state.wave % 5 === 0 && state.enemiesToSpawn === 1) type = 'boss'; // Last enemy of every 5th wave

    state.enemies.push(new Enemy(type));
}

function gameOver() {
    state.gameActive = false;
    playSound('gameover');
    document.getElementById('final-score').innerText = state.score;
    document.getElementById('final-wave').innerText = state.wave;
    document.getElementById('game-over-screen').classList.remove('hidden');
}

function update() {
    if (!state.gameActive) return;

    state.frameCount++;

    // Wave Logic
    if (state.waveActive) {
        if (state.enemiesToSpawn > 0) {
            state.spawnTimer++;
            // Spawn rate increases slightly with waves
            const spawnRate = Math.max(20, 60 - state.wave * 2); 
            if (state.spawnTimer >= spawnRate) {
                spawnEnemy();
                state.enemiesToSpawn--;
                state.spawnTimer = 0;
            }
        } else if (state.enemies.length === 0) {
            state.waveActive = false;
            state.wave++;
            // Auto start next wave after delay? Or manual?
            // Let's do auto for now with a small pause
            setTimeout(startWave, 2000);
        }
    }

    // Update Entities
    state.enemies.forEach(e => e.update());
    state.towers.forEach(t => t.update());
    
    // Update Projectiles
    for (let i = state.projectiles.length - 1; i >= 0; i--) {
        const p = state.projectiles[i];
        p.update();
        if (!p.active) {
            state.projectiles.splice(i, 1);
        }
    }

    // Update Beams
    for (let i = state.beams.length - 1; i >= 0; i--) {
        state.beams[i].life--;
        if (state.beams[i].life <= 0) {
            state.beams.splice(i, 1);
        }
    }

    // Update Particles
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.update();
        if (p.life <= 0) {
            state.particles.splice(i, 1);
        }
    }

    updateUI();
}

function draw() {
    // Clear & Background (Space)
    ctx.fillStyle = '#000011';
    ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Draw Stars
    ctx.fillStyle = '#FFF';
    state.stars.forEach(star => {
        ctx.globalAlpha = Math.abs(Math.sin(state.frameCount * 0.01 + star.x)); // Twinkle
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1.0;

    // Draw Path (Holographic/Space Lane)
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#0088FF';
    ctx.strokeStyle = 'rgba(0, 100, 255, 0.3)';
    ctx.lineWidth = 40;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.stroke();
    
    // Path Center Line
    ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(200, 230, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Base (Earth)
    const baseX = GAME_WIDTH - 50;
    const baseY = 420;
    const earthRadius = 60;

    ctx.save();
    ctx.translate(baseX, baseY);
    
    // Atmosphere Glow
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#4488FF';
    
    // Ocean
    ctx.fillStyle = '#1144AA';
    ctx.beginPath();
    ctx.arc(0, 0, earthRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Continents (Simple shapes)
    ctx.fillStyle = '#228822';
    ctx.beginPath();
    ctx.arc(-20, -10, 25, 0, Math.PI * 2); // America-ish
    ctx.fill();
    ctx.beginPath();
    ctx.arc(30, 10, 20, 0, Math.PI * 2); // Europe/Africa-ish
    ctx.fill();
    ctx.beginPath();
    ctx.arc(10, 40, 15, 0, Math.PI * 2); // Antarctica-ish
    ctx.fill();

    // Clouds (Rotating)
    ctx.rotate(state.frameCount * 0.002);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(0, -30, 15, 0, Math.PI * 2);
    ctx.arc(40, 10, 20, 0, Math.PI * 2);
    ctx.arc(-30, 30, 18, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Draw Entities
    state.towers.forEach(t => t.draw());
    state.enemies.forEach(e => e.draw());
    state.projectiles.forEach(p => p.draw());
    
    // Draw Beams
    state.beams.forEach(b => {
        ctx.beginPath();
        ctx.moveTo(b.startX, b.startY);
        ctx.lineTo(b.endX, b.endY);
        ctx.strokeStyle = `rgba(255, 255, 0, ${b.life / 10})`;
        ctx.lineWidth = 3;
        ctx.stroke();
    });

    state.particles.forEach(p => p.draw());

    // Draw Placement Preview
    if (state.selectedTowerType) {
        // We need mouse position here, but canvas click handles logic.
        // For preview, we'd need a mousemove listener.
        // Skipping complex preview for now to keep it simple, 
        // or we can add a simple mouse tracker.
    }
}

function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
}

// Input Handling

function selectTower(type) {
    state.selectedTowerType = type;
    // Highlight UI
    document.querySelectorAll('.tower-card').forEach(el => el.classList.remove('selected'));
    const selected = document.querySelector(`.tower-card[data-type="${type}"]`);
    if (selected) selected.classList.add('selected');
}

function handleCanvasClick(e) {
    if (!state.gameActive) return;
    if (!state.selectedTowerType) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check cost
    const towerStats = TOWER_TYPES[state.selectedTowerType];
    if (state.money < towerStats.cost) {
        // Not enough money feedback?
        return;
    }

    // Check placement validity (not on path, not on other tower)
    if (!isValidPlacement(x, y)) {
        return;
    }

    // Place tower
    state.money -= towerStats.cost;
    state.towers.push(new Tower(x, y, state.selectedTowerType));
    playSound('build');
    
    // Deselect? Or keep selected for multiple placement?
    // Keep selected for better UX
    updateUI();
}

function isValidPlacement(x, y) {
    // Check collision with path
    // Simple point-to-segment distance check for the whole path
    const pathRadius = 25; // Half of path width + margin
    
    for (let i = 0; i < path.length - 1; i++) {
        const p1 = path[i];
        const p2 = path[i+1];
        if (distToSegment(x, y, p1.x, p1.y, p2.x, p2.y) < pathRadius) {
            return false;
        }
    }

    // Check collision with other towers
    for (const t of state.towers) {
        if (Math.hypot(t.x - x, t.y - y) < 40) {
            return false;
        }
    }

    return true;
}

function distToSegment(x, y, x1, y1, x2, y2) {
    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq != 0) //in case of 0 length line
        param = dot / len_sq;

    let xx, yy;

    if (param < 0) {
        xx = x1;
        yy = y1;
    }
    else if (param > 1) {
        xx = x2;
        yy = y2;
    }
    else {
        xx = x1 + param * C;
        yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;
    return Math.sqrt(dx * dx + dy * dy);
}

function updateUI() {
    document.getElementById('money').innerText = Math.floor(state.money);
    document.getElementById('lives').innerText = state.lives;
    document.getElementById('wave').innerText = state.wave;
    document.getElementById('enemies-left').innerText = state.enemies.length + state.enemiesToSpawn;
}

// Expose selectTower to global scope for HTML onclick
window.selectTower = selectTower;
window.startGame = startGame;
window.restartGame = restartGame;
window.toggleGuide = toggleGuide;

// Guide & Info System

function toggleGuide() {
    const modal = document.getElementById('guide-modal');
    if (modal.classList.contains('hidden')) {
        populateGuide();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function populateGuide() {
    const towerGrid = document.getElementById('guide-towers');
    const enemyGrid = document.getElementById('guide-enemies');
    
    if (towerGrid.children.length > 0) return; // Already populated

    // Towers
    for (const key in TOWER_TYPES) {
        const t = TOWER_TYPES[key];
        const div = document.createElement('div');
        div.className = 'guide-item';
        div.innerHTML = `
            <h4>${t.name}</h4>
            <p>💰 Custo: ${t.cost}</p>
            <p>⚔️ Dano: ${t.damage}</p>
            <p>🏹 Alcance: ${t.range}</p>
            <p>⏱️ Cadência: ${(60/t.fireRate).toFixed(1)}/s</p>
            <p><i>${t.description}</i></p>
        `;
        towerGrid.appendChild(div);
    }

    // Enemies
    for (const key in ENEMY_TYPES) {
        const e = ENEMY_TYPES[key];
        const div = document.createElement('div');
        div.className = 'guide-item';
        div.innerHTML = `
            <h4 style="color:${e.color}">${e.name}</h4>
            <p>❤️ Vida Base: ${e.hp}</p>
            <p>👟 Velocidade: ${e.speed}</p>
            <p>💰 Recompensa: ${e.reward}</p>
            <p><i>${e.description}</i></p>
        `;
        enemyGrid.appendChild(div);
    }
}

function updateInfoPanel(text) {
    const panel = document.getElementById('info-text');
    panel.innerHTML = text;
}

// Update selectTower to show info
const originalSelectTower = window.selectTower;
window.selectTower = function(type) {
    originalSelectTower(type);
    const t = TOWER_TYPES[type];
    updateInfoPanel(`Selecionado: <strong>${t.name}</strong> - Clique para posicionar.`);
};

// Add click listener for entities on canvas
canvas.addEventListener('click', (e) => {
    if (!state.gameActive) return;
    
    // If placing a tower, don't select entity
    if (state.selectedTowerType) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    // Check enemies
    for (const enemy of state.enemies) {
        const dist = Math.hypot(enemy.x - x, enemy.y - y);
        if (dist < enemy.radius + 10) {
            updateInfoPanel(`<strong>${enemy.type.toUpperCase()}</strong>: HP ${Math.floor(enemy.hp)}/${Math.floor(enemy.maxHp)}`);
            return;
        }
    }

    // Check towers
    for (const tower of state.towers) {
        const dist = Math.hypot(tower.x - x, tower.y - y);
        if (dist < 20) {
            const t = tower.stats;
            updateInfoPanel(`<strong>Torre ${t.name}</strong>: Dano ${t.damage}, Alcance ${t.range}`);
            return;
        }
    }
});

// Init
init();
