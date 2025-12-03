const soulsElement = document.getElementById('souls');
const spsElement = document.getElementById('sps');

let souls = 0;
let soulsPerSecond = 0;

// 3 légions différentes
const legions = [
    { name: "Berserker", power: 2.5, color: "#ff3333" },
    { name: "Sorcière", power: 1.8, color: "#9933ff" },
    { name: "Titan", power: 4.0, color: "#00ffff" }
];

// Chaque royaume a sa propre légion assignée + son multiplicateur
const realms = [
    { multiplier: 1.0, legionId: 0, canvas: null, ctx: null, enemies: [] },
    { multiplier: 0.8, legionId: 1, canvas: null, ctx: null, enemies: [] },
    { multiplier: 1.5, legionId: 2, canvas: null, ctx: null, enemies: [] }
];

let activeRealmId = 0;

// Initialisation
document.querySelectorAll('.realm').forEach((r, i) => {
    realms[i].canvas = r.querySelector('canvas');
    realms[i].ctx = realms[i].canvas.getContext('2d');
});

// --- Boucle principale ---
setInterval(() => {
    soulsPerSecond = 0;
    realms.forEach(realm => {
        const legion = legions[realm.legionId];
        const income = legion.power * realm.multiplier; // base income
        souls += income / 10;          // 10 FPS tick
        soulsPerSecond += income;
        spawnEnemies(realm);
        updateCanvas(realm);
    });
    soulsElement.textContent = Math.floor(souls).toLocaleString();
    spsElement.textContent = soulsPerSecond.toFixed(1);
}, 100);

// --- Spawns & dessin ennemis simples ---
function spawnEnemies(realm) {
    if (Math.random() < 0.15) {
        realm.enemies.push({
            x: realm.canvas.width,
            y: 80 + Math.random() * 40,
            speed: 0.5 + Math.random()
        });
    }
}

function updateCanvas(realm) {
    const ctx = realm.ctx;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    // Sol simple
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 120, ctx.canvas.width, 4);

    // Slayer (carré coloré)
    ctx.fillStyle = legions[realm.legionId].color;
    ctx.fillRect(40, 100, 30, 40);

    // Ennemis (ronds rouges)
    realm.enemies = realm.enemies.filter(e => {
        e.x -= e.speed;
        ctx.fillStyle = "#ff0000";
        ctx.beginPath(); ctx.arc(e.x, e.y, 15, 0, Math.PI * 2); ctx.fill();

        // Kill quand l'ennemi passe le slayer
        if (e.x < 55) {
            souls += 1 * realm.multiplier;
            return false;
        }
        return e.x > -20;
    });
}

// --- Switch rapide de légion ---
document.querySelectorAll('#quick-switch button, .slayer-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const newLegionId = parseInt(btn.dataset.legion);

        // Option A : switch global (toutes les légions deviennent celle-ci)
        realms.forEach(r => r.legionId = newLegionId);

        // Option B (plus tard) : ne change que le royaume actif
        // realms[activeRealmId].legionId = newLegionId;

        updateButtons(newLegionId);
    });
});

function updateButtons(activeId) {
    document.querySelectorAll('.slayer-btn, #quick-switch button').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.legion) === activeId);
    });
}

// PWA : Service Worker simple (offline + cache)
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}