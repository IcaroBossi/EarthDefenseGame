/**
 * Game loop, UI, and input wiring
 */

let suppressNextClick = false; // Avoid duplicate click after touch

function getCanvasCoords(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY
    };
}

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
    canvas.addEventListener('touchstart', handleCanvasTouchStart, { passive: false });
    
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

function handleCanvasClick(e, allowSuppressed = false) {
    if (!allowSuppressed && suppressNextClick) {
        suppressNextClick = false;
        return;
    }
    if (!state.gameActive) return;
    if (!state.selectedTowerType) return;

    const { x, y } = getCanvasCoords(e.clientX, e.clientY);

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

function handleCanvasTouchStart(e) {
    const touch = e.touches[0];
    if (!touch) return;
    suppressNextClick = true; // Skip the synthetic click that follows touch
    if (state.selectedTowerType) {
        handleCanvasClick({ clientX: touch.clientX, clientY: touch.clientY }, true);
    } else {
        inspectAt(touch.clientX, touch.clientY);
    }
    e.preventDefault();
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

function inspectAt(clientX, clientY) {
    if (!state.gameActive) return;
    if (state.selectedTowerType) return;

    const { x, y } = getCanvasCoords(clientX, clientY);

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

// Add click/touch listener for entities on canvas
canvas.addEventListener('click', (e) => {
    if (suppressNextClick) {
        suppressNextClick = false;
        return;
    }
    inspectAt(e.clientX, e.clientY);
});

// Init
init();
