// === CONFIGURATION DU JEU ===
const CONFIG = {
    SAVE_INTERVAL: 10000, // 10s
    MAX_OFFLINE_TIME: 24 * 3600, // 24h
    OFFLINE_EFFICIENCY: 0.5, // 50% efficacité offline
    PRESTIGE_BASE: 1000000, // 1M âmes pour 1 point de prestige
    FPS: 10 // Ticks par seconde
};

// === DONNÉES DES SLAYERS ===
const SLAYER_DATA = {
    berserker: {
        name: "Berserker",
        icon: "⚔️",
        basePower: 2.5,
        color: "#ff3333",
        unlockCost: 0,
        description: "Dégâts bruts massifs"
    },
    sorciere: {
        name: "Sorcière",
        icon: "🔮",
        basePower: 1.8,
        color: "#9933ff",
        unlockCost: 500,
        description: "Magie des âmes"
    },
    titan: {
        name: "Titan",
        icon: "🛡️",
        basePower: 4.0,
        color: "#00ffff",
        unlockCost: 2000,
        description: "Tank invincible"
    },
    ombre: {
        name: "Ombre",
        icon: "🌙",
        basePower: 3.2,
        color: "#6600ff",
        unlockCost: 10000,
        description: "Assassin furtif"
    },
    dragon: {
        name: "Dragon",
        icon: "🐉",
        basePower: 6.0,
        color: "#ff0080",
        unlockCost: 50000,
        description: "Puissance légendaire"
    }
};

// === DONNÉES DES ROYAUMES ===
const REALM_DATA = [
    { name: "Forêt Maudite", baseMultiplier: 1.0, color: "#228b22" },
    { name: "Abysse Volcanique", baseMultiplier: 1.5, color: "#ff4500" },
    { name: "Cieux Éthérés", baseMultiplier: 2.0, color: "#87ceeb" },
    { name: "Crypte Oubliée", baseMultiplier: 3.0, color: "#8b008b" },
    { name: "Nexus Temporel", baseMultiplier: 5.0, color: "#ffd700" }
];

// === DONNÉES DES AMÉLIORATIONS ===
const UPGRADE_DATA = {
    soulMultiplier: {
        name: "Multiplicateur d'Âmes",
        icon: "💀",
        description: "×1.5 âmes par niveau",
        baseCost: 100,
        costMultiplier: 2.5,
        effect: (level) => Math.pow(1.5, level)
    },
    attackSpeed: {
        name: "Vitesse d'Attaque",
        icon: "⚡",
        description: "+10% vitesse par niveau",
        baseCost: 200,
        costMultiplier: 2.2,
        effect: (level) => 1 + (level * 0.1)
    },
    critChance: {
        name: "Chance Critique",
        icon: "💥",
        description: "+5% crit par niveau",
        baseCost: 500,
        costMultiplier: 3.0,
        effect: (level) => level * 0.05
    },
    autoProgress: {
        name: "Progression Auto",
        icon: "🤖",
        description: "Améliore l'efficacité offline",
        baseCost: 1000,
        costMultiplier: 2.8,
        effect: (level) => 0.5 + (level * 0.1)
    }
};

// === VARIABLES GLOBALES ===
let gameState = {
    souls: 0,
    soulsPerSecond: 0,
    prestigePoints: 0,
    playerLevel: 1,
    totalSoulsEarned: 0,

    slayers: {},
    activeSlayerId: 'berserker',

    realms: [],

    upgrades: {},

    prestigeUpgrades: {
        soulBonus: 0,
        powerBonus: 0,
        offlineBonus: 0
    },

    lastSaveTime: Date.now(),
    lastActivityTime: Date.now()
};

let gameInitialized = false;
let deferredPrompt = null;

// === ÉLÉMENTS DOM ===
const elements = {
    homeScreen: document.getElementById('home-screen'),
    gameScreen: document.getElementById('game'),
    playBtn: document.getElementById('play-btn'),
    installBtn: document.getElementById('install-btn'),

    souls: document.getElementById('souls'),
    sps: document.getElementById('sps'),
    prestigePoints: document.getElementById('prestige-points'),
    playerLevel: document.getElementById('player-level'),

    realmsGrid: document.querySelector('.realms-grid'),
    slayersGrid: document.querySelector('.slayers-grid'),
    upgradesGrid: document.querySelector('.upgrades-grid'),
    prestigeUpgradesContainer: document.querySelector('.prestige-upgrades'),
    quickSwitchButtons: document.querySelector('.quick-switch-buttons'),

    notifications: document.getElementById('notifications')
};

// === GESTION ÉCRAN D'ACCUEIL ===
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    elements.installBtn.classList.remove('hidden');
});

elements.playBtn.addEventListener('click', () => {
    elements.homeScreen.style.display = 'none';
    elements.gameScreen.style.display = 'block';
    if (!gameInitialized) {
        init();
    }
});

elements.installBtn.addEventListener('click', async () => {
    if (!deferredPrompt) {
        showNotification('Application déjà installée ou non disponible');
        return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
        elements.installBtn.classList.add('hidden');
        showNotification('✅ Application installée !');
    }
    deferredPrompt = null;
});

if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
    elements.installBtn.classList.add('hidden');
}

// === GESTION DES ONGLETS ===
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const tabId = btn.dataset.tab;

        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

        btn.classList.add('active');
        document.getElementById(`tab-${tabId}`).classList.add('active');

        if (tabId === 'prestige') {
            updatePrestigeUI();
        }
    });
});

// === INITIALISATION ===
function init() {
    if (gameInitialized) return;
    gameInitialized = true;

    // Initialiser les slayers
    Object.keys(SLAYER_DATA).forEach(id => {
        gameState.slayers[id] = {
            unlocked: id === 'berserker',
            level: id === 'berserker' ? 1 : 0,
            power: SLAYER_DATA[id].basePower
        };
    });

    // Initialiser les royaumes
    REALM_DATA.forEach((data, index) => {
        gameState.realms.push({
            level: 1,
            slayerId: 'berserker',
            multiplier: data.baseMultiplier,
            enemies: [],
            kills: 0,
            canvas: null,
            ctx: null
        });
    });

    // Initialiser les upgrades
    Object.keys(UPGRADE_DATA).forEach(id => {
        gameState.upgrades[id] = { level: 0 };
    });

    // Charger la sauvegarde
    loadGame();

    // Créer l'interface
    createRealmsUI();
    createSlayersUI();
    createUpgradesUI();
    createPrestigeUpgradesUI();
    createQuickSwitchUI();

    // Initialiser les canvas
    initCanvases();

    // Démarrer la boucle de jeu
    startGameLoop();

    // Sauvegardes automatiques
    setInterval(saveGame, CONFIG.SAVE_INTERVAL);

    console.log('🎮 Jeu initialisé !');
}

// === CRÉATION DE L'INTERFACE ===
function createRealmsUI() {
    elements.realmsGrid.innerHTML = '';

    gameState.realms.forEach((realm, index) => {
        const data = REALM_DATA[index];
        const card = document.createElement('div');
        card.className = 'realm-card';
        card.innerHTML = `
            <div class="realm-header">
                <div class="realm-name">${data.name}</div>
                <div class="realm-level">Niv. ${realm.level}</div>
            </div>
            <div class="realm-canvas-container">
                <canvas width="300" height="150" data-realm="${index}"></canvas>
            </div>
            <div class="realm-stats">
                <div class="realm-stat">
                    <div class="realm-stat-label">Multiplicateur</div>
                    <div class="realm-stat-value">×${realm.multiplier.toFixed(1)}</div>
                </div>
                <div class="realm-stat">
                    <div class="realm-stat-label">Kills</div>
                    <div class="realm-stat-value">${realm.kills}</div>
                </div>
                <div class="realm-stat">
                    <div class="realm-stat-label">Âmes/s</div>
                    <div class="realm-stat-value" id="realm-sps-${index}">0</div>
                </div>
            </div>
            <button class="realm-slayer-btn" onclick="changeRealmSlayer(${index})">
                ${SLAYER_DATA[realm.slayerId].icon} ${SLAYER_DATA[realm.slayerId].name}
            </button>
        `;
        elements.realmsGrid.appendChild(card);
    });
}

function createSlayersUI() {
    elements.slayersGrid.innerHTML = '';

    Object.keys(SLAYER_DATA).forEach(id => {
        const data = SLAYER_DATA[id];
        const slayer = gameState.slayers[id];
        const card = document.createElement('div');
        card.className = `slayer-card ${!slayer.unlocked ? 'locked' : ''}`;
        card.onclick = () => selectSlayer(id);

        card.innerHTML = `
            <div class="slayer-icon">${data.icon}</div>
            <div class="slayer-name">${data.name}</div>
            ${slayer.unlocked ? `
                <div class="slayer-level">Niv. ${slayer.level}</div>
                <div class="slayer-power">⚡ ${(slayer.power * slayer.level).toFixed(1)}</div>
            ` : `
                <div class="slayer-unlock-cost">🔒 ${data.unlockCost} âmes</div>
            `}
        `;

        elements.slayersGrid.appendChild(card);
    });
}

function createUpgradesUI() {
    elements.upgradesGrid.innerHTML = '';

    Object.keys(UPGRADE_DATA).forEach(id => {
        const data = UPGRADE_DATA[id];
        const upgrade = gameState.upgrades[id];
        const cost = Math.floor(data.baseCost * Math.pow(data.costMultiplier, upgrade.level));

        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${data.icon} ${data.name}</div>
                <div class="upgrade-desc">${data.description}</div>
                <div class="upgrade-level">Niveau ${upgrade.level}</div>
            </div>
            <button class="upgrade-btn" onclick="buyUpgrade('${id}')" ${gameState.souls < cost ? 'disabled' : ''}>
                ${cost.toLocaleString()} 💀
            </button>
        `;

        elements.upgradesGrid.appendChild(card);
    });
}

function createPrestigeUpgradesUI() {
    const upgrades = [
        { id: 'soulBonus', name: '💰 Bonus d\'Âmes', desc: '+50% âmes par niveau', cost: 1 },
        { id: 'powerBonus', name: '⚔️ Bonus de Puissance', desc: '+25% puissance par niveau', cost: 1 },
        { id: 'offlineBonus', name: '🌙 Bonus Offline', desc: '+20% efficacité offline par niveau', cost: 2 }
    ];

    elements.prestigeUpgradesContainer.innerHTML = '';

    upgrades.forEach(upgrade => {
        const level = gameState.prestigeUpgrades[upgrade.id];
        const cost = upgrade.cost * (level + 1);

        const card = document.createElement('div');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-info">
                <div class="upgrade-name">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.desc}</div>
                <div class="upgrade-level">Niveau ${level}</div>
            </div>
            <button class="upgrade-btn" onclick="buyPrestigeUpgrade('${upgrade.id}', ${cost})" ${gameState.prestigePoints < cost ? 'disabled' : ''}>
                ${cost} ⭐
            </button>
        `;

        elements.prestigeUpgradesContainer.appendChild(card);
    });
}

function createQuickSwitchUI() {
    elements.quickSwitchButtons.innerHTML = '';

    Object.keys(SLAYER_DATA).forEach(id => {
        const data = SLAYER_DATA[id];
        const slayer = gameState.slayers[id];

        if (slayer.unlocked) {
            const btn = document.createElement('button');
            btn.className = `quick-switch-btn ${id === gameState.activeSlayerId ? 'active' : ''}`;
            btn.textContent = `${data.icon} ${data.name}`;
            btn.onclick = () => switchAllRealms(id);
            elements.quickSwitchButtons.appendChild(btn);
        }
    });
}

// === CANVAS ET RENDU ===
function initCanvases() {
    document.querySelectorAll('canvas[data-realm]').forEach((canvas, index) => {
        gameState.realms[index].canvas = canvas;
        gameState.realms[index].ctx = canvas.getContext('2d');
    });
}

function updateCanvas(realm, index) {
    const ctx = realm.ctx;
    if (!ctx) return;

    const canvas = realm.canvas;
    const data = REALM_DATA[index];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Fond coloré
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, data.color + '33');
    gradient.addColorStop(1, data.color + '11');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Sol
    ctx.fillStyle = "#333";
    ctx.fillRect(0, 120, canvas.width, 4);

    // Slayer
    const slayerData = SLAYER_DATA[realm.slayerId];
    ctx.fillStyle = slayerData.color;
    ctx.fillRect(40, 90, 30, 30);
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(slayerData.icon, 55, 110);

    // Ennemis
    realm.enemies = realm.enemies.filter(enemy => {
        enemy.x -= enemy.speed;

        // Dessiner l'ennemi
        ctx.fillStyle = "#ff0000";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Kill si collision
        if (enemy.x < 70) {
            const slayer = gameState.slayers[realm.slayerId];
            const soulGain = realm.multiplier * (1 + Math.random());
            gameState.souls += soulGain;
            gameState.totalSoulsEarned += soulGain;
            realm.kills++;
            return false;
        }

        return enemy.x > -20;
    });

    // Spawn ennemis
    if (Math.random() < 0.15) {
        realm.enemies.push({
            x: canvas.width,
            y: 80 + Math.random() * 40,
            speed: 0.5 + Math.random() * 1.5
        });
    }
}

// === LOGIQUE DU JEU ===
function startGameLoop() {
    setInterval(() => {
        gameState.soulsPerSecond = 0;

        // Calculer les multiplicateurs
        const soulMultiplier = UPGRADE_DATA.soulMultiplier.effect(gameState.upgrades.soulMultiplier.level);
        const prestigeMultiplier = 1 + (gameState.prestigePoints * 0.5) + (gameState.prestigeUpgrades.soulBonus * 0.5);
        const powerMultiplier = 1 + (gameState.prestigeUpgrades.powerBonus * 0.25);

        // Mettre à jour chaque royaume
        gameState.realms.forEach((realm, index) => {
            const slayer = gameState.slayers[realm.slayerId];
            const basePower = SLAYER_DATA[realm.slayerId].basePower;
            const totalPower = basePower * slayer.level * powerMultiplier;
            const income = totalPower * realm.multiplier * soulMultiplier * prestigeMultiplier;

            gameState.souls += income / CONFIG.FPS;
            gameState.soulsPerSecond += income;
            gameState.totalSoulsEarned += income / CONFIG.FPS;

            updateCanvas(realm, index);

            // Mettre à jour l'UI du royaume
            const spsElement = document.getElementById(`realm-sps-${index}`);
            if (spsElement) {
                spsElement.textContent = income.toFixed(1);
            }
        });

        // Mettre à jour l'UI principale
        updateMainUI();

        // Level up automatique
        const newLevel = Math.floor(Math.log10(gameState.totalSoulsEarned + 1)) + 1;
        if (newLevel > gameState.playerLevel) {
            gameState.playerLevel = newLevel;
            showNotification(`🎉 Niveau ${newLevel} atteint !`);
        }

    }, 1000 / CONFIG.FPS);
}

function updateMainUI() {
    elements.souls.textContent = Math.floor(gameState.souls).toLocaleString();
    elements.sps.textContent = gameState.soulsPerSecond.toFixed(1);
    elements.prestigePoints.textContent = gameState.prestigePoints.toLocaleString();
    elements.playerLevel.textContent = gameState.playerLevel;
}

function updatePrestigeUI() {
    const currentSouls = Math.floor(gameState.souls);
    const prestigeGain = Math.floor(Math.sqrt(gameState.totalSoulsEarned / CONFIG.PRESTIGE_BASE));
    const multiplier = 1 + (prestigeGain * 0.5);

    document.getElementById('prestige-current-souls').textContent = currentSouls.toLocaleString();
    document.getElementById('prestige-gain').textContent = prestigeGain;
    document.getElementById('prestige-multiplier').textContent = `×${multiplier.toFixed(1)}`;

    const btn = document.getElementById('prestige-btn');
    btn.disabled = prestigeGain === 0;
}

// === ACTIONS DU JOUEUR ===
function selectSlayer(id) {
    const slayer = gameState.slayers[id];
    const data = SLAYER_DATA[id];

    if (!slayer.unlocked) {
        if (gameState.souls >= data.unlockCost) {
            gameState.souls -= data.unlockCost;
            slayer.unlocked = true;
            slayer.level = 1;
            showNotification(`🎉 ${data.name} débloqué !`);
            createSlayersUI();
            createQuickSwitchUI();
        } else {
            showNotification(`❌ Besoin de ${data.unlockCost} âmes`);
        }
        return;
    }

    // Upgrade du slayer
    const cost = Math.floor(100 * Math.pow(1.5, slayer.level));
    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        slayer.level++;
        showNotification(`⬆️ ${data.name} niveau ${slayer.level}`);
        createSlayersUI();
    } else {
        showNotification(`❌ Besoin de ${cost} âmes`);
    }
}

function changeRealmSlayer(realmIndex) {
    // Cycle through unlocked slayers
    const unlockedSlayers = Object.keys(gameState.slayers).filter(id => gameState.slayers[id].unlocked);
    const currentIndex = unlockedSlayers.indexOf(gameState.realms[realmIndex].slayerId);
    const nextIndex = (currentIndex + 1) % unlockedSlayers.length;
    gameState.realms[realmIndex].slayerId = unlockedSlayers[nextIndex];
    createRealmsUI();
    initCanvases();
}

function switchAllRealms(slayerId) {
    gameState.activeSlayerId = slayerId;
    gameState.realms.forEach(realm => {
        realm.slayerId = slayerId;
    });
    createRealmsUI();
    createQuickSwitchUI();
    initCanvases();
}

function buyUpgrade(id) {
    const data = UPGRADE_DATA[id];
    const upgrade = gameState.upgrades[id];
    const cost = Math.floor(data.baseCost * Math.pow(data.costMultiplier, upgrade.level));

    if (gameState.souls >= cost) {
        gameState.souls -= cost;
        upgrade.level++;
        showNotification(`⬆️ ${data.name} niveau ${upgrade.level}`);
        createUpgradesUI();
    }
}

function buyPrestigeUpgrade(id, cost) {
    if (gameState.prestigePoints >= cost) {
        gameState.prestigePoints -= cost;
        gameState.prestigeUpgrades[id]++;
        showNotification(`⭐ Amélioration de prestige achetée !`);
        createPrestigeUpgradesUI();
    }
}

// === PRESTIGE ===
document.getElementById('prestige-btn')?.addEventListener('click', () => {
    const prestigeGain = Math.floor(Math.sqrt(gameState.totalSoulsEarned / CONFIG.PRESTIGE_BASE));

    if (prestigeGain === 0) {
        showNotification('❌ Pas assez d\'âmes pour prestige');
        return;
    }

    if (!confirm(`Réinitialiser pour gagner ${prestigeGain} points de prestige ?`)) {
        return;
    }

    // Reset
    gameState.souls = 0;
    gameState.totalSoulsEarned = 0;
    gameState.playerLevel = 1;
    gameState.prestigePoints += prestigeGain;

    // Reset slayers (sauf berserker)
    Object.keys(gameState.slayers).forEach(id => {
        if (id !== 'berserker') {
            gameState.slayers[id].unlocked = false;
            gameState.slayers[id].level = 0;
        } else {
            gameState.slayers[id].level = 1;
        }
    });

    // Reset upgrades
    Object.keys(gameState.upgrades).forEach(id => {
        gameState.upgrades[id].level = 0;
    });

    // Reset realms
    gameState.realms.forEach(realm => {
        realm.level = 1;
        realm.slayerId = 'berserker';
        realm.kills = 0;
    });

    gameState.activeSlayerId = 'berserker';

    showNotification(`🌟 Prestige ! +${prestigeGain} points`);

    createRealmsUI();
    createSlayersUI();
    createUpgradesUI();
    createPrestigeUpgradesUI();
    createQuickSwitchUI();
    initCanvases();
    saveGame();
});

// === NOTIFICATIONS ===
function showNotification(message) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    elements.notifications.appendChild(notif);

    setTimeout(() => {
        notif.remove();
    }, 3000);
}

// === SAUVEGARDE ===
function saveGame() {
    const saveData = {
        ...gameState,
        lastSaveTime: Date.now()
    };
    localStorage.setItem('idleRiftSlayers_save', JSON.stringify(saveData));
    console.log('💾 Sauvegardé');
}

function loadGame() {
    const saved = localStorage.getItem('idleRiftSlayers_save');
    if (!saved) return;

    try {
        const saveData = JSON.parse(saved);

        // Restaurer l'état
        Object.assign(gameState, saveData);

        // Progression offline
        const now = Date.now();
        const timeOffline = Math.min((now - saveData.lastSaveTime) / 1000, CONFIG.MAX_OFFLINE_TIME);
        const offlineEfficiency = CONFIG.OFFLINE_EFFICIENCY + (gameState.prestigeUpgrades.offlineBonus * 0.2);
        const offlineSouls = gameState.soulsPerSecond * timeOffline * offlineEfficiency;

        gameState.souls += offlineSouls;
        gameState.totalSoulsEarned += offlineSouls;

        if (offlineSouls > 0) {
            setTimeout(() => {
                showNotification(`⏰ Offline: +${Math.floor(offlineSouls).toLocaleString()} âmes !`);
            }, 1000);
        }

        console.log('📂 Chargé');
    } catch (e) {
        console.error('Erreur de chargement:', e);
    }
}

// === ÉVÉNEMENTS ===
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        saveGame();
    }
});

window.addEventListener('beforeunload', saveGame);
window.addEventListener('pagehide', saveGame);

// === PWA ===
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js');
}