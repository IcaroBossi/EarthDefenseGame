/**
 * Game constants and definitions
 */
const TILE_SIZE = 32; // Grid size for placement logic (virtual)
const GAME_WIDTH = 1024;
const GAME_HEIGHT = 576; // 16:9 aspect ratio

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
