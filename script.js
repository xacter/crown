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
    });
}


// ===== STAGE 1: MIRROR =====
function handleMirrorClick() {
    if (state.gameFinished) return;
    
    playClick();
    
    if (state.mirrorRevealed) {
        // Already revealed, show reminder
        showMessage('Aynada bir sayı yazıyor: 5391... yoksa 1935 mi?');
        return;
    }
    
    state.mirrorRevealed = true;
    
    // Fog effect
    const fog = document.getElementById('mirror-fog');
    fog.classList.add('visible');
    
    // Show reversed number after fog settles
    setTimeout(() => {
        const text = document.getElementById('mirror-text');
        text.classList.add('visible');
        playEerieChord();
    }, 800);
    
    // Flash raven silhouette
    setTimeout(() => {
        const raven = document.getElementById('mirror-raven');
        raven.classList.add('flash');
        
        // Screen flash effect
        const flash = document.createElement('div');
        flash.className = 'screen-flash';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 600);
    }, 2000);
    
    // Show hint message
    setTimeout(() => {
        showMessage('Aynada buğunun arasından bir sayı beliriyor...');
    }, 1200);
}


// ===== STAGE 2: GRAMOPHONE =====
function handleGramophoneClick() {
    if (state.gameFinished) return;
    
    if (state.gramophonePlaying) {
        showMessage('Gramofon çalıyor... Cızırtı odanın içinde yankılanıyor.');
        return;
    }
    
    if (state.hasKey) {
        showMessage('Gramofon hâlâ çalıyor... Melodisi tuhaf ama tanıdık.');
        return;
    }
    
    playClick();
    openModal();
}

function openModal() {
    const modal = document.getElementById('code-modal');
    modal.classList.add('visible');
    
    const input = document.getElementById('code-input');
    input.value = '';
    input.focus();
    
    document.getElementById('modal-hint').textContent = '';
}

function closeModal() {
    const modal = document.getElementById('code-modal');
    modal.classList.remove('visible');
    playClick();
}

function submitCode() {
    const input = document.getElementById('code-input');
    const code = input.value.trim();
    const hint = document.getElementById('modal-hint');
    
    if (code === '1935') {
        // Correct code!
        closeModal();
        activateGramophone();
    } else if (code === '') {
        hint.textContent = 'Bir şifre girmelisin...';
        input.classList.add('shake');
        setTimeout(() => input.classList.remove('shake'), 500);
    } else {
        hint.textContent = 'Yanlış... Belki başka bir yerde ipucu vardır.';
        input.classList.add('shake');
        playTone(150, 0.3, 'sawtooth');
        setTimeout(() => {
            input.classList.remove('shake');
            input.value = '';
            input.focus();
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
    
    showMessage('Gramofon cızırtılı bir sesle çalmaya başlıyor...');
    
    // Open secret drawer after a delay
    setTimeout(() => {
        const drawer = document.getElementById('secret-drawer');
        drawer.classList.add('open');
        playTone(330, 0.5, 'triangle');
        
        showMessage('Gramofon altında gizli bir bölme açılıyor!');
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
    
    showMessage('Gümüş Anahtarı aldın!');
}


// ===== STAGE 3: CHEST =====
function handleChestClick() {
    if (state.gameFinished) return;
    
    if (state.cubeRevealed) {
        // Cube is already visible, don't do anything on chest click
        return;
    }
    
    if (state.chestOpened) {
        showMessage('Sandık zaten açık...');
        return;
    }
    
    playClick();
    
    if (!state.hasKey) {
        showMessage('Sandık kilitli. Bir anahtara ihtiyacın var...');
        
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
        showMessage('Sandığın içinden gizemli bir Siyah Küp çıkıyor...');
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
        if (e.key === 'Enter') {
            submitCode();
        } else if (e.key === 'Escape') {
            closeModal();
        }
    }
});


// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    createParticles();
    initTitleScreen();
});
