/* ============================================
   KUZGUNUN ODASI - THE RAVEN'S ROOM
   Game Logic & State Management
   ============================================ */

// ===== GAME STATE =====
const state = {
    mirrorRevealed: false,
    hasKey: false,
    chestOpened: false,
    cubeRevealed: false,
    gameFinished: false,
    gramophonePlaying: false
};

// ===== AUDIO CONTEXT (Web Audio API) =====
let audioCtx = null;

// ===== MP3 MUSIC =====
const titleMusic = new Audio('Gymnopedie No 3.mp3');
titleMusic.loop = true;
titleMusic.volume = 0;

const gameMusic = new Audio('Promising Relationship.mp3');
gameMusic.loop = true;
gameMusic.volume = 0;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

// Generate crackling/static sound
function playCrackle(duration = 2) {
    initAudio();
    const bufferSize = audioCtx.sampleRate * duration;
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        // Vinyl crackle effect
        if (Math.random() < 0.02) {
            data[i] = (Math.random() - 0.5) * 0.3;
        } else {
            data[i] = (Math.random() - 0.5) * 0.02;
        }
    }

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    const gainNode = audioCtx.createGain();
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.3);
    gainNode.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + duration - 0.5);
    gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + duration);

    // Low-pass filter for warmer sound
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    source.start();

    return source;
}

// Generate a simple tone (for key pickup, etc.)
function playTone(freq = 440, duration = 0.3, type = 'sine') {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
}

// Eerie ambient chord
function playEerieChord() {
    initAudio();
    const freqs = [130.81, 155.56, 196.00, 233.08]; // Cm chord + diminished
    freqs.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 0.5 + i * 0.2);
        gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 3);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 3);
    });
}

// Deep rumble for chest
function playDeepRumble() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.value = 40;
    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2);

    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 200;

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 2);
}

// Click sound
function playClick() {
    initAudio();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'square';
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);

    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.05);
}

// ===== MP3 MUSIC CONTROL =====
function fadeIn(audio, targetVol = 0.5, duration = 2000) {
    audio.volume = 0;
    audio.play().catch(() => { });
    const steps = 30;
    const stepTime = duration / steps;
    const volStep = targetVol / steps;
    let current = 0;
    const interval = setInterval(() => {
        current++;
        audio.volume = Math.min(volStep * current, targetVol);
        if (current >= steps) clearInterval(interval);
    }, stepTime);
}

function fadeOut(audio, duration = 1500) {
    const steps = 25;
    const stepTime = duration / steps;
    const startVol = audio.volume;
    const volStep = startVol / steps;
    let current = 0;
    const interval = setInterval(() => {
        current++;
        audio.volume = Math.max(startVol - volStep * current, 0);
        if (current >= steps) {
            clearInterval(interval);
            audio.pause();
        }
    }, stepTime);
}

function startTitleMusic() {
    fadeIn(titleMusic, 0.45, 2000);
}

function switchToGameMusic() {
    fadeOut(titleMusic, 1500);
    setTimeout(() => {
        fadeIn(gameMusic, 0.35, 2500);
    }, 800);
}


// ===== PARTICLES =====
function createParticles() {
    const container = document.getElementById('particles');
    const count = 25;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.left = Math.random() * 100 + '%';
        particle.style.top = (60 + Math.random() * 40) + '%';
        particle.style.animationDuration = (8 + Math.random() * 15) + 's';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.width = (1 + Math.random() * 2) + 'px';
        particle.style.height = particle.style.width;
        container.appendChild(particle);
    }
}


// ===== TITLE SCREEN =====
function initTitleScreen() {
    const titleScreen = document.getElementById('game-title');
    titleScreen.addEventListener('click', () => {
        titleScreen.classList.add('hidden');
        initAudio();
        playEerieChord();
        fadeIn(gameMusic, 0.35, 2500);
    }, { once: true });
}



// ===== LAMP TOGGLE =====
function handleLampClick() {
    const lamp = document.getElementById('lamp');
    playClick();
    lamp.classList.toggle('on');
    document.querySelectorAll('.wall-text').forEach(el => el.classList.toggle('visible'));
}

// ===== RUBIK'S CUBE =====
function handleRubikClick() {
    if (state.gameFinished) return;
    playClick();
    if (window.openRubikOverlay) window.openRubikOverlay();
}

// ===== STAGE 2: GRAMOPHONE =====
function handleGramophoneClick() {
    if (state.gameFinished) return;

    if (state.gramophonePlaying) {
        return;
    }

    if (state.hasKey) {
        return;
    }

    playClick();
    openModal();
}

// ===== COLOR BOX SYSTEM =====
const BOX_COUNT = 12;
const PRIMARY_COLORS = ['#c41e3a', '#ffd500', '#0051ba']; // Red, Yellow, Blue
const COLOR_NAMES = { '#c41e3a': 'red', '#ffd500': 'yellow', '#0051ba': 'blue' };

let colorState = new Array(BOX_COUNT).fill(-1);

/*
  Rubik cube TOP face (from image):
  Row 1: Yellow, Yellow, Orange    →  Y, Y, (R+Y pair)
  Row 2: Yellow, Yellow, Green     →  Y, Y, (B+Y pair)
  Row 3: Red,    Red,    Green     →  R, R, (B+Y pair)
  
  Grid layout (4 cols × 3 rows):
  [0:Y]  [1:Y]  [2:R|Y] [3:Y|R]   ← Orange = Red+Yellow (either order)
  [4:Y]  [5:Y]  [6:B|Y] [7:Y|B]   ← Green  = Blue+Yellow (either order)
  [8:R]  [9:R]  [10:B|Y][11:Y|B]  ← Green  = Blue+Yellow (either order)
  
  180° rotated is also accepted (reverse the whole grid)
*/

// Normal answer: fixed positions + pair positions
const NORMAL = {
    fixed: { 0: 'yellow', 1: 'yellow', 4: 'yellow', 5: 'yellow', 8: 'red', 9: 'red' },
    pairs: [[2, 3, 'red', 'yellow'], [6, 7, 'blue', 'yellow'], [10, 11, 'blue', 'yellow']]
};

// 180° rotated answer (whole grid reversed: pos0←pos11, pos1←pos10, etc.)
const ROTATED = {
    fixed: { 2: 'red', 3: 'red', 6: 'yellow', 7: 'yellow', 10: 'yellow', 11: 'yellow' },
    pairs: [[0, 1, 'blue', 'yellow'], [4, 5, 'blue', 'yellow'], [8, 9, 'red', 'yellow']]
};

function openModal() {
    const modal = document.getElementById('code-modal');
    modal.classList.add('visible');
    colorState = new Array(BOX_COUNT).fill(-1);
    updateColorBoxes();

    modal.onclick = function (e) {
        if (e.target === modal) closeModal();
    };
}

function closeModal() {
    const modal = document.getElementById('code-modal');
    modal.classList.remove('visible');
    playClick();
}

function cycleColor(boxIndex) {
    colorState[boxIndex] = (colorState[boxIndex] + 1) % PRIMARY_COLORS.length;
    updateColorBoxes();
    checkColorCode();
}

function updateColorBoxes() {
    for (let i = 0; i < BOX_COUNT; i++) {
        const box = document.getElementById('color-box-' + (i + 1));
        box.style.background = colorState[i] === -1 ? '#222' : PRIMARY_COLORS[colorState[i]];
    }
}

function getBoxColor(index) {
    if (colorState[index] === -1) return 'empty';
    return COLOR_NAMES[PRIMARY_COLORS[colorState[index]]];
}

function matchesPattern(pattern) {
    // Check fixed positions
    for (const [pos, color] of Object.entries(pattern.fixed)) {
        if (getBoxColor(Number(pos)) !== color) return false;
    }
    // Check pairs (either order)
    for (const [a, b, c1, c2] of pattern.pairs) {
        const ca = getBoxColor(a);
        const cb = getBoxColor(b);
        if (!((ca === c1 && cb === c2) || (ca === c2 && cb === c1))) return false;
    }
    return true;
}

function checkColorCode() {
    if (matchesPattern(NORMAL) || matchesPattern(ROTATED)) {
        setTimeout(() => {
            closeModal();
            activateGramophone();
        }, 500);
    }
}

function activateGramophone() {
    state.gramophonePlaying = true;

    // Start record spinning
    const record = document.getElementById('gramophone-record');
    record.classList.add('spinning');

    // Move tone arm
    const arm = document.getElementById('gramophone-arm');
    arm.classList.add('playing');

    // Horn vibration
    const horn = document.getElementById('gramophone-horn');
    horn.classList.add('vibrating');

    // Play crackle sound
    playCrackle(4);



    // Open secret drawer after a delay
    setTimeout(() => {
        const drawer = document.getElementById('secret-drawer');
        drawer.classList.add('open');
        playTone(330, 0.5, 'triangle');


    }, 2500);
}

function pickUpKey() {
    if (state.hasKey) return;

    state.hasKey = true;

    // Play pickup sound
    playTone(523, 0.15);
    setTimeout(() => playTone(659, 0.15), 100);
    setTimeout(() => playTone(784, 0.2), 200);

    // Hide key in drawer
    const keyInDrawer = document.getElementById('key-in-drawer');
    keyInDrawer.style.opacity = '0';
    keyInDrawer.style.transform = 'scale(0)';
    keyInDrawer.style.transition = 'all 0.3s ease';

    // Show key in inventory
    const keySlot = document.getElementById('key-slot');
    keySlot.classList.add('visible');


}


// ===== STAGE 3: CHEST =====
function handleChestClick() {
    if (state.gameFinished) return;

    if (state.cubeRevealed) {
        // Cube is already visible, don't do anything on chest click
        return;
    }

    if (state.chestOpened) {
        return;
    }

    playClick();

    if (!state.hasKey) {


        // Subtle shake on chest
        const chest = document.getElementById('chest');
        chest.style.animation = 'shake 0.3s ease';
        setTimeout(() => chest.style.animation = '', 300);
        return;
    }

    // Open the chest!
    state.chestOpened = true;

    // Unlock animation
    const lock = document.getElementById('chest-lock');
    lock.classList.add('unlocked');
    playTone(440, 0.2);

    // Open lid
    setTimeout(() => {
        const lid = document.getElementById('chest-lid');
        lid.classList.add('open');
        playDeepRumble();

        // Remove key from inventory
        const keySlot = document.getElementById('key-slot');
        keySlot.classList.remove('visible');
        state.hasKey = false;
    }, 500);

    // Reveal black cube
    setTimeout(() => {
        state.cubeRevealed = true;
        const cubeContainer = document.getElementById('black-cube-container');
        cubeContainer.classList.add('visible');

        playEerieChord();

    }, 1800);
}


// ===== FINAL: BLACK CUBE =====
function handleCubeClick() {
    if (state.gameFinished) return;

    state.gameFinished = true;

    // Deep ominous sound
    playDeepRumble();
    playEerieChord();

    // Flash screen
    const flash = document.createElement('div');
    flash.className = 'screen-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 600);

    // Fade to black and show final screen
    setTimeout(() => {
        const finalScreen = document.getElementById('final-screen');
        finalScreen.classList.add('visible');

        // Play one last eerie chord
        setTimeout(() => playEerieChord(), 2000);
    }, 1000);
}


// ===== MESSAGE SYSTEM =====
let messageTimeout = null;

function showMessage(text, duration = 3000) {
    const overlay = document.getElementById('message-overlay');
    const messageText = document.getElementById('message-text');

    // Clear previous timeout
    if (messageTimeout) {
        clearTimeout(messageTimeout);
    }

    messageText.textContent = text;
    overlay.classList.add('visible');

    messageTimeout = setTimeout(() => {
        overlay.classList.remove('visible');
    }, duration);
}


// ===== KEYBOARD HANDLERS =====
document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('code-modal');
    if (modal.classList.contains('visible')) {
        if (e.key === 'Escape') {
            closeModal();
        }
    }
});


// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initTitleScreen();
});
