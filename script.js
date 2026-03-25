/** * 🌌 MINDFLIP CORE ENGINE
 * Optimized for: GitHub Pages & Mobile Touch
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
let lockBoard = false; // Prevents clicking more than 2 cards during animations

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

// Initial setup
initBG();
animateBG();
window.addEventListener('resize', initBG);

// --- 🛠️ MENU & SETUP LOGIC ---

// Mode Selection (Single vs Multi)
window.selectMode = (m, btn) => {
    mode = m;
    document.querySelectorAll("#modeSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    // Show Player 2 input only in Multi mode
    document.getElementById("p2").style.display = (m === 'multi') ? "block" : "none";
};

// Difficulty Selection
window.selectDiff = (d, btn) => {
    difficulty = d;
    document.querySelectorAll("#diffSelect button").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
};

// Level Grid Generation (1-40)
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
    document.getElementById("menu").style.display = "none";
    document.getElementById("victory-screen").style.display = "none";
    
    // Set names or defaults
    players[0] = document.getElementById("p1").value || "Player 1";
    players[1] = document.getElementById("p2").value || "Player 2";
    
    scores = [0, 0];
    turn = 0;
    loadGame();
};

function loadGame() {
    let size = difficulty;
    // Scale difficulty based on level milestones
    if (selectedLevel > 10 && size < 6) size = 6;
    if (selectedLevel > 20 && size < 8) size = 8;

    const grid = document.getElementById("grid");
    // Dynamic CSS grid columns based on size
    grid.style.gridTemplateColumns = `repeat(${size}, min(70px, 18vw))`;

    const pairCount = (size * size) / 2;
    const selectedSymbols = symbols.slice(0, pairCount);
    
    // Create card deck and shuffle
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

    card.classList.add("flipped");
    flipped.push({ card, sym });

    if (flipped.length === 2) {
        lockBoard = true; // Stop user from clicking more cards
        setTimeout(checkMatch, 600);
    }
}

function checkMatch() {
    const [a, b] = flipped;
    if (a.sym === b.sym) {
        scores[turn]++;
        flipped = [];
        lockBoard = false;
        // Check if game is over
        if (document.querySelectorAll(".flipped").length === cards.length) {
            endGame();
        }
    } else {
        // No match: Flip back after short delay
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

// --- 🏆 SCORE & PERSISTENCE ---

function getHighScoreKey() {
    return `mindflip_best_d${difficulty}_l${selectedLevel}`;
}

function endGame() {
    let winner = mode === "single" ? players[0] :
        scores[0] > scores[1] ? players[0] :
        scores[1] > scores[0] ? players[1] : "Draw";

    // Check LocalStorage for new record
    let isNewRecord = false;
    if (mode === "single") {
        const key = getHighScoreKey();
        const prevBest = localStorage.getItem(key) || 0;
        if (scores[0] > prevBest) {
            localStorage.setItem(key, scores[0]);
            isNewRecord = true;
        }
    }

    // Graphical Victory Reveal
    setTimeout(() => {
        const vicScreen = document.getElementById("victory-screen");
        const winText = document.getElementById("winner-display");
        const recordMsg = document.getElementById("record-msg");
        
        winText.innerText = winner === "Draw" ? "It's a Draw!" : "🏆 " + winner + " Wins!";
        recordMsg.innerText = isNewRecord ? "⭐ NEW PERSONAL BEST! ⭐" : "";
        vicScreen.style.display = "flex";
    }, 500);
}

window.restartLevel = () => {
    document.getElementById("victory-screen").style.display = "none";
    scores = [0, 0];
    turn = 0;
    loadGame();
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
        stats.innerHTML = `Score: ${scores[0]} <span style="opacity:0.5; font-size:0.8rem; margin-left:10px;">Best: ${best}</span>`;
    }
      }
