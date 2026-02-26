const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const hpEl = document.getElementById('hp');
const floorEl = document.getElementById('floor');
const goldEl = document.getElementById('gold');
const logEl = document.getElementById('message-log');

// Game Constants
const TILE_SIZE = 32;
const ROWS = 15;
const COLS = 20;
canvas.width = COLS * TILE_SIZE;
canvas.height = ROWS * TILE_SIZE;

// Colors & Tiles
const TILES = {
    WALL: '#444',
    FLOOR: '#111',
    PLAYER: '#00ff00',
    ENEMY: '#ff4444',
    GOLD: '#ffcc00',
    EXIT: '#4444ff',
    VOID: '#000'
};

// Game State
let dungeon = [];
let player = { x: 1, y: 1, hp: 100, gold: 0 };
let floor = 1;
let enemies = [];
let items = [];

function initDungeon() {
    dungeon = [];
    // 1. Fill with walls
    for (let y = 0; y < ROWS; y++) {
        dungeon[y] = Array(COLS).fill(1);
    }

    // 2. Simple Random Walk / Drunkard's Walk for guaranteed path
    let curX = 1;
    let curY = 1;
    dungeon[curY][curX] = 0;
    
    const targetX = COLS - 2;
    const targetY = ROWS - 2;
    
    // Walk until we reach near the exit
    while (curX !== targetX || curY !== targetY) {
        if (Math.random() < 0.5) {
            if (curX < targetX) curX++;
            else if (curX > targetX) curX--;
        } else {
            if (curY < targetY) curY++;
            else if (curY > targetY) curY--;
        }
        dungeon[curY][curX] = 0;
    }

    // 3. Add extra random empty spaces to make it a "room"
    for (let y = 1; y < ROWS - 1; y++) {
        for (let x = 1; x < COLS - 1; x++) {
            if (Math.random() < 0.6) { // 60% chance to be floor
                dungeon[y][x] = 0;
            }
        }
    }

    // Ensure start and end are ALWAYS floor
    player.x = 1; player.y = 1;
    dungeon[1][1] = 0;
    dungeon[ROWS - 2][COLS - 2] = 2; // Exit

    spawnEntities();
}

function spawnEntities() {
    enemies = [];
    items = [];
    for (let i = 0; i < 3 + floor; i++) {
        let ex, ey;
        do {
            ex = Math.floor(Math.random() * COLS);
            ey = Math.floor(Math.random() * ROWS);
        } while (dungeon[ey][ex] !== 0 || (ex === player.x && ey === player.y));
        enemies.push({ x: ex, y: ey, hp: 20 + (floor * 5) });
    }

    for (let i = 0; i < 5; i++) {
        let ix, iy;
        do {
            ix = Math.floor(Math.random() * COLS);
            iy = Math.floor(Math.random() * ROWS);
        } while (dungeon[iy][ix] !== 0);
        items.push({ x: ix, y: iy, type: 'gold', value: 10 });
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
            if (dungeon[y][x] === 1) ctx.fillStyle = TILES.WALL;
            else if (dungeon[y][x] === 2) ctx.fillStyle = TILES.EXIT;
            else ctx.fillStyle = TILES.FLOOR;
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#222';
            ctx.strokeRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        }
    }

    // Draw Items
    items.forEach(item => {
        ctx.fillStyle = TILES.GOLD;
        ctx.beginPath();
        ctx.arc(item.x * TILE_SIZE + TILE_SIZE/2, item.y * TILE_SIZE + TILE_SIZE/2, TILE_SIZE/4, 0, Math.PI * 2);
        ctx.fill();
    });

    // Draw Enemies
    enemies.forEach(en => {
        ctx.fillStyle = TILES.ENEMY;
        ctx.fillRect(en.x * TILE_SIZE + 4, en.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
    });

    // Draw Player
    ctx.fillStyle = TILES.PLAYER;
    ctx.fillRect(player.x * TILE_SIZE + 4, player.y * TILE_SIZE + 4, TILE_SIZE - 8, TILE_SIZE - 8);
}

function movePlayer(dx, dy) {
    let nextX = player.x + dx;
    let nextY = player.y + dy;

    if (dungeon[nextY][nextX] === 1) return; // Wall

    // Check Enemy Collision
    const enemyIdx = enemies.findIndex(en => en.x === nextX && en.y === nextY);
    if (enemyIdx > -1) {
        attackEnemy(enemyIdx);
        return;
    }

    player.x = nextX;
    player.y = nextY;

    // Check Items
    const itemIdx = items.findIndex(it => it.x === player.x && it.y === player.y);
    if (itemIdx > -1) {
        player.gold += items[itemIdx].value;
        items.splice(itemIdx, 1);
        updateUI();
        logMessage("Found 10 gold!");
    }

    // Check Exit
    if (dungeon[player.y][player.x] === 2) {
        floor++;
        logMessage(`Descending to floor ${floor}...`);
        initDungeon();
        updateUI();
    }

    moveEnemies();
    draw();
}

function attackEnemy(idx) {
    const en = enemies[idx];
    en.hp -= 10;
    logMessage(`Hit enemy! Enemy HP: ${en.hp}`);
    if (en.hp <= 0) {
        enemies.splice(idx, 1);
        player.gold += 20;
        logMessage("Enemy defeated! +20 Gold");
        updateUI();
    }
}

function moveEnemies() {
    enemies.forEach(en => {
        if (Math.random() < 0.3) { // 30% chance to move
            let dx = 0, dy = 0;
            if (Math.random() < 0.5) dx = Math.random() < 0.5 ? 1 : -1;
            else dy = Math.random() < 0.5 ? 1 : -1;

            if (dungeon[en.y + dy][en.x + dx] === 0 && !(en.x + dx === player.x && en.y + dy === player.y)) {
                en.x += dx; en.y += dy;
            }
        }
    });
}

function updateUI() {
    hpEl.textContent = player.hp;
    floorEl.textContent = floor;
    goldEl.textContent = player.gold;
}

function logMessage(msg) {
    logEl.textContent = msg;
}

window.addEventListener('keydown', e => {
    switch(e.key.toLowerCase()) {
        case 'w': case 'arrowup': movePlayer(0, -1); break;
        case 's': case 'arrowdown': movePlayer(0, 1); break;
        case 'a': case 'arrowleft': movePlayer(-1, 0); break;
        case 'd': case 'arrowright': movePlayer(1, 0); break;
    }
});

// Mobile Controls Logic
const mobileBtns = {
    'btn-up': [0, -1],
    'btn-down': [0, 1],
    'btn-left': [-1, 0],
    'btn-right': [1, 0]
};

Object.entries(mobileBtns).forEach(([id, [dx, dy]]) => {
    const btn = document.getElementById(id);
    if (btn) {
        // Gunakan pointerdown agar jalan di HP maupun Mouse tanpa konflik
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            movePlayer(dx, dy);
        });
    }
});

initDungeon();
updateUI();
draw();
