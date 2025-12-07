/**
 * Audio utilities
 */
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

// Background Music
let bgmInterval = null;
let bgmNoteIndex = 0;
const bgmNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 329.63]; // C Major Arpeggio

function startBGM() {
    if (bgmInterval) return;
    bgmInterval = setInterval(() => {
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (!state.gameActive) return;
        
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        const now = audioCtx.currentTime;
        const freq = bgmNotes[bgmNoteIndex % bgmNotes.length];
        bgmNoteIndex++;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);
        gainNode.gain.setValueAtTime(0.02, now); // Very quiet
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
        
        osc.start(now);
        osc.stop(now + 0.5);
    }, 600); // Play a note every 600ms
}

function stopBGM() {
    if (bgmInterval) {
        clearInterval(bgmInterval);
        bgmInterval = null;
    }
}

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'shoot') {
        osc.type = 'square';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'explosion') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.exponentialRampToValueAtTime(10, now + 0.3);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } else if (type === 'hit') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, now);
        gainNode.gain.setValueAtTime(0.05, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
        osc.start(now);
        osc.stop(now + 0.05);
    } else if (type === 'build') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, now);
        osc.frequency.exponentialRampToValueAtTime(1200, now + 0.1);
        gainNode.gain.setValueAtTime(0.1, now);
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start(now);
        osc.stop(now + 0.1);
    } else if (type === 'gameover') {
        stopBGM();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.linearRampToValueAtTime(50, now + 1);
        gainNode.gain.setValueAtTime(0.2, now);
        gainNode.gain.linearRampToValueAtTime(0, now + 1);
        osc.start(now);
        osc.stop(now + 1);
    }
}
