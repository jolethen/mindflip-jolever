/** * 🌌 MINDFLIP CORE ENGINE
 * Sound Integrated - Browser-Auto-Play-Safe Version
 */

// --- GLOBAL STATE ---
const symbols = ["🚀", "👽", "🌕", "🛸", "⭐", "🌌", "☄️", "🪐", "🤖", "📡", "🛰️", "🔭"];
let cards = [], flipped = [];
let players = ["P1", "P2"];
let scores = [0, 0];
let turn = 0;
let mode = "single";
let difficulty = 4;
let selectedLevel = 1;
let lockBoard = false;

// --- 🔊 SOUND ENGINE (Web Audio API) ---
let audioCtx = null; // Don't start it yet!

function playSound(type) {
    // Only play if audio context was successfully created
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'flip') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);
        osc.start();
        osc.stop(now + 0.1);
    } 
    else if (type === 'match') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); 
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.2); 
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        osc.start();
        osc.stop(now + 0.3);
    } 
    else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.2);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        osc.start();
        osc.stop(now + 0.2);
    }
    else if (type === 'win') {
        [523, 659, 783, 1046].forEach((f, i) => {
            const o = audioCtx.createOscillator();
            const g = audioCtx.createGain();
            o.connect(g); g.connect(audioCtx.destination);
            o.frequency.setValueAtTime(f, now + i * 0.1);
            g.gain.setValueAtTime(0.1, now + i * 0.1);
            g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.1 + 0.4);
            o.start(now + i * 0.1);
            o.stop(now + i * 0.1 + 0.4);
        });
    }
}

// --- 🌌 BACKGROUND ANIMATION ---
const canvas = document.getElementById("bg");
const ctx = canvas.getContext("2d");
let stars = [];

function initBG() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    stars = Array.from({ length: 120 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2
    }));
}

function animateBG() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white";
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.y += 0.2;
        if (s.y > canvas.height) s.y = 0;
    });
    requestAnimationFrame(animateBG);
}
initBG(); animateBG();
window.addEventListener('resize', initBG);

// --- 🛠️ MENU LOGIC ---
window.selectMode = (m, btn) => {
    mode = m;
    document.querySelectorAll("#modeSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("p2").style.display = (m === 'multi') ? "block" : "none";
};

window.selectDiff = (d, btn) => {
    difficulty = d;
    document.querySelectorAll("#diffSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
};

const levelContainer = document.getElementById("levels");
for (let i = 1; i <= 40; i++) {
    let btn = document.createElement("button");
    btn.innerText = i;
    btn.className = "level-btn" + (i === 1 ? " active" : "");
    btn.onclick = () => {
        selectedLevel = i;
        document.querySelectorAll(".level-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
    };
    levelContainer.appendChild(btn);
}

// --- 🎮 GAME CORE ---
window.startGame = () => {
    // 💡 INITIALIZE AUDIO ON USER GESTURE
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    document.getElementById("menu").style.display = "none";
    document.getElementById("victory-screen").style.display = "none";
    players[0] = document.getElementById("p1").value || "Player 1";
    players[1] = document.getElementById("p2").value || "Player 2";
    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    loadGame();
};

function loadGame() {
    let size = difficulty;
    if (selectedLevel > 10 && size < 6) size = 6;
    if (selectedLevel > 20 && size < 8) size = 8;

    const grid = document.getElementById("grid");
    grid.style.gridTemplateColumns = `repeat(${size}, min(70px, 18vw))`;

    const pairCount = (size * size) / 2;
    const selectedSymbols = symbols.slice(0, pairCount);
    cards = [...selectedSymbols, ...selectedSymbols].sort(() => Math.random() - 0.5);

    grid.innerHTML = "";
    cards.forEach(sym => {
        const card = document.createElement("div");
        card.className = "card";
        card.innerHTML = `<div class="inner"><div class="front"></div><div class="back">${sym}</div></div>`;
        card.onclick = () => flip(card, sym);
        grid.appendChild(card);
    });
    updateUI();
}

function flip(card, sym) {
    if (lockBoard || card.classList.contains("flipped")) return;
    
    playSound('flip');
    card.classList.add("flipped");
    flipped.push({ card, sym });

    if (flipped.length === 2) {
        lockBoard = true; 
        setTimeout(checkMatch, 600);
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (a.sym === b.sym) {
        playSound('match');
        scores[turn]++;
        flipped = [];
        lockBoard = false;
        if (document.querySelectorAll(".flipped").length === cards.length) endGame();
    } else {
        playSound('wrong');
        setTimeout(() => {
            a.card.classList.remove("flipped");
            b.card.classList.remove("flipped");
            flipped = [];
            lockBoard = false;
            if (mode === "multi") turn = (turn === 0) ? 1 : 0;
            updateUI();
        }, 400);
    }
    updateUI();
}

function getHighScoreKey() {
    return `mindflip_best_d${difficulty}_l${selectedLevel}`;
}

function endGame() {
    playSound('win');
    let winner = mode === "single" ? players[0] :
        scores[0] > scores[1] ? players[0] :
        scores[1] > scores[0] ? players[1] : "Draw";

    let isNewRecord = false;
    if (mode === "single") {
        const key = getHighScoreKey();
        const prevBest = localStorage.getItem(key) || 0;
        if (scores[0] > prevBest) {
            localStorage.setItem(key, scores[0]);
            isNewRecord = true;
        }
    }

    setTimeout(() => {
        document.getElementById("winner-display").innerText = winner === "Draw" ? "🤝 Draw!" : "🏆 " + winner + "!";
        document.getElementById("record-msg").innerText = isNewRecord ? "⭐ NEW RECORD ⭐" : "";
        document.getElementById("victory-screen").style.display = "flex";
    }, 500);
}

window.restartLevel = () => {
    scores = [0, 0];
    turn = 0;
    flipped = [];
    lockBoard = false;
    loadGame();
    document.getElementById("victory-screen").style.display = "none";
};

window.backToMenu = () => {
    document.getElementById("victory-screen").style.display = "none";
    document.getElementById("menu").style.display = "flex";
    document.getElementById("grid").innerHTML = "";
};

function updateUI() {
    const stats = document.getElementById("stats");
    const turnDiv = document.getElementById("turn");
    if (mode === "multi") {
        turnDiv.innerText = `${players[turn]}'s Turn`;
        stats.innerText = `${players[0]}: ${scores[0]} | ${players[1]}: ${scores[1]}`;
    } else {
        const best = localStorage.getItem(getHighScoreKey()) || 0;
        turnDiv.innerText = "";
        stats.innerHTML = `Score: ${scores[0]} <span style="opacity:0.4; font-size:0.85rem; margin-left:10px;">Best: ${best}</span>`;
    }
    }
