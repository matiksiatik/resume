// ==========================================
//   ЛОГИКА ИГРЫ (полностью перенесена из исходного файла)
// ==========================================

// Глобальные переменные (будут доступны через window)
let currentLevelIdx = 0;
let bottles = [];
let selectedIdx = null;
let isWin = false;
let isAnimating = false;
let isTutorial = false;
let tutorialResolve = null;
let demoDropInterval = null;
const cappedBottles = new Set();
let timerInterval = null;
let timerSeconds = 0;
let pendingTimerStart = null;
let warningDigitInterval = null;
let hiddenDemoInterval = null;
let hiddenDemoRunning = false;
let levelHiddenIndices = [];
let bottleVisibility = [];
let frozenBottles = [];
let bigBottleIndex = -1;
let bigBottleMaxLayers = 4;
let bigBottleColor = null;

// Цвета
const COLORS = { 'R':'#e74c3c', 'G':'#2ecc71', 'B':'#3498db', 'Y':'#f1c40f', 'P':'#ff66b2', 'O':'#ff8c00', 'C':'#1abc9c', 'T':'#9b59b6', 'M':'#d500f9' };
const COLOR_KEYS = ['R','G','B','Y','P','O','C','T','M'];

// ===== ДАННЫЕ УРОВНЕЙ =====
const LEVEL_DATA = [
    [['R','G','B','R'], ['G','B','R','G'], ['B','R','G','B'], []],
    [['R','G','B','Y'], ['G','B','Y','R'], ['B','Y','R','G'], ['Y','R','G','B'], []],
    [['R','G','B','Y'], ['G','B','Y','P'], ['B','Y','P','R'], ['Y','P','R','G'], ['P','R','G','B'], []],
    [['R','G','B','Y'], ['G','B','Y','P'], ['B','Y','P','O'], ['Y','P','O','R'], ['P','O','R','G'], ['O','R','G','B'], []],
    [['R','G','B','Y'], ['G','B','Y','P'], ['B','Y','P','O'], ['Y','P','O','C'], ['P','O','C','R'], ['O','C','R','G'], ['C','R','G','B'], []],
    [['R','G','B','Y'], ['G','O','P','R'], ['B','Y','O','G'], ['Y','P','R','O'], ['P','B','Y','B'], ['O','R','G','P'], []],
    [['R','G','B','Y'], ['G','C','P','R'], ['B','Y','O','G'], ['Y','P','C','O'], ['P','O','R','C'], ['O','B','G','P'], ['C','R','Y','B'], []],
    [['P','G','B','R'], ['C','Y','O','G'], ['B','R','Y','P'], ['O','C','R','B'], ['G','P','C','Y'], ['R','O','G','C'], ['Y','B','P','O'], []],
    [['R','G','B','Y'], ['G','Y','R','B'], ['B','R','Y','G'], ['Y','B','G','R'], []],
    [['R','G','B','Y'], ['P','O','R','G'], ['Y','B','O','P'], ['G','P','Y','O'], ['B','R','G','B'], ['O','Y','P','R'], []],
    [['R','G','B','T'], ['Y','P','O','C'], ['G','C','Y','R'], ['B','T','P','G'], ['O','R','C','Y'], ['P','B','G','T'], ['C','Y','R','O'], []],
    [['R','G','B','T'], ['Y','P','O','C'], ['G','C','Y','R'], ['B','T','P','O'], ['C','R','O','G'], ['P','Y','T','B'], ['O','G','C','P'], ['T','B','R','Y'], []],
    [['R','G','B','Y'], ['P','O','R','G'], ['Y','B','P','O'], ['G','Y','B','R'], ['O','P','G','B'], ['R','Y','O','P'], []],
    [['R','G','B','T'], ['Y','P','O','C'], ['G','C','Y','R'], ['B','T','P','O'], ['C','R','O','G'], ['P','Y','T','B'], ['O','G','C','P'], ['T','B','R','Y'], [], []],
    [['R','G','B','Y'], ['P','O','C','T'], ['R','R','G','B'], ['Y','P','O','C'], ['T','R','R','G'], ['B','Y','P','O'], ['C','T','R','R'], ['G','B','Y','P'], ['O','C','T','R'], []],
    [['R','G','B'], ['Y','P','O'], ['C','T','M'], ['R','G','B'], ['Y','P','O'], ['C','T','M'], ['R','G','B'], ['Y','P','O'], ['C','T','M','R'], ['G','B','Y','P'], ['O','C','T','M'], []],
    [['R','G','B'], ['Y','P','O'], ['C','T','M'], ['R','G','B'], ['Y','P','O'], ['C','T','M'], ['R','G','B'], ['Y','P','O'], ['C','T','M','R'], ['G','B','Y','P'], ['O','C','T','M'], []],
    [['R','G','B','Y'], ['P','O','C','T'], ['M','R','G','B'], ['Y','P','O','C'], ['T','M','R','G'], ['B','Y','P','O'], ['C','T','M','R'], ['G','B','Y','P'], ['O','C','T','M'], ['R','G','B','Y'], ['P','O','C','T'], ['M','R','G','B'], ['Y','P','O','C'], []],
    [['R','G','B','Y'], ['P','O','C','T'], ['M','R','G','B'], ['Y','P','O','C'], ['T','M','R','G'], ['B','Y','P','O'], ['C','T','M','R'], ['G','B','Y','P'], ['O','C','T','M'], ['R','G','B','Y'], ['P','O','C','T'], ['M','R','G','B'], ['Y','P','O','C'], ['T','M','R','G'], ['B','Y','P','O'], []],
    (function() {
        const colors = ['R','G','B','Y','P','O','C','T'];
        let counts = {}; colors.forEach(c => counts[c] = 10); counts['T'] = 9;
        let pool = []; for (let c in counts) { for (let i = 0; i < counts[c]; i++) pool.push(c); }
        function seededShuffle(arr, seed) {
            let m = arr.length; while (m) {
                seed = (seed * 9301 + 49297) % 233280;
                const i = Math.floor(seed / 233280 * m); m--;
                [arr[m], arr[i]] = [arr[i], arr[m]];
            } return arr;
        }
        seededShuffle(pool, 12345);
        let bottles = []; let idx = 0;
        for (let i = 0; i < 19; i++) { bottles.push(pool.slice(idx, idx+4)); idx += 4; }
        bottles.push(pool.slice(idx, idx+3)); return bottles;
    })(),
    (function() {
        const colors = ['R','G','B','Y','P','O','C','T'];
        let counts = {}; colors.forEach(c => counts[c] = 10); counts['R'] = 9;
        let pool = []; for (let c in counts) { for (let i = 0; i < counts[c]; i++) pool.push(c); }
        function seededShuffle(arr, seed) {
            let m = arr.length; while (m) {
                seed = (seed * 9301 + 49297) % 233280;
                const i = Math.floor(seed / 233280 * m); m--;
                [arr[m], arr[i]] = [arr[i], arr[m]];
            } return arr;
        }
        seededShuffle(pool, 67890);
        let bottles = []; let idx = 0;
        for (let i = 0; i < 19; i++) { bottles.push(pool.slice(idx, idx+4)); idx += 4; }
        bottles.push(pool.slice(idx, idx+3)); return bottles;
    })(),
    [['R','G','B','Y'], ['P','O','C','R'], ['G','B','Y','P'], ['O','C','R','G'], ['B','Y','P','O'], ['C','R','G','B'], ['Y','P','O','C'], []],
    (function() {
        const result = generateLevel(9, 3, [], 1);
        return result.bottles;
    })(),
    (function() {
        const result = generateLevel(13, 5, [3,3,3,3], 0);
        return result.bottles;
    })(),
    (function() {
        const result = generateLevel(15, 7, [3,3,2], 0);
        return result.bottles;
    })(),
    (function() {
        const result = generateLevel(12, 0, [], 1);
        return result.bottles;
    })(),
    (function() {
        const result = generateLevel(20, 7, [3,3,3,2,2,2], 0);
        return result.bottles;
    })(),
    (function() {
        const LEVEL28 = [
            ['P','R','G','B'],
            ['P','Y','O','R'],
            ['P','O','G','Y'],
            [], 
            ['O','B','Y','G'],
            ['O','R','B','P'],
            ['R','G','B','Y'],
            []               
        ];
        return LEVEL28;
    })(),
    (function() {
        const result = generateLevel(13, 0, [], 1, ['R','G','B','Y']);
        const bottles = result.bottles;
        bottles.push(['R','G','B','Y']);
        bottles.push(['R','G','B','Y']);
        return bottles;
    })(),
    (function() {
        const result = generateLevel(13, 3, [], 2, ['R','G','B','Y','P']);
        let bottles = result.bottles;
        bottles[0] = bottles[0].slice(0,2);
        bottles[1] = bottles[1].slice(0,2);
        bottles.push(['R','G','B','Y']);
        bottles.push(['R','G','B','Y']);
        return bottles;
    })(),
    (function() {
        const result = generateLevel(15, 5, [], 2, ['R','G','B','Y','P','O']);
        let bottles = result.bottles;
        bottles[0] = bottles[0].slice(0,2);
        bottles[1] = bottles[1].slice(0,2);
        bottles.push(['R','G','B','Y']);
        bottles.push(['R','G','B','Y']);
        bottles.push(['R','G','B','Y']);
        return bottles;
    })(),
    (function() {
        const result = generateLevel(15, 0, [], 1, ['R','G','B','Y','P','O']);
        let bottles = result.bottles;
        for (let i = 0; i < 5; i++) {
            bottles.push(['R','G','B','Y']);
        }
        return bottles;
    })(),
    [
        ['R'],
        ['G','G','R'],
        ['B','B','B','P'],
        ['Y','Y','Y','R'],
        ['P','P','P','B'],
        ['R'],
        [],
        [],
        [],
        ['R','R','R','Y'],
        ['R','G','R'],
        ['R'],
        [],
        ['R'],
        ['R'],
        ['R'],
        ['R','G','R'],
        [],
        ['R'],
        ['R'],
        ['R'],
        ['R'],
        [],
        [],
        ['R']
    ]
];

const totalLevels = LEVEL_DATA.length;

// Таймеры
const timerMap = {
    8: 90, 9: 90, 12: 70, 13: 60, 16: 80, 17: 75, 20: 90, 24: 90,
    28: 80, 30: 70, 31: 80
};

// Индексы скрытых слоёв
levelHiddenIndices[21] = [0,1,2,3,4,5,6];
levelHiddenIndices[22] = (function() { const r = generateLevel(9,3,[],1); return r.hiddenIndices; })();
levelHiddenIndices[23] = (function() { const r = generateLevel(13,5,[3,3,3,3],0); return r.hiddenIndices; })();
levelHiddenIndices[24] = (function() { const r = generateLevel(15,7,[3,3,2],0); return r.hiddenIndices; })();
levelHiddenIndices[25] = (function() { const r = generateLevel(12,0,[],1); return r.hiddenIndices; })();
levelHiddenIndices[26] = (function() { const r = generateLevel(20,7,[3,3,3,2,2,2],0); return r.hiddenIndices; })();
levelHiddenIndices[27] = [];
levelHiddenIndices[28] = [];
levelHiddenIndices[29] = [];
levelHiddenIndices[30] = (function() { const r = generateLevel(13,3,[],2,['R','G','B','Y','P']); return r.hiddenIndices; })();
levelHiddenIndices[31] = (function() { const r = generateLevel(15,5,[],2,['R','G','B','Y','P','O']); return r.hiddenIndices; })();
levelHiddenIndices[32] = (function() { const r = generateLevel(15,0,[],1,['R','G','B','Y','P','O']); return r.hiddenIndices; })();
levelHiddenIndices[33] = [];

// Конфигурация замороженных бутылок
const frozenConfig = {
    28: [{index: 6, required: 1}],
    29: [{index: 14, required: 2}, {index: 15, required: 2}],
    30: [{index: 15, required: 1}, {index: 16, required: 2}],
    31: [{index: 17, required: 1}, {index: 18, required: 2}, {index: 19, required: 2}]
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function hasAvailableMovesForBottles(bottles) {
    for (let i = 0; i < bottles.length; i++) {
        const src = bottles[i];
        if (src.length === 0) continue;
        if (i === bigBottleIndex) continue;
        const topColor = src[src.length - 1];
        for (let j = 0; j < bottles.length; j++) {
            if (i === j) continue;
            const dst = bottles[j];
            const maxLayers = (j === bigBottleIndex) ? bigBottleMaxLayers : 4;
            if (dst.length >= maxLayers) continue;
            if (dst.length === 0 || dst[dst.length - 1] === topColor) {
                return true;
            }
        }
    }
    return false;
}

function generateLevel(totalBottles, hiddenCount, partialLengths, emptyCount, colorSet = COLOR_KEYS, maxAttempts = 100) {
    const fullBottles = totalBottles - emptyCount - partialLengths.length;
    let attempts = 0;
    while (attempts < maxAttempts) {
        attempts++;
        let bottles = [];
        for (let i = 0; i < fullBottles; i++) {
            let bottle = [];
            for (let j = 0; j < 4; j++) {
                bottle.push(colorSet[Math.floor(Math.random() * colorSet.length)]);
            }
            bottles.push(bottle);
        }
        for (let len of partialLengths) {
            let bottle = [];
            for (let j = 0; j < len; j++) {
                bottle.push(colorSet[Math.floor(Math.random() * colorSet.length)]);
            }
            bottles.push(bottle);
        }
        for (let i = 0; i < emptyCount; i++) {
            bottles.push([]);
        }
        let hiddenIndices = [];
        if (hiddenCount > 0) {
            let pool = Array.from({length: fullBottles}, (_,i) => i);
            for (let i = pool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i+1));
                [pool[i], pool[j]] = [pool[j], pool[i]];
            }
            hiddenIndices = pool.slice(0, hiddenCount);
        }
        if (hasAvailableMovesForBottles(bottles)) {
            return { bottles, hiddenIndices };
        }
    }
    return { bottles: generateFallback(totalBottles, hiddenCount, partialLengths, emptyCount), hiddenIndices: [] };
}

function generateFallback(totalBottles, hiddenCount, partialLengths, emptyCount) {
    const fallback = [
        ['R','G','B','Y'],
        ['P','O','C','R'],
        ['G','B','Y','P'],
        ['O','C','R','G'],
        ['B','Y','P','O'],
        ['C','R','G','B'],
        ['Y','P','O','C'],
        []
    ];
    while (fallback.length < totalBottles) {
        fallback.push(['R','G','B','Y']);
    }
    return fallback.slice(0, totalBottles);
}

// ===== ФУНКЦИИ ТАЙМЕРА =====
function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) timerDisplay.style.display = 'none';
    const timerIcon = document.getElementById('timer-icon');
    if (timerIcon) timerIcon.style.animationPlayState = 'paused';
}

function updateTimerDisplay() {
    const mins = Math.floor(Math.max(0, timerSeconds) / 60);
    const secs = Math.floor(Math.max(0, timerSeconds) % 60);
    const timerText = document.getElementById('timer-text');
    if (timerText) {
        timerText.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        if (timerSeconds <= 10) {
            timerText.style.color = '#ff6666';
            timerText.style.textShadow = '0 0 10px #ff0000';
        } else if (timerSeconds <= 30) {
            timerText.style.color = '#ffaa00';
            timerText.style.textShadow = '0 0 8px #ffaa00';
        } else {
            timerText.style.color = '#fff';
            timerText.style.textShadow = '0 0 8px #00d2ff';
        }
    }
}

function startTimer(seconds) {
    stopTimer();
    timerSeconds = seconds;
    const timerDisplay = document.getElementById('timer-display');
    if (timerDisplay) {
        timerDisplay.style.display = 'inline-flex';
        const timerIcon = document.getElementById('timer-icon');
        if (timerIcon) timerIcon.style.animationPlayState = 'running';
    }
    updateTimerDisplay();
    timerInterval = setInterval(() => {
        timerSeconds--;
        updateTimerDisplay();
        if (timerSeconds <= 0) {
            clearInterval(timerInterval);
            timerInterval = null;
            const timerIcon = document.getElementById('timer-icon');
            if (timerIcon) timerIcon.style.animationPlayState = 'paused';
            timeUp();
        }
    }, 1000);
}

function timeUp() {
    isAnimating = true;
    stopTimer();
    const timeoutModal = document.getElementById('timeout-modal');
    if (timeoutModal) timeoutModal.style.display = 'flex';
}

// ===== ФУНКЦИИ ДЛЯ БОЛЬШОЙ БУТЫЛКИ =====
function getMaxLayers(index) {
    if (index === bigBottleIndex) return bigBottleMaxLayers;
    return 4;
}

function getLayerPercent(index) {
    if (index === bigBottleIndex) return 5;
    return 25;
}

function isBigBottle(index) {
    return index === bigBottleIndex;
}

// ===== ОБРАБОТКА ЗАВЕРШЕНИЯ БУТЫЛКИ (для замороженных) =====
function onBottleCompleted(index) {
    const frozen = frozenBottles.find(f => f.index === index);
    if (frozen && !frozen.unlocked) return;

    let anyUnlocked = false;
    for (let f of frozenBottles) {
        if (f.unlocked) continue;
        f.progress++;
        const bottleEl = document.querySelectorAll('.bottle')[f.index];
        if (bottleEl) {
            const counter = bottleEl.querySelector('.counter');
            if (counter) {
                counter.textContent = `${f.progress}/${f.required}`;
            }
        }
        if (f.progress >= f.required) {
            unlockFrozenBottle(f.index);
            anyUnlocked = true;
        }
    }
}

function unlockFrozenBottle(index) {
    const frozen = frozenBottles.find(f => f.index === index);
    if (!frozen || frozen.unlocked || frozen.animating) return;
    frozen.animating = true;
    isAnimating = true;

    const bottleEl = document.querySelectorAll('.bottle')[index];
    if (!bottleEl) return;

    const overlay = bottleEl.querySelector('.locked-overlay');
    if (!overlay) return;

    const frostText = overlay.querySelector('.frost-text');
    const counter = overlay.querySelector('.counter');
    if (frostText) frostText.classList.add('fade-out');
    if (counter) counter.classList.add('fade-out');

    setTimeout(() => {
        const iceSvg = overlay.querySelector('.ice-cube');
        if (!iceSvg) {
            overlay.remove();
            frozen.unlocked = true;
            frozen.animating = false;
            isAnimating = false;
            render();
            return;
        }

        const iciclesGroup = iceSvg.querySelector('g:last-of-type');
        let iciclePaths = [];
        if (iciclesGroup) {
            iciclesGroup.querySelectorAll('path').forEach(path => {
                iciclePaths.push(path.getAttribute('d'));
            });
        }

        iceSvg.remove();

        const fragmentContainer = document.createElement('div');
        fragmentContainer.style.position = 'absolute';
        fragmentContainer.style.top = '0';
        fragmentContainer.style.left = '0';
        fragmentContainer.style.width = '100%';
        fragmentContainer.style.height = '100%';
        fragmentContainer.style.pointerEvents = 'none';
        fragmentContainer.style.zIndex = '20';
        overlay.appendChild(fragmentContainer);

        const fragments = [
            { clip: 'inset(0 50% 50% 0)', anim: 'fragmentFly1 0.8s ease-out forwards' },
            { clip: 'inset(0 0 50% 50%)', anim: 'fragmentFly2 0.8s ease-out forwards' },
            { clip: 'inset(50% 50% 0 0)', anim: 'fragmentFly3 0.8s ease-out forwards' },
            { clip: 'inset(50% 0 0 50%)', anim: 'fragmentFly4 0.8s ease-out forwards' }
        ];

        fragments.forEach((frag) => {
            const div = document.createElement('div');
            div.className = 'ice-fragment';
            div.style.clipPath = frag.clip;
            div.style.animation = frag.anim;
            const cloneSvg = iceSvg.cloneNode(true);
            const cloneIcicles = cloneSvg.querySelector('g:last-of-type');
            if (cloneIcicles) cloneIcicles.remove();
            div.appendChild(cloneSvg);
            fragmentContainer.appendChild(div);
        });

        let icicleContainer = null;
        if (iciclePaths.length > 0) {
            icicleContainer = document.createElement('div');
            icicleContainer.style.position = 'absolute';
            icicleContainer.style.top = '0';
            icicleContainer.style.left = '0';
            icicleContainer.style.width = '100%';
            icicleContainer.style.height = '100%';
            icicleContainer.style.pointerEvents = 'none';
            icicleContainer.style.zIndex = '22';
            overlay.appendChild(icicleContainer);

            const fallAnimations = ['icicleFall1', 'icicleFall2', 'icicleFall3', 'icicleFall4', 'icicleFall5'];
            iciclePaths.forEach((d, i) => {
                const div = document.createElement('div');
                div.className = 'icicle';
                const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svg.setAttribute('viewBox', '0 0 100 180');
                svg.setAttribute('preserveAspectRatio', 'none');
                svg.style.width = '100%';
                svg.style.height = '100%';
                const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
                path.setAttribute('d', d);
                path.setAttribute('fill', '#aee6ff');
                path.setAttribute('stroke', '#ffffff');
                path.setAttribute('stroke-width', '1.5');
                svg.appendChild(path);
                div.appendChild(svg);
                const animIndex = i % fallAnimations.length;
                div.style.animation = `${fallAnimations[animIndex]} 0.9s ease-out ${i * 0.1}s forwards`;
                div.style.transformOrigin = 'bottom center';
                icicleContainer.appendChild(div);
            });
        }

        const particleCount = 40;
        const particleContainer = document.createElement('div');
        particleContainer.style.position = 'absolute';
        particleContainer.style.top = '0';
        particleContainer.style.left = '0';
        particleContainer.style.width = '100%';
        particleContainer.style.height = '100%';
        particleContainer.style.pointerEvents = 'none';
        particleContainer.style.zIndex = '25';
        overlay.appendChild(particleContainer);

        for (let i = 0; i < particleCount; i++) {
            const p = document.createElement('div');
            p.className = 'ice-particle';
            const size = 3 + Math.random() * 6;
            p.style.width = size + 'px';
            p.style.height = size + 'px';
            p.style.left = (Math.random() * 90 + 5) + '%';
            p.style.top = (Math.random() * 80 + 10) + '%';
            const angle = Math.random() * 2 * Math.PI;
            const distance = 40 + Math.random() * 80;
            const dx = Math.cos(angle) * distance;
            const dy = Math.sin(angle) * distance - 20;
            const duration = 0.6 + Math.random() * 0.5;
            p.style.animation = `particleFly ${duration}s ease-out ${Math.random() * 0.2}s forwards`;
            p.style.setProperty('--dx', dx + 'px');
            p.style.setProperty('--dy', dy + 'px');
            particleContainer.appendChild(p);
        }

        setTimeout(() => {
            overlay.remove();
            bottleEl.classList.remove('locked-bottle');
            frozen.unlocked = true;
            frozen.animating = false;
            isAnimating = false;
            render();
        }, 1200);
    }, 400);
}

// ===== ЗАГРУЗКА УРОВНЯ =====
function loadLevel(index) {
    stopTimer();
    const timeoutModal = document.getElementById('timeout-modal');
    if (timeoutModal) timeoutModal.style.display = 'none';
    const noMovesModal = document.getElementById('no-moves-modal');
    if (noMovesModal) noMovesModal.style.display = 'none';
    const timerWarningModal = document.getElementById('timer-warning-modal');
    if (timerWarningModal) timerWarningModal.style.display = 'none';
    const hiddenWarningModal = document.getElementById('hidden-warning-modal');
    if (hiddenWarningModal) hiddenWarningModal.style.display = 'none';
    const frozenWarningModal = document.getElementById('frozen-warning-modal');
    if (frozenWarningModal) frozenWarningModal.style.display = 'none';
    stopFrozenDemo();
    if (warningDigitInterval) { clearInterval(warningDigitInterval); warningDigitInterval = null; }
    if (hiddenDemoInterval) { clearInterval(hiddenDemoInterval); hiddenDemoInterval = null; }
    hiddenDemoRunning = false;
    pendingTimerStart = null;
    currentLevelIdx = index;
    bottles = LEVEL_DATA[index].map(b => [...b]);
    selectedIdx = null; isWin = false; isAnimating = false;
    const modal = document.getElementById('win-modal');
    if (modal) modal.style.display = 'none';
    const levelNum = document.getElementById('level-num');
    if (levelNum) levelNum.innerText = index + 1;
    cappedBottles.clear();
    bottleVisibility = [];

    frozenBottles = [];
    const config = frozenConfig[index];
    if (config) {
        for (let c of config) {
            frozenBottles.push({
                index: c.index,
                required: c.required,
                progress: 0,
                unlocked: false,
                animating: false
            });
        }
    }

    if (index === 32) {
        bigBottleIndex = 0;
        bigBottleMaxLayers = 20;
        bigBottleColor = 'R';
    } else {
        bigBottleIndex = -1;
        bigBottleMaxLayers = 4;
        bigBottleColor = null;
    }

    const hiddenIndices = levelHiddenIndices[index] || [];
    bottles.forEach((b, idx) => {
        const vis = new Array(b.length).fill(true);
        if (hiddenIndices.includes(idx)) {
            for (let i = 0; i < b.length - 1; i++) { vis[i] = false; }
        }
        bottleVisibility.push(vis);
    });

    if (index in timerMap) {
        if (index === 8) {
            showTimerWarning(timerMap[index], (seconds) => { startTimer(seconds); });
            const timerDisplay = document.getElementById('timer-display');
            if (timerDisplay) timerDisplay.style.display = 'none';
        } else {
            startTimer(timerMap[index]);
        }
    } else {
        const timerDisplay = document.getElementById('timer-display');
        if (timerDisplay) timerDisplay.style.display = 'none';
    }

    if (index === 21) { showHiddenWarning(() => {}); }

    if (index === 27) { 
        showFrozenWarning(() => {
            render();
        });
    } else {
        if (index === 0) {
            isTutorial = true;
            const tutUI = document.getElementById('tutorial-ui');
            if (tutUI) tutUI.style.display = 'block';
        } else {
            isTutorial = false;
            const tutUI = document.getElementById('tutorial-ui');
            if (tutUI) tutUI.style.display = 'none';
        }
        render();
        if (isTutorial) { setTimeout(() => runTutorial(), 100); }
    }
}

// ===== ОТРИСОВКА =====
function render() {
    const gameBoard = document.getElementById('game-board');
    if (!gameBoard) return;
    gameBoard.innerHTML = '';

    // Классы размера
    if ((currentLevelIdx >= 18 && currentLevelIdx <= 20) || currentLevelIdx === 26 || currentLevelIdx === 30 || currentLevelIdx === 31) {
        gameBoard.classList.add('small-bottles');
    } else {
        gameBoard.classList.remove('small-bottles');
    }

    if (currentLevelIdx === 32) {
        gameBoard.classList.add('big-bottle-level');
        const leftGroup = document.createElement('div');
        leftGroup.className = 'bottle-group small-bottles';
        const centerGroup = document.createElement('div');
        centerGroup.className = 'center-group';
        const rightGroup = document.createElement('div');
        rightGroup.className = 'bottle-group small-bottles';

        const totalBottles = bottles.length;
        const half = Math.floor((totalBottles - 1) / 2);
        let leftBottles = [];
        let rightBottles = [];
        for (let i = 1; i < totalBottles; i++) {
            if (i <= half) leftBottles.push(i);
            else rightBottles.push(i);
        }

        const createBottleElement = (idx, group) => {
            const bottleColors = bottles[idx];
            const bottleEl = document.createElement('div');
            bottleEl.className = 'bottle';
            if (selectedIdx === idx) bottleEl.classList.add('selected');
            bottleEl.dataset.index = idx;

            if (isBigBottle(idx)) {
                bottleEl.classList.add('big-bottle');
            }

            const frozen = frozenBottles.find(f => f.index === idx && !f.unlocked);

            if (frozen) {
                buildFrozenBottle(bottleEl, bottleColors, frozen);
            } else {
                buildNormalBottle(bottleEl, bottleColors, idx);
            }

            bottleEl.addEventListener('click', () => handleBottleClick(parseInt(bottleEl.dataset.index)));
            bottleEl.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleBottleClick(parseInt(bottleEl.dataset.index));
            }, { passive: false });

            group.appendChild(bottleEl);
        };

        createBottleElement(0, centerGroup);
        leftBottles.forEach(idx => createBottleElement(idx, leftGroup));
        rightBottles.forEach(idx => createBottleElement(idx, rightGroup));

        gameBoard.appendChild(leftGroup);
        gameBoard.appendChild(centerGroup);
        gameBoard.appendChild(rightGroup);
        return;
    } else {
        gameBoard.classList.remove('big-bottle-level');
    }

    // Стандартный render
    bottles.forEach((bottleColors, idx) => {
        const bottleEl = document.createElement('div');
        bottleEl.className = 'bottle';
        if (selectedIdx === idx) bottleEl.classList.add('selected');
        bottleEl.dataset.index = idx;

        if (isBigBottle(idx)) {
            bottleEl.classList.add('big-bottle');
        }

        const frozen = frozenBottles.find(f => f.index === idx && !f.unlocked);

        if (frozen) {
            buildFrozenBottle(bottleEl, bottleColors, frozen);
        } else {
            buildNormalBottle(bottleEl, bottleColors, idx);
        }

        bottleEl.addEventListener('click', () => handleBottleClick(parseInt(bottleEl.dataset.index)));
        bottleEl.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleBottleClick(parseInt(bottleEl.dataset.index));
        }, { passive: false });

        gameBoard.appendChild(bottleEl);
    });
}

function buildNormalBottle(bottleEl, bottleColors, idx) {
    const container = document.createElement('div');
    container.className = 'bottle-body-container';
    bottleEl.appendChild(container);
    const wrapper = document.createElement('div');
    wrapper.className = 'liquid-wrapper';
    container.appendChild(wrapper);

    const layerPercent = getLayerPercent(idx);
    for (let i = 0; i < bottleColors.length; i++) {
        const liquid = document.createElement('div');
        liquid.className = 'liquid';
        if (bottleVisibility[idx] && !bottleVisibility[idx][i]) {
            liquid.classList.add('hidden');
        } else {
            liquid.style.backgroundColor = COLORS[bottleColors[i]];
        }
        liquid.style.bottom = (i * layerPercent) + '%';
        wrapper.appendChild(liquid);
    }

    if (cappedBottles.has(idx) && !isBigBottle(idx)) {
        const cap = document.createElement('div');
        cap.className = 'cap capped';
        bottleEl.appendChild(cap);
    }
}

function buildFrozenBottle(bottleEl, bottleColors, frozen) {
    bottleEl.classList.add('locked-bottle');
    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';

    const bottleInside = document.createElement('div');
    bottleInside.className = 'bottle-inside';

    const bottleBody = document.createElement('div');
    bottleBody.className = 'bottle-body';

    const wrapper = document.createElement('div');
    wrapper.className = 'liquid-wrapper';
    for (let i = 0; i < bottleColors.length; i++) {
        const liquid = document.createElement('div');
        liquid.className = 'liquid';
        liquid.style.backgroundColor = COLORS[bottleColors[i]];
        liquid.style.bottom = (i * 25) + '%';
        wrapper.appendChild(liquid);
    }
    bottleBody.appendChild(wrapper);
    const shine = document.createElement('div');
    shine.className = 'bottle-shine';
    bottleBody.appendChild(shine);
    bottleInside.appendChild(bottleBody);

    const contourSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    contourSvg.setAttribute('width', '100%');
    contourSvg.setAttribute('height', '100%');
    contourSvg.setAttribute('viewBox', '0 0 60 130');
    contourSvg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:4;';
    const contourPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    contourPath.setAttribute('d', 'M 16.8 6.5 L 43.2 6.5 L 43.2 32.5 C 51 32.5, 60 54.6, 60 84.5 L 60 117 C 60 130, 57 130, 51 130 L 9 130 C 3 130, 0 130, 0 117 L 0 84.5 C 0 54.6, 9 32.5, 16.8 32.5 Z');
    contourPath.setAttribute('fill', 'none');
    contourPath.setAttribute('stroke', '#ffffff');
    contourPath.setAttribute('stroke-width', '2');
    contourPath.setAttribute('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.8))');
    contourSvg.appendChild(contourPath);
    bottleInside.appendChild(contourSvg);

    overlay.appendChild(bottleInside);

    // Ледяной блок (SVG)
    const iceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iceSvg.setAttribute('class', 'ice-cube');
    iceSvg.setAttribute('viewBox', '0 0 100 180');
    iceSvg.setAttribute('preserveAspectRatio', 'none');
    iceSvg.innerHTML = `
        <defs>
            <radialGradient id="cubeGradient" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                <stop offset="0%" stop-color="#1c8fc3" />
                <stop offset="40%" stop-color="#147bb3" />
                <stop offset="100%" stop-color="#2ea3d9" />
            </radialGradient>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="url(#cubeGradient)" opacity="0.5" />
        <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
        <g>
            <path d="M 10 25 C 15 10, 25 12, 35 18 C 45 10, 55 10, 65 18 C 75 12, 85 15, 90 25 L 90 32 C 82 28, 70 35, 60 28 C 50 35, 40 28, 30 35 C 20 28, 12 32, 8 32 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1"/>
            <path d="M 20 25 C 25 18, 35 20, 45 25 C 35 28, 25 25, 20 25 Z" fill="#aaddff" opacity="0.6"/>
            <path d="M 60 25 C 65 18, 75 20, 80 25 C 70 28, 60 25, 60 25 Z" fill="#88ccff" opacity="0.5"/>
            <path d="M 40 20 C 45 15, 55 15, 60 20 C 50 22, 40 20, 40 20 Z" fill="#ffffff" opacity="0.8"/>
        </g>
        <g>
            <path d="M 10 156 L 15 175 L 20 156 L 25 180 L 30 156 L 38 170 L 45 156 L 52 182 L 60 156 L 68 172 L 75 156 L 82 180 L 88 156 Z" fill="#aee6ff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M 15 156 L 18 165 L 25 156 Z" fill="#7bc4e8" opacity="0.6"/>
            <path d="M 45 156 L 48 168 L 55 156 Z" fill="#7bc4e8" opacity="0.6"/>
            <path d="M 75 156 L 78 168 L 85 156 Z" fill="#7bc4e8" opacity="0.6"/>
        </g>
        <g>
            <path d="M 25 40 L 40 40 L 55 100 L 40 140 L 25 140 Z" fill="url(#shineGradient)" />
            <ellipse cx="45" cy="50" rx="12" ry="20" fill="#ffffff" opacity="0.15" transform="rotate(-15 45 50)" filter="blur(2px)"/>
            <path d="M 85 40 L 91 40 L 91 140 L 85 140 Z" fill="#0b4b73" opacity="0.25" />
            <path d="M 7 40 L 10 40 L 10 140 L 7 140 Z" fill="#0b4b73" opacity="0.3" />
        </g>
        <g fill="none" stroke="#ffffff" stroke-linejoin="round">
            <path d="M 90 60 L 70 70 L 65 85" stroke-width="1.5" opacity="0.3"/>
            <path d="M 8 100 L 25 110 L 30 125" stroke-width="1.5" opacity="0.25"/>
            <path d="M 10 130 L 25 145 L 40 140" stroke-width="2" opacity="0.4"/>
            <path d="M 85 90 L 60 100 L 55 115" stroke-width="1.5" opacity="0.35"/>
            <path d="M 25 45 L 40 65 L 35 85 L 50 110" stroke-width="2" opacity="0.8"/>
            <path d="M 70 35 L 55 60 L 65 80 L 50 100 L 55 125" stroke-width="1.8" opacity="0.7"/>
            <path d="M 35 135 L 50 145 L 65 140" stroke-width="1.5" opacity="0.6"/>
            <path d="M 75 85 L 60 95 L 65 110" stroke-width="1.5" opacity="0.5"/>
            <path d="M 40 65 L 55 70 L 50 85" stroke-width="1" opacity="0.5"/>
            <path d="M 65 60 L 75 70 L 70 85" stroke-width="1" opacity="0.4"/>
            <path d="M 30 100 L 40 95 L 45 85" stroke-width="1" opacity="0.6"/>
            <path d="M 25 60 L 30 70 L 20 75" stroke-width="1" opacity="0.35"/>
        </g>
        <g fill="#ffffff" opacity="0.4">
            <circle cx="20" cy="50" r="1.5" />
            <circle cx="75" cy="45" r="1" />
            <circle cx="30" cy="100" r="1.8" />
            <circle cx="80" cy="110" r="1.2" />
            <circle cx="50" cy="135" r="1" />
            <circle cx="15" cy="90" r="1.5" />
            <circle cx="70" cy="130" r="1" />
        </g>
    `;
    overlay.appendChild(iceSvg);

    const frostText = document.createElement('div');
    frostText.className = 'frost-text';
    frostText.textContent = '❄️';
    overlay.appendChild(frostText);

    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = `${frozen.progress}/${frozen.required}`;
    overlay.appendChild(counter);

    bottleEl.appendChild(overlay);
}

// ===== ОБРАБОТКА КЛИКА ПО БУТЫЛКЕ =====
function handleBottleClick(index) {
    if (isTutorial) { if (tutorialResolve) { tutorialResolve(index); } return; }
    const frozen = frozenBottles.find(f => f.index === index && !f.unlocked);
    if (frozen) return;
    if (isWin || isAnimating) return;
    if (selectedIdx === index) { selectedIdx = null; render(); return; }
    if (selectedIdx !== null && bottles[selectedIdx].length > 0) {
        animatePour(selectedIdx, index);
        selectedIdx = null; return;
    }
    if (isBigBottle(index)) return;
    if (cappedBottles.has(index)) return;
    if (bottles[index].length > 0) { selectedIdx = index; render(); }
}

function updateBottleDOM(el, data, visibility) {
    const wrapper = el.querySelector('.liquid-wrapper');
    if (!wrapper) return;
    wrapper.innerHTML = '';
    const idx = parseInt(el.dataset.index);
    const layerPercent = getLayerPercent(idx);
    for (let i = 0; i < data.length; i++) {
        const liquid = document.createElement('div');
        liquid.className = 'liquid';
        if (visibility && !visibility[i]) { liquid.classList.add('hidden'); }
        else { liquid.style.backgroundColor = COLORS[data[i]]; }
        liquid.style.bottom = (i * layerPercent) + '%';
        wrapper.appendChild(liquid);
    }
}

function spawnParticles(bottleEl) {
    const rect = bottleEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height * 0.2;
    const particleCount = 20;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const angle = (i / particleCount) * Math.PI * 2 + Math.random() * 0.8;
        const distance = 30 + Math.random() * 35;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 15;
        const size = 4 + Math.random() * 6;
        const hue = 40 + Math.random() * 20;
        const color = `hsl(${hue}, 100%, 65%)`;
        particle.style.cssText = `
            left: ${centerX}px; top: ${centerY}px; width: ${size}px; height: ${size}px;
            background: ${color}; --dx: ${dx}px; --dy: ${dy}px;
        `;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 700);
    }
}

async function animateCapClosing(index) {
    if (isBigBottle(index)) return;
    const bottleEl = document.querySelectorAll('.bottle')[index];
    if (!bottleEl || cappedBottles.has(index)) return;
    isAnimating = true;
    const oldCap = bottleEl.querySelector('.cap');
    if (oldCap) oldCap.remove();
    const cap = document.createElement('div');
    cap.className = 'cap closing';
    bottleEl.appendChild(cap);
    playCapSound();
    spawnParticles(bottleEl);
    await sleep(500);
    cap.classList.remove('closing');
    cap.classList.add('capped');
    cappedBottles.add(index);
    onBottleCompleted(index);
    isAnimating = false;
}

async function animatePour(fromIdx, toIdx) {
    const srcData = bottles[fromIdx], dstData = bottles[toIdx];
    if (srcData.length === 0) return;
    const maxLayers = getMaxLayers(toIdx);
    if (dstData.length >= maxLayers) return;
    const srcTopColor = srcData[srcData.length - 1];
    if (dstData.length > 0 && dstData[dstData.length - 1] !== srcTopColor) return;
    let countToMove = 0;
    for (let i = srcData.length - 1; i >= 0; i--) { if (srcData[i] === srcTopColor) countToMove++; else break; }
    const actualMove = Math.min(countToMove, maxLayers - dstData.length);
    if (actualMove === 0) return;

    playPourSound(); isAnimating = true;
    const bottleEls = document.querySelectorAll('.bottle');
    const srcEl = bottleEls[fromIdx], dstEl = bottleEls[toIdx];
    srcEl.classList.remove('selected'); srcEl.classList.add('pouring'); dstEl.classList.add('receiving');
    await sleep(250);
    srcEl.style.opacity = '0';
    await sleep(150);
    const dstRect = dstEl.getBoundingClientRect(), srcRect = srcEl.getBoundingClientRect();
    const clone = srcEl.cloneNode(true);
    clone.classList.remove('pouring', 'selected');
    if ((currentLevelIdx >= 18 && currentLevelIdx <= 20) || currentLevelIdx === 26 || currentLevelIdx === 30 || currentLevelIdx === 31 || currentLevelIdx === 32) {
        const srcStyle = getComputedStyle(srcEl);
        clone.style.width = srcStyle.width; clone.style.height = srcStyle.height;
    }
    clone.style.position = 'fixed';
    clone.style.left = (dstRect.left + (dstRect.width - srcRect.width) / 2) + 'px';
    clone.style.top = (dstRect.top - srcRect.height - 10) + 'px';
    clone.style.transform = 'rotate(180deg) scale(0.9)';
    clone.style.transformOrigin = 'center center';
    clone.style.opacity = '0';
    clone.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
    clone.style.zIndex = '1000';
    clone.style.pointerEvents = 'none';
    document.body.appendChild(clone);
    clone.offsetHeight;
    clone.style.opacity = '1';
    clone.style.transform = 'rotate(180deg) scale(1.15)';
    await sleep(200);

    const cloneRect = clone.querySelector('.bottle-body-container').getBoundingClientRect();
    const dropSize = Math.min(36, Math.max(24, srcRect.width * 0.7));
    const startX = cloneRect.left + (cloneRect.width / 2) - (dropSize/2);
    const startY = cloneRect.bottom - 10;
    const endX = dstRect.left + (dstRect.width / 2) - (dropSize/2);
    const endY = dstRect.top + 15;
    const streamWrapper = document.createElement('div');
    streamWrapper.className = 'liquid-stream';
    streamWrapper.style.width = dropSize + 'px'; streamWrapper.style.height = dropSize + 'px';
    streamWrapper.style.left = startX + 'px'; streamWrapper.style.top = startY + 'px';
    document.body.appendChild(streamWrapper);
    const innerDrop = document.createElement('div');
    innerDrop.style.width = '100%'; innerDrop.style.height = '100%';
    innerDrop.style.backgroundColor = COLORS[srcTopColor];
    innerDrop.style.borderRadius = '100% 0% 100% 100%';
    innerDrop.style.transform = 'rotate(-45deg)';
    innerDrop.style.position = 'relative';
    const highlight = document.createElement('div');
    highlight.style.position = 'absolute'; highlight.style.top = '30%'; highlight.style.left = '20%';
    highlight.style.width = '25%'; highlight.style.height = '35%'; highlight.style.background = 'white';
    highlight.style.borderRadius = '50%'; highlight.style.opacity = '0.7'; highlight.style.filter = 'blur(1px)';
    highlight.style.transform = 'rotate(-30deg)';
    innerDrop.appendChild(highlight);
    streamWrapper.appendChild(innerDrop);
    const deltaX = endX - startX, deltaY = endY - startY;
    streamWrapper.animate([
        { transform: 'translate(0px, 0px) scale(0.8)', opacity: 0.8 },
        { transform: `translate(${deltaX * 0.5}px, ${deltaY * 0.5 - 15}px) scale(1.5)`, opacity: 1 },
        { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.8)`, opacity: 0.6 }
    ], { duration: 300, easing: 'cubic-bezier(0.42, 0.0, 0.58, 1)', fill: 'forwards' });
    await sleep(320);
    streamWrapper.remove(); clone.remove();

    for (let i = 0; i < actualMove; i++) { dstData.push(srcData.pop()); }
    const hiddenIndices = levelHiddenIndices[currentLevelIdx] || [];
    if (srcData.length > 0) { if (hiddenIndices.includes(fromIdx)) { bottleVisibility[fromIdx][srcData.length - 1] = true; } }
    for (let i = 0; i < actualMove; i++) { bottleVisibility[toIdx].push(true); }
    bottleVisibility[fromIdx] = bottleVisibility[fromIdx].slice(0, srcData.length);
    updateBottleDOM(srcEl, srcData, bottleVisibility[fromIdx]);
    updateBottleDOM(dstEl, dstData, bottleVisibility[toIdx]);
    const wrapper = dstEl.querySelector('.liquid-wrapper');
    const liquids = wrapper.querySelectorAll('.liquid');
    if (liquids.length > 0) {
        const lastLiquid = liquids[liquids.length - 1];
        lastLiquid.classList.add('ripple');
        setTimeout(() => lastLiquid.classList.remove('ripple'), 500);
    }
    dstEl.classList.remove('receiving'); srcEl.style.opacity = '1'; srcEl.classList.remove('pouring');
    await sleep(500);
    isAnimating = false;
    checkGameState();
}

function createDemoDrop() {
    const demoScene = document.querySelector('.demo-scene');
    if (!demoScene) return;
    const dropSize = 18;
    const dropContainer = document.createElement('div');
    dropContainer.style.position = 'absolute'; dropContainer.style.width = dropSize + 'px';
    dropContainer.style.height = dropSize + 'px'; dropContainer.style.left = '125px';
    dropContainer.style.top = '40px'; dropContainer.style.zIndex = '6';
    demoScene.appendChild(dropContainer);
    const innerDrop = document.createElement('div');
    innerDrop.style.width = '100%'; innerDrop.style.height = '100%';
    innerDrop.style.backgroundColor = '#e74c3c';
    innerDrop.style.borderRadius = '100% 0% 100% 100%';
    innerDrop.style.transform = 'rotate(-45deg)'; innerDrop.style.position = 'relative';
    const highlight = document.createElement('div');
    highlight.style.position = 'absolute'; highlight.style.top = '30%'; highlight.style.left = '20%';
    highlight.style.width = '25%'; highlight.style.height = '35%'; highlight.style.background = 'white';
    highlight.style.borderRadius = '50%'; highlight.style.opacity = '0.7';
    highlight.style.filter = 'blur(1px)'; highlight.style.transform = 'rotate(-30deg)';
    innerDrop.appendChild(highlight);
    dropContainer.appendChild(innerDrop);
    dropContainer.animate([
        { transform: 'translateY(0) scale(0.8)', opacity: 0.8 },
        { transform: 'translateY(50px) scale(1.2)', opacity: 1 },
        { transform: 'translateY(50px) scale(0.8)', opacity: 0.6 }
    ], { duration: 400, easing: 'cubic-bezier(0.42, 0.0, 0.58, 1)', fill: 'forwards' });
    setTimeout(() => { if (dropContainer.parentNode) dropContainer.remove(); }, 400);
}

function startDemoDropLoop() {
    const createWithDelay = () => {
        createDemoDrop();
        demoDropInterval = setTimeout(createWithDelay, 3000);
    };
    demoDropInterval = setTimeout(createWithDelay, 1500);
}

function stopDemoDropLoop() {
    if (demoDropInterval) { clearTimeout(demoDropInterval); demoDropInterval = null; }
}

function waitForClickOnIndex(targetIdx) {
    return new Promise((resolve) => {
        tutorialResolve = (clickedIdx) => {
            if (clickedIdx === targetIdx) { tutorialResolve = null; resolve(); }
        };
    });
}

function waitForPopupClose() {
    return new Promise((resolve) => {
        const btn = document.getElementById('tutorial-start-btn');
        const closeHandler = () => { btn.removeEventListener('click', closeHandler); resolve(); };
        btn.addEventListener('click', closeHandler);
    });
}

async function runTutorial() {
    const tutUI = document.getElementById('tutorial-ui');
    const overlay = document.getElementById('tutorial-overlay');
    const popup = document.getElementById('tutorial-popup');
    const label = document.getElementById('tutorial-label');
    const labelText = document.getElementById('tutorial-label-text');
    // applyLanguage() уже вызвана в index.html
    tutUI.style.pointerEvents = 'auto';
    popup.style.display = 'block'; overlay.style.display = 'block'; label.style.opacity = '0';
    startDemoDropLoop();
    await waitForPopupClose();
    stopDemoDropLoop(); popup.style.display = 'none'; overlay.style.display = 'none'; tutUI.style.pointerEvents = 'none';

    const moves = [[0, 3], [2, 0], [1, 2]];
    for (let i = 0; i < moves.length; i++) {
        const [srcIdx, dstIdx] = moves[i];
        const bottles = document.querySelectorAll('.bottle');
        label.style.opacity = '1';
        // нужно получить перевод из TRANSLATIONS (глобальный)
        labelText.innerText = window.TRANSLATIONS[currentLang].tutorial_label_src || 'Click this bottle';
        bottles[srcIdx].classList.add('highlight-src');
        await waitForClickOnIndex(srcIdx);
        bottles[srcIdx].classList.remove('highlight-src');
        labelText.innerText = window.TRANSLATIONS[currentLang].tutorial_label_dst || 'Click the other bottle';
        bottles[dstIdx].classList.add('highlight-dst');
        await waitForClickOnIndex(dstIdx);
        bottles[dstIdx].classList.remove('highlight-dst');
        label.style.opacity = '0';
        await sleep(200);
        await animatePour(srcIdx, dstIdx);
    }
    isTutorial = false; tutUI.style.display = 'none'; checkGameState();
}

function hasAvailableMoves() {
    for (let i = 0; i < bottles.length; i++) {
        const src = bottles[i]; if (src.length === 0) continue;
        if (cappedBottles.has(i)) continue;
        if (isBigBottle(i)) continue;
        const frozen = frozenBottles.find(f => f.index === i && !f.unlocked);
        if (frozen) continue;
        const topColor = src[src.length - 1];
        for (let j = 0; j < bottles.length; j++) {
            if (i === j) continue;
            const dst = bottles[j];
            const maxLayers = getMaxLayers(j);
            if (dst.length >= maxLayers) continue;
            if (cappedBottles.has(j)) continue;
            const frozenDst = frozenBottles.find(f => f.index === j && !f.unlocked);
            if (frozenDst) continue;
            if (dst.length === 0 || dst[dst.length - 1] === topColor) return true;
        }
    }
    return false;
}

function checkGameState() {
    if (isTutorial) return;
    let allCapped = true;
    for (let i = 0; i < bottles.length; i++) {
        const b = bottles[i];
        const maxLayers = getMaxLayers(i);
        if (b.length === maxLayers && b.every(color => color === b[0])) {
            if (isBigBottle(i)) {
                // большая бутылка завершена
            } else {
                if (!cappedBottles.has(i)) { 
                    animateCapClosing(i); 
                }
            }
        } else if (b.length > 0) { allCapped = false; }
    }
    let bigCompleted = true;
    if (isBigBottle(bigBottleIndex)) {
        const bigData = bottles[bigBottleIndex];
        if (bigData.length !== bigBottleMaxLayers || !bigData.every(color => color === bigData[0])) {
            bigCompleted = false;
        }
    }
    let allRegularCapped = true;
    for (let i = 0; i < bottles.length; i++) {
        if (isBigBottle(i)) continue;
        const b = bottles[i];
        if (b.length > 0 && !cappedBottles.has(i)) {
            allRegularCapped = false;
            break;
        }
    }
    if (allRegularCapped && bigCompleted && !isWin) {
        isWin = true; stopTimer();
        const winModal = document.getElementById('win-modal');
        if (winModal) setTimeout(() => { winModal.style.display = 'flex'; }, 400);
        return;
    }
    if (!isWin && !hasAvailableMoves()) {
        isAnimating = true; stopTimer();
        const noMovesModal = document.getElementById('no-moves-modal');
        if (noMovesModal) noMovesModal.style.display = 'flex';
    }
}

// ===== ПРЕДУПРЕЖДЕНИЯ (таймер, скрытые, замороженные) =====
function showTimerWarning(seconds, callback) {
    // applyLanguage() уже вызвана
    const timerWarningModal = document.getElementById('timer-warning-modal');
    if (timerWarningModal) timerWarningModal.style.display = 'flex';
    let currentDigit = 10;
    const timerWarningDigits = document.getElementById('timer-warning-digits');
    if (timerWarningDigits) timerWarningDigits.textContent = currentDigit;
    if (warningDigitInterval) clearInterval(warningDigitInterval);
    warningDigitInterval = setInterval(() => {
        currentDigit--;
        if (currentDigit < 1) currentDigit = 10;
        if (timerWarningDigits) timerWarningDigits.textContent = currentDigit;
    }, 1000);
    pendingTimerStart = { seconds, callback };
}

function showHiddenWarning(callback) {
    // applyLanguage() already called
    const hiddenWarningModal = document.getElementById('hidden-warning-modal');
    if (hiddenWarningModal) hiddenWarningModal.style.display = 'flex';
    pendingTimerStart = { seconds: 0, callback };
    startHiddenDemo();
}

function startHiddenDemo() {
    if (hiddenDemoRunning) return;
    hiddenDemoRunning = true;
    const src = document.getElementById('hiddenSrc');
    const dst = document.getElementById('hiddenDst');
    if (!src || !dst) return;
    const srcLayers = src.querySelectorAll('.hidden-demo-liquid');
    srcLayers.forEach((layer, idx) => {
        layer.style.display = '';
        layer.classList.remove('question');
        layer.style.backgroundColor = '';
        if (idx === 0) { layer.style.backgroundColor = '#e74c3c'; }
        else { layer.classList.add('question'); layer.style.backgroundColor = '#111'; }
    });
    const dstWrapper = dst.querySelector('.hidden-demo-liquid-wrapper');
    if (dstWrapper) dstWrapper.innerHTML = '';
    src.classList.remove('lift', 'lower');
    const clone = document.getElementById('hiddenClone');
    if (clone) clone.classList.remove('show', 'hide');
    const drop = document.getElementById('hiddenDrop');
    if (drop) drop.classList.remove('fall');
    setTimeout(() => doHiddenDemoStep(), 500);
}

function doHiddenDemoStep() {
    const src = document.getElementById('hiddenSrc');
    const clone = document.getElementById('hiddenClone');
    const drop = document.getElementById('hiddenDrop');
    const dstWrapper = document.querySelector('#hiddenDst .hidden-demo-liquid-wrapper');
    if (!src || !clone || !drop || !dstWrapper) return;
    const srcLayers = src.querySelectorAll('.hidden-demo-liquid');
    src.classList.add('lift');
    clone.classList.add('show');
    drop.classList.add('fall');

    setTimeout(() => {
        drop.classList.remove('fall');
        src.classList.remove('lift');
        src.classList.add('lower');
        clone.classList.remove('show');
        clone.classList.add('hide');

        const layerToRemove = srcLayers[0];
        if (layerToRemove) layerToRemove.style.display = 'none';

        const nextLayer = srcLayers[1];
        if (nextLayer) {
            nextLayer.classList.remove('question');
            nextLayer.style.backgroundColor = '#2ecc71';
        }

        const newLiquid = document.createElement('div');
        newLiquid.className = 'hidden-demo-liquid';
        newLiquid.style.backgroundColor = '#e74c3c';
        newLiquid.style.bottom = '0%';
        dstWrapper.appendChild(newLiquid);

        setTimeout(() => {
            src.classList.remove('lower');
            clone.classList.remove('hide');
            resetHiddenDemo();
        }, 500);
    }, 1000);
}

function resetHiddenDemo() {
    const src = document.getElementById('hiddenSrc');
    const dst = document.getElementById('hiddenDst');
    if (!src || !dst) return;
    const srcLayers = src.querySelectorAll('.hidden-demo-liquid');
    srcLayers.forEach((layer, idx) => {
        layer.style.display = '';
        layer.classList.remove('question');
        layer.style.backgroundColor = '';
        if (idx === 0) { layer.style.backgroundColor = '#e74c3c'; }
        else { layer.classList.add('question'); layer.style.backgroundColor = '#111'; }
    });
    const dstWrapper = dst.querySelector('.hidden-demo-liquid-wrapper');
    if (dstWrapper) dstWrapper.innerHTML = '';
    src.classList.remove('lift', 'lower');
    const clone = document.getElementById('hiddenClone');
    if (clone) clone.classList.remove('show', 'hide');
    const drop = document.getElementById('hiddenDrop');
    if (drop) drop.classList.remove('fall');
    setTimeout(() => doHiddenDemoStep(), 800);
}

function stopHiddenDemo() {
    if (hiddenDemoInterval) { clearInterval(hiddenDemoInterval); hiddenDemoInterval = null; }
    hiddenDemoRunning = false;
}

// ===== ЗАМОРОЖЕННАЯ БУТЫЛКА (демо) =====
let frozenDemoRunning = false;

function showFrozenWarning(callback) {
    // applyLanguage() already called
    const frozenWarningModal = document.getElementById('frozen-warning-modal');
    if (frozenWarningModal) frozenWarningModal.style.display = 'flex';
    buildFrozenDemo();
    startFrozenDemoLoop();
    pendingTimerStart = { seconds: 0, callback };
}

function buildFrozenDemo() {
    const container = document.getElementById('frozen-demo-container');
    if (!container) return;
    container.innerHTML = '';
    const bottleEl = document.createElement('div');
    bottleEl.className = 'bottle locked-bottle';
    bottleEl.style.width = '100%';
    bottleEl.style.height = '100%';
    bottleEl.style.position = 'relative';
    bottleEl.style.margin = '0 auto';

    const overlay = document.createElement('div');
    overlay.className = 'locked-overlay';
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.filter = 'drop-shadow(0 15px 25px rgba(0, 40, 80, 0.8))';

    const bottleInside = document.createElement('div');
    bottleInside.className = 'bottle-inside';
    bottleInside.style.position = 'absolute';
    bottleInside.style.width = '66.7%';
    bottleInside.style.height = '72.2%';
    bottleInside.style.left = '16.7%';
    bottleInside.style.top = '8.3%';
    bottleInside.style.zIndex = '1';

    const bottleBody = document.createElement('div');
    bottleBody.className = 'bottle-body';
    bottleBody.style.width = '100%';
    bottleBody.style.height = '100%';
    bottleBody.style.position = 'relative';
    bottleBody.style.clipPath = 'url(#bottle-clip)';
    bottleBody.style.background = 'rgba(255, 255, 255, 0.05)';

    const wrapper = document.createElement('div');
    wrapper.className = 'liquid-wrapper';
    wrapper.style.position = 'absolute';
    wrapper.style.bottom = '0';
    wrapper.style.left = '0';
    wrapper.style.width = '100%';
    wrapper.style.height = '80%';
    wrapper.style.overflow = 'hidden';
    wrapper.style.pointerEvents = 'none';

    const demoColors = ['R','G','B','Y'];
    demoColors.forEach((color, i) => {
        const liquid = document.createElement('div');
        liquid.className = 'liquid';
        liquid.style.position = 'absolute';
        liquid.style.width = '100%';
        liquid.style.height = '25%';
        liquid.style.bottom = (i * 25) + '%';
        liquid.style.backgroundColor = COLORS[color];
        liquid.style.pointerEvents = 'none';
        wrapper.appendChild(liquid);
    });

    bottleBody.appendChild(wrapper);

    const shine = document.createElement('div');
    shine.className = 'bottle-shine';
    shine.style.position = 'absolute';
    shine.style.top = '15%';
    shine.style.left = '6px';
    shine.style.width = '20%';
    shine.style.height = '60%';
    shine.style.background = 'linear-gradient(90deg, rgba(255,255,255,0.4), transparent)';
    shine.style.borderRadius = '50px';
    shine.style.filter = 'blur(2px)';
    shine.style.zIndex = '3';
    shine.style.pointerEvents = 'none';
    bottleBody.appendChild(shine);
    bottleInside.appendChild(bottleBody);

    const contourSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    contourSvg.setAttribute('width', '100%');
    contourSvg.setAttribute('height', '100%');
    contourSvg.setAttribute('viewBox', '0 0 60 130');
    contourSvg.style.cssText = 'position:absolute; top:0; left:0; pointer-events:none; z-index:4;';
    const contourPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    contourPath.setAttribute('d', 'M 16.8 6.5 L 43.2 6.5 L 43.2 32.5 C 51 32.5, 60 54.6, 60 84.5 L 60 117 C 60 130, 57 130, 51 130 L 9 130 C 3 130, 0 130, 0 117 L 0 84.5 C 0 54.6, 9 32.5, 16.8 32.5 Z');
    contourPath.setAttribute('fill', 'none');
    contourPath.setAttribute('stroke', '#ffffff');
    contourPath.setAttribute('stroke-width', '2');
    contourPath.setAttribute('filter', 'drop-shadow(0 0 4px rgba(255,255,255,0.8))');
    contourSvg.appendChild(contourPath);
    bottleInside.appendChild(contourSvg);

    overlay.appendChild(bottleInside);

    const iceSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    iceSvg.setAttribute('class', 'ice-cube');
    iceSvg.setAttribute('viewBox', '0 0 100 180');
    iceSvg.setAttribute('preserveAspectRatio', 'none');
    iceSvg.innerHTML = `
        <defs>
            <radialGradient id="cubeGradient" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                <stop offset="0%" stop-color="#1c8fc3" />
                <stop offset="40%" stop-color="#147bb3" />
                <stop offset="100%" stop-color="#2ea3d9" />
            </radialGradient>
            <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
            </linearGradient>
        </defs>
        <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="url(#cubeGradient)" opacity="0.5" />
        <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
        <g>
            <path d="M 10 25 C 15 10, 25 12, 35 18 C 45 10, 55 10, 65 18 C 75 12, 85 15, 90 25 L 90 32 C 82 28, 70 35, 60 28 C 50 35, 40 28, 30 35 C 20 28, 12 32, 8 32 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1"/>
            <path d="M 20 25 C 25 18, 35 20, 45 25 C 35 28, 25 25, 20 25 Z" fill="#aaddff" opacity="0.6"/>
            <path d="M 60 25 C 65 18, 75 20, 80 25 C 70 28, 60 25, 60 25 Z" fill="#88ccff" opacity="0.5"/>
            <path d="M 40 20 C 45 15, 55 15, 60 20 C 50 22, 40 20, 40 20 Z" fill="#ffffff" opacity="0.8"/>
        </g>
        <g>
            <path d="M 10 156 L 15 175 L 20 156 L 25 180 L 30 156 L 38 170 L 45 156 L 52 182 L 60 156 L 68 172 L 75 156 L 82 180 L 88 156 Z" fill="#aee6ff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M 15 156 L 18 165 L 25 156 Z" fill="#7bc4e8" opacity="0.6"/>
            <path d="M 45 156 L 48 168 L 55 156 Z" fill="#7bc4e8" opacity="0.6"/>
            <path d="M 75 156 L 78 168 L 85 156 Z" fill="#7bc4e8" opacity="0.6"/>
        </g>
        <g>
            <path d="M 25 40 L 40 40 L 55 100 L 40 140 L 25 140 Z" fill="url(#shineGradient)" />
            <ellipse cx="45" cy="50" rx="12" ry="20" fill="#ffffff" opacity="0.15" transform="rotate(-15 45 50)" filter="blur(2px)"/>
            <path d="M 85 40 L 91 40 L 91 140 L 85 140 Z" fill="#0b4b73" opacity="0.25" />
            <path d="M 7 40 L 10 40 L 10 140 L 7 140 Z" fill="#0b4b73" opacity="0.3" />
        </g>
        <g fill="none" stroke="#ffffff" stroke-linejoin="round">
            <path d="M 90 60 L 70 70 L 65 85" stroke-width="1.5" opacity="0.3"/>
            <path d="M 8 100 L 25 110 L 30 125" stroke-width="1.5" opacity="0.25"/>
            <path d="M 10 130 L 25 145 L 40 140" stroke-width="2" opacity="0.4"/>
            <path d="M 85 90 L 60 100 L 55 115" stroke-width="1.5" opacity="0.35"/>
            <path d="M 25 45 L 40 65 L 35 85 L 50 110" stroke-width="2" opacity="0.8"/>
            <path d="M 70 35 L 55 60 L 65 80 L 50 100 L 55 125" stroke-width="1.8" opacity="0.7"/>
            <path d="M 35 135 L 50 145 L 65 140" stroke-width="1.5" opacity="0.6"/>
            <path d="M 75 85 L 60 95 L 65 110" stroke-width="1.5" opacity="0.5"/>
            <path d="M 40 65 L 55 70 L 50 85" stroke-width="1" opacity="0.5"/>
            <path d="M 65 60 L 75 70 L 70 85" stroke-width="1" opacity="0.4"/>
            <path d="M 30 100 L 40 95 L 45 85" stroke-width="1" opacity="0.6"/>
            <path d="M 25 60 L 30 70 L 20 75" stroke-width="1" opacity="0.35"/>
        </g>
        <g fill="#ffffff" opacity="0.4">
            <circle cx="20" cy="50" r="1.5" />
            <circle cx="75" cy="45" r="1" />
            <circle cx="30" cy="100" r="1.8" />
            <circle cx="80" cy="110" r="1.2" />
            <circle cx="50" cy="135" r="1" />
            <circle cx="15" cy="90" r="1.5" />
            <circle cx="70" cy="130" r="1" />
        </g>
    `;
    overlay.appendChild(iceSvg);

    const frostText = document.createElement('div');
    frostText.className = 'frost-text';
    frostText.textContent = '❄️';
    overlay.appendChild(frostText);

    const counter = document.createElement('div');
    counter.className = 'counter';
    counter.textContent = '0/1';
    overlay.appendChild(counter);

    bottleEl.appendChild(overlay);
    container.appendChild(bottleEl);
}

async function startFrozenDemoLoop() {
    if (frozenDemoRunning) return;
    frozenDemoRunning = true;
    while (frozenDemoRunning) {
        await doFrozenDemoCycle();
    }
}

async function doFrozenDemoCycle() {
    if (!frozenDemoRunning) return;
    const overlay = document.querySelector('#frozen-demo-container .locked-overlay');
    if (!overlay) return;

    await resetFrozenDemo(overlay);
    await sleep(2000);
    if (!frozenDemoRunning) return;

    const counter = overlay.querySelector('.counter');
    if (counter) counter.textContent = '1/1';
    await sleep(600);
    if (!frozenDemoRunning) return;

    const frostText = overlay.querySelector('.frost-text');
    const counter2 = overlay.querySelector('.counter');
    if (frostText) frostText.classList.add('fade-out');
    if (counter2) counter2.classList.add('fade-out');

    await sleep(400);
    if (!frozenDemoRunning) return;

    await animateFrozenDemo(overlay);
    await sleep(1500);
    if (!frozenDemoRunning) return;
}

function resetFrozenDemo(overlay) {
    return new Promise((resolve) => {
        const fragments = overlay.querySelectorAll('.ice-fragment, .ice-particle, .icicle');
        fragments.forEach(el => el.remove());
        const frostText = overlay.querySelector('.frost-text');
        const counter = overlay.querySelector('.counter');
        if (frostText) {
            frostText.classList.remove('fade-out');
            frostText.style.opacity = '1';
            frostText.style.animation = 'pulseGlow 2s ease-in-out infinite';
        }
        if (counter) {
            counter.classList.remove('fade-out');
            counter.style.opacity = '1';
            counter.textContent = '0/1';
        }
        let iceSvg = overlay.querySelector('.ice-cube');
        if (!iceSvg) {
            // воссоздаём ледяной блок (упрощённо, используя шаблон из buildFrozenDemo)
            const newIce = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            newIce.setAttribute('class', 'ice-cube');
            newIce.setAttribute('viewBox', '0 0 100 180');
            newIce.setAttribute('preserveAspectRatio', 'none');
            newIce.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:2;';
            newIce.innerHTML = `
                <defs>
                    <radialGradient id="cubeGradient" cx="50%" cy="50%" r="60%" fx="30%" fy="30%">
                        <stop offset="0%" stop-color="#1c8fc3" />
                        <stop offset="40%" stop-color="#147bb3" />
                        <stop offset="100%" stop-color="#2ea3d9" />
                    </radialGradient>
                    <linearGradient id="shineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#ffffff" stop-opacity="0.3"/>
                        <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                    </linearGradient>
                </defs>
                <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="url(#cubeGradient)" opacity="0.5" />
                <path d="M 15 20 L 18 17 L 22 19 L 82 17 L 85 19 L 90 25 L 91 150 L 88 155 L 85 158 L 12 157 L 8 152 L 7 148 L 8 25 L 11 22 Z" fill="none" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" opacity="0.8"/>
                <g>
                    <path d="M 10 25 C 15 10, 25 12, 35 18 C 45 10, 55 10, 65 18 C 75 12, 85 15, 90 25 L 90 32 C 82 28, 70 35, 60 28 C 50 35, 40 28, 30 35 C 20 28, 12 32, 8 32 Z" fill="#ffffff" stroke="#ffffff" stroke-width="1"/>
                    <path d="M 20 25 C 25 18, 35 20, 45 25 C 35 28, 25 25, 20 25 Z" fill="#aaddff" opacity="0.6"/>
                    <path d="M 60 25 C 65 18, 75 20, 80 25 C 70 28, 60 25, 60 25 Z" fill="#88ccff" opacity="0.5"/>
                    <path d="M 40 20 C 45 15, 55 15, 60 20 C 50 22, 40 20, 40 20 Z" fill="#ffffff" opacity="0.8"/>
                </g>
                <g>
                    <path d="M 10 156 L 15 175 L 20 156 L 25 180 L 30 156 L 38 170 L 45 156 L 52 182 L 60 156 L 68 172 L 75 156 L 82 180 L 88 156 Z" fill="#aee6ff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
                    <path d="M 15 156 L 18 165 L 25 156 Z" fill="#7bc4e8" opacity="0.6"/>
                    <path d="M 45 156 L 48 168 L 55 156 Z" fill="#7bc4e8" opacity="0.6"/>
                    <path d="M 75 156 L 78 168 L 85 156 Z" fill="#7bc4e8" opacity="0.6"/>
                </g>
                <g>
                    <path d="M 25 40 L 40 40 L 55 100 L 40 140 L 25 140 Z" fill="url(#shineGradient)" />
                    <ellipse cx="45" cy="50" rx="12" ry="20" fill="#ffffff" opacity="0.15" transform="rotate(-15 45 50)" filter="blur(2px)"/>
                    <path d="M 85 40 L 91 40 L 91 140 L 85 140 Z" fill="#0b4b73" opacity="0.25" />
                    <path d="M 7 40 L 10 40 L 10 140 L 7 140 Z" fill="#0b4b73" opacity="0.3" />
                </g>
                <g fill="none" stroke="#ffffff" stroke-linejoin="round">
                    <path d="M 90 60 L 70 70 L 65 85" stroke-width="1.5" opacity="0.3"/>
                    <path d="M 8 100 L 25 110 L 30 125" stroke-width="1.5" opacity="0.25"/>
                    <path d="M 10 130 L 25 145 L 40 140" stroke-width="2" opacity="0.4"/>
                    <path d="M 85 90 L 60 100 L 55 115" stroke-width="1.5" opacity="0.35"/>
                    <path d="M 25 45 L 40 65 L 35 85 L 50 110" stroke-width="2" opacity="0.8"/>
                    <path d="M 70 35 L 55 60 L 65 80 L 50 100 L 55 125" stroke-width="1.8" opacity="0.7"/>
                    <path d="M 35 135 L 50 145 L 65 140" stroke-width="1.5" opacity="0.6"/>
                    <path d="M 75 85 L 60 95 L 65 110" stroke-width="1.5" opacity="0.5"/>
                    <path d="M 40 65 L 55 70 L 50 85" stroke-width="1" opacity="0.5"/>
                    <path d="M 65 60 L 75 70 L 70 85" stroke-width="1" opacity="0.4"/>
                    <path d="M 30 100 L 40 95 L 45 85" stroke-width="1" opacity="0.6"/>
                    <path d="M 25 60 L 30 70 L 20 75" stroke-width="1" opacity="0.35"/>
                </g>
                <g fill="#ffffff" opacity="0.4">
                    <circle cx="20" cy="50" r="1.5" />
                    <circle cx="75" cy="45" r="1" />
                    <circle cx="30" cy="100" r="1.8" />
                    <circle cx="80" cy="110" r="1.2" />
                    <circle cx="50" cy="135" r="1" />
                    <circle cx="15" cy="90" r="1.5" />
                    <circle cx="70" cy="130" r="1" />
                </g>
            `;
            overlay.appendChild(newIce);
        }
        resolve();
    });
}

async function animateFrozenDemo(overlay) {
    const iceSvg = overlay.querySelector('.ice-cube');
    if (!iceSvg) return;

    const iciclesGroup = iceSvg.querySelector('g:last-of-type');
    let iciclePaths = [];
    if (iciclesGroup) {
        iciclesGroup.querySelectorAll('path').forEach(path => {
            iciclePaths.push(path.getAttribute('d'));
        });
    }

    iceSvg.remove();

    const fragmentContainer = document.createElement('div');
    fragmentContainer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:20;';
    overlay.appendChild(fragmentContainer);

    const fragments = [
        { clip: 'inset(0 50% 50% 0)', anim: 'fragmentFly1 0.8s ease-out forwards' },
        { clip: 'inset(0 0 50% 50%)', anim: 'fragmentFly2 0.8s ease-out forwards' },
        { clip: 'inset(50% 50% 0 0)', anim: 'fragmentFly3 0.8s ease-out forwards' },
        { clip: 'inset(50% 0 0 50%)', anim: 'fragmentFly4 0.8s ease-out forwards' }
    ];

    const cloneSvgBase = iceSvg.cloneNode(true);
    const cloneIcicles = cloneSvgBase.querySelector('g:last-of-type');
    if (cloneIcicles) cloneIcicles.remove();

    fragments.forEach((frag) => {
        const div = document.createElement('div');
        div.className = 'ice-fragment';
        div.style.cssText = `position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:20; clip-path:${frag.clip}; animation:${frag.anim};`;
        const cloneSvg = cloneSvgBase.cloneNode(true);
        div.appendChild(cloneSvg);
        fragmentContainer.appendChild(div);
    });

    let icicleContainer = null;
    if (iciclePaths.length > 0) {
        icicleContainer = document.createElement('div');
        icicleContainer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:22;';
        overlay.appendChild(icicleContainer);

        const fallAnimations = ['icicleFall1', 'icicleFall2', 'icicleFall3', 'icicleFall4', 'icicleFall5'];
        iciclePaths.forEach((d, i) => {
            const div = document.createElement('div');
            div.className = 'icicle';
            div.style.cssText = `position:absolute; pointer-events:none; z-index:22; animation:${fallAnimations[i % fallAnimations.length]} 0.9s ease-out ${i * 0.1}s forwards; transform-origin:bottom center;`;
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            svg.setAttribute('viewBox', '0 0 100 180');
            svg.setAttribute('preserveAspectRatio', 'none');
            svg.style.cssText = 'width:100%; height:100%;';
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', d);
            path.setAttribute('fill', '#aee6ff');
            path.setAttribute('stroke', '#ffffff');
            path.setAttribute('stroke-width', '1.5');
            svg.appendChild(path);
            div.appendChild(svg);
            icicleContainer.appendChild(div);
        });
    }

    const particleContainer = document.createElement('div');
    particleContainer.style.cssText = 'position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; z-index:25;';
    overlay.appendChild(particleContainer);

    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
        const p = document.createElement('div');
        p.className = 'ice-particle';
        const size = 3 + Math.random() * 6;
        p.style.cssText = `position:absolute; border-radius:50%; background:radial-gradient(circle, #ffffff, #aaddff); pointer-events:none; z-index:25; width:${size}px; height:${size}px; left:${Math.random() * 90 + 5}%; top:${Math.random() * 80 + 10}%;`;
        const angle = Math.random() * 2 * Math.PI;
        const distance = 40 + Math.random() * 80;
        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance - 20;
        const duration = 0.6 + Math.random() * 0.5;
        p.style.animation = `particleFly ${duration}s ease-out ${Math.random() * 0.2}s forwards`;
        p.style.setProperty('--dx', dx + 'px');
        p.style.setProperty('--dy', dy + 'px');
        particleContainer.appendChild(p);
    }

    await sleep(1200);
    if (fragmentContainer) fragmentContainer.remove();
    if (icicleContainer) icicleContainer.remove();
    if (particleContainer) particleContainer.remove();
}

function stopFrozenDemo() {
    frozenDemoRunning = false;
    // Очищаем контейнер
    const container = document.getElementById('frozen-demo-container');
    if (container) container.innerHTML = '';
}

// ===== ОТРИСОВКА СЕТКИ УРОВНЕЙ =====
function renderLevelGrid() {
    const grid = document.getElementById('level-grid');
    if (!grid) return;
    grid.innerHTML = '';
    for(let i=0; i<totalLevels; i++) {
        const btn = document.createElement('div');
        btn.className = 'level-btn'; btn.innerHTML = `<span>${i+1}</span>`;
        if (i+1 > maxUnlockedLevel) btn.classList.add('locked');
        if (i+1 === maxUnlockedLevel) btn.classList.add('current');
        btn.onclick = () => {
            if (i+1 <= maxUnlockedLevel) {
                initAudio(); 
                const gameContainer = document.getElementById('game-container');
                if (gameContainer) gameContainer.style.display = 'flex';
                const levelSelect = document.getElementById('level-select');
                if (levelSelect) levelSelect.classList.add('menu-hidden');
                loadLevel(i); 
                if(musicEnabled) updateMusic();
            }
        };
        grid.appendChild(btn);
    }
}

// ===== ОБРАБОТЧИКИ СОБЫТИЙ (добавляются после загрузки DOM) =====
document.addEventListener('DOMContentLoaded', function() {
    // Обработчики кнопок в модальных окнах (они будут вставлены позже, но события можно повесить через делегирование)
    document.addEventListener('click', function(e) {
        // Кнопка "Следующий уровень"
        if (e.target.closest('#modal-next-btn')) {
            if (currentLevelIdx < totalLevels - 1) { 
                loadLevel(currentLevelIdx + 1); 
                const winModal = document.getElementById('win-modal');
                if (winModal) winModal.style.display = 'none'; 
            } else { 
                const winModal = document.getElementById('win-modal');
                if (winModal) winModal.style.display = 'none'; 
                openMainMenu(); 
            }
        }
        // Повторить (таймаут)
        if (e.target.closest('#timeout-retry-btn')) {
            const timeoutModal = document.getElementById('timeout-modal');
            if (timeoutModal) timeoutModal.style.display = 'none';
            isAnimating = false;
            loadLevel(currentLevelIdx);
        }
        // Меню (таймаут)
        if (e.target.closest('#timeout-menu-btn')) {
            const timeoutModal = document.getElementById('timeout-modal');
            if (timeoutModal) timeoutModal.style.display = 'none';
            isAnimating = false;
            openMainMenu();
        }
        // Повторить (нет ходов)
        if (e.target.closest('#no-moves-retry-btn')) {
            const noMovesModal = document.getElementById('no-moves-modal');
            if (noMovesModal) noMovesModal.style.display = 'none';
            isAnimating = false;
            loadLevel(currentLevelIdx);
        }
        // Меню (нет ходов)
        if (e.target.closest('#no-moves-menu-btn')) {
            const noMovesModal = document.getElementById('no-moves-modal');
            if (noMovesModal) noMovesModal.style.display = 'none';
            isAnimating = false;
            openMainMenu();
        }
        // Кнопка "Начать" для предупреждения таймера
        if (e.target.closest('#timer-warning-start-btn')) {
            const timerWarningModal = document.getElementById('timer-warning-modal');
            if (timerWarningModal) timerWarningModal.style.display = 'none';
            if (warningDigitInterval) { clearInterval(warningDigitInterval); warningDigitInterval = null; }
            if (pendingTimerStart) {
                const { seconds, callback } = pendingTimerStart;
                pendingTimerStart = null;
                callback(seconds);
            }
        }
        // Кнопка "Начать" для скрытых слоёв
        if (e.target.closest('#hidden-warning-start-btn')) {
            const hiddenWarningModal = document.getElementById('hidden-warning-modal');
            if (hiddenWarningModal) hiddenWarningModal.style.display = 'none';
            if (hiddenDemoInterval) { clearInterval(hiddenDemoInterval); hiddenDemoInterval = null; }
            hiddenDemoRunning = false;
            if (pendingTimerStart) {
                const { callback } = pendingTimerStart;
                pendingTimerStart = null;
                callback();
            }
        }
        // Кнопка "Начать" для замороженной бутылки
        if (e.target.closest('#frozen-warning-start-btn')) {
            const frozenWarningModal = document.getElementById('frozen-warning-modal');
            if (frozenWarningModal) frozenWarningModal.style.display = 'none';
            stopFrozenDemo();
            if (pendingTimerStart) {
                const { callback } = pendingTimerStart;
                pendingTimerStart = null;
                callback();
            }
        }
        // Кнопка сброса
        if (e.target.closest('#reset-btn')) {
            loadLevel(currentLevelIdx);
        }
    });
});

// Экспортируем глобальные функции, чтобы они были доступны в index.html
window.loadLevel = loadLevel;
window.render = render;
window.handleBottleClick = handleBottleClick;
window.hasAvailableMoves = hasAvailableMoves;
window.checkGameState = checkGameState;
window.startTimer = startTimer;
window.stopTimer = stopTimer;
window.showTimerWarning = showTimerWarning;
window.showHiddenWarning = showHiddenWarning;
window.showFrozenWarning = showFrozenWarning;
window.stopFrozenDemo = stopFrozenDemo;
window.stopDemoDropLoop = stopDemoDropLoop;
window.stopHiddenDemo = stopHiddenDemo;
window.renderLevelGrid = renderLevelGrid;
window.openMainMenu = openMainMenu; // уже определена в index.html, но переопределим? Лучше оставить.
window.openLevelSelect = openLevelSelect; // уже определена
window.openSettings = openSettings;
window.exitGame = exitGame;
window.isTutorial = isTutorial;
window.tutorialResolve = tutorialResolve;
window.sleep = sleep;
window.playPourSound = playPourSound;
window.playCapSound = playCapSound;
window.playButtonSound = playButtonSound;
window.updateMusic = updateMusic;
window.initAudio = initAudio;
// Также нужны TRANSLATIONS, COLORS и т.д. для глобального доступа.
window.TRANSLATIONS = TRANSLATIONS;
window.COLORS = COLORS;
window.currentLang = currentLang;