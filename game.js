// === ÉLÉMENTS DOM ===
const soulsElement = document.getElementById('souls');
const spsElement = document.getElementById('sps');

// === VARIABLES GLOBALES ===
let souls = 0;
let soulsPerSecond = 0;
let lastSaveTime = Date.now();
let lastActivityTime = Date.now();
const SAVE_INTERVAL = 10000; // Sauvegarde auto toutes les 10s

// === LÉGIONS ===
const legions = [
    { name: "Berserker", power: 2.5, color: "#ff3333" },
    { name: "Sorcière", power: 1.8, color: "#9933ff" },
    { name: "Titan", power: 4.0, color: "#00ffff" }
];

// === ROYAUMES ===
const realms = [
    { multiplier: 1.0, legionId: 0, canvas: null, ctx: null, enemies: [] },
    { multiplier: 0.8, legionId: 1, canvas: null, ctx: null, enemies: [] },
    { multiplier: 1.5, legionId: 2, canvas: null, ctx: null, enemies: [] }
];

let activeRealmId = 0;

// === FONCTIONS DE SAUVEGARDE ===
function saveGame() {
    const saveData = {
        souls,
        realms: realms.map(r => ({ multiplier: r.multiplier, legionId: r.legionId })),
        legions: legions.map(l => ({ power: l.power })),
        lastSaveTime: Date.now(),
        lastActivityTime
    };
    localStorage.setItem('idleRiftSlayers_save', JSON.stringify(saveData));
    console.log('💾 Sauvegardé !');
}

function loadGame() {
    const saved = localStorage.getItem('idleRiftSlayers_save');
    if (!saved) return;

    const saveData = JSON.parse(saved);
    souls = saveData.souls || 0;

    // Restore realms & legions
    saveData.realms?.forEach((r, i) => {
        realms[i].multiplier = r.multiplier || 1;
        realms[i].legionId = r.legionId || 0;
    });
    saveData.legions?.forEach((l, i) => {
        legions[i].power = l.power || legions[i].power;
    });

    lastSaveTime = saveData.lastSaveTime;
    lastActivityTime = saveData.lastActivityTime;

    // === OFFLINE PROGRESS ===
    const now = Date.now();
    const timeOffline = Math.min((now - lastSaveTime) / 1000, 24 * 3600); // Max 24h
    const avgSps = soulsPerSecond || 1;
    const offlineSouls = avgSps * timeOffline * 0.5; // 50% efficacité offline
    souls += offlineSouls;
    soulsElement.textContent = Math.floor(souls).toLocaleString();

    console.log(`⏰ Offline : +${Math.floor(offlineSouls).toLocaleString()} âmes !`);
}

// === FONCTIONS DE GAMEPLAY ===
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
        ctx.beginPath();
        ctx.arc(e.x, e.y, 15, 0, Math.PI * 2);
        ctx.fill();

        // Kill quand l'ennemi passe le slayer
        if (e.x < 55) {
            souls += 1 * realm.multiplier;
            return false;
        }
        return e.x > -20;
    });
}

function updateButtons(activeId) {
    document.querySelectorAll('.slayer-btn, #quick-switch button').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.legion) === activeId);
    });
}

// === INITIALISATION ===
function init() {
    // Initialisation des canvas
    document.querySelectorAll('.realm').forEach((r, i) => {
        realms[i].canvas = r.querySelector('canvas');
        realms[i].ctx = realms[i].canvas.getContext('2d');
    });

    // Chargement de la sauvegarde
    loadGame();

    // Sauvegarde initiale
    saveGame();

    // Boucle principale
    setInterval(() => {
        soulsPerSecond = 0;
        realms.forEach(realm => {
            const legion = legions[realm.legionId];
            const income = legion.power * realm.multiplier;
            souls += income / 10; // 10 FPS tick
            soulsPerSecond += income;
            spawnEnemies(realm);
            updateCanvas(realm);
        });
        soulsElement.textContent = Math.floor(souls).toLocaleString();
        spsElement.textContent = soulsPerSecond.toFixed(1);

        // Sauvegarde automatique
        lastActivityTime = Date.now();
        if (Date.now() - lastSaveTime > SAVE_INTERVAL) {
            saveGame();
            lastSaveTime = Date.now();
        }
    }, 100);

    // Switch de légion
    document.querySelectorAll('#quick-switch button, .slayer-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const newLegionId = parseInt(btn.dataset.legion);
            realms.forEach(r => r.legionId = newLegionId);
            updateButtons(newLegionId);
            saveGame(); // Sauvegarde après changement
        });
    });
}

// === ÉVÉNEMENTS DE SAUVEGARDE ===
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveGame();
    } else {
        loadGame();
    }
});

window.addEventListener('beforeunload', saveGame);
window.addEventListener('pagehide', saveGame); // iOS Safari

// === PWA SERVICE WORKER ===
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}

// === DÉMARRAGE ===
// Attendre que le DOM soit prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}