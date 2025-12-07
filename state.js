/**
 * Shared canvas context and game state
 */
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

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
    beams: [],
    gameActive: false,
    selectedTowerType: null,
    waveActive: false,
    enemiesToSpawn: 0,
    spawnTimer: 0,
    score: 0,
    frameCount: 0,
    stars: []
};
