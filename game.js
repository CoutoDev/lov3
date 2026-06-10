const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const scoreDisplay = document.getElementById('score');
const startScreen = document.getElementById('startScreen');
const startBtn = document.getElementById('startBtn');
const gameContainer = document.querySelector('.game-container');

let score = 0;
let gameRunning = false;
let items = [];
let lastSpawnTime = 0;
let spawnInterval = 1000;
let animationId;

// Cute SVG icons as data URLs
const icons = {
    heart: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff6b9d" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>')}`,
    star: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ffd700" d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>')}`,
    flower: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff69b4" d="M12 2C9.5 2 7.5 4 7.5 6.5S9.5 11 12 11 16.5 9 16.5 6.5 14.5 2 12 2zm0 9c-2.5 0-4.5 2-4.5 4.5S9.5 20 12 20s4.5-2 4.5-4.5S14.5 11 12 11z"/></svg>')}`,
    special: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff1493" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>')}`
};

const itemTypes = [
    { type: 'heart', icon: icons.heart, points: 1, weight: 0.6 },
    { type: 'star', icon: icons.star, points: 2, weight: 0.25 },
    { type: 'flower', icon: icons.flower, points: 3, weight: 0.12 },
    { type: 'special', icon: icons.special, points: 5, weight: 0.03 }
];

const milestoneMessages = [
    { score: 5, message: "You're doing great! 💕" },
    { score: 10, message: "Amazing! Keep going! ⭐" },
    { score: 20, message: "You're a heart catcher! 🌸" },
    { score: 30, message: "Incredible! 💖" },
    { score: 50, message: "You're the best! 🏆" }
];

const specialMessages = [
    "Special catch! ✨",
    "Wow! 💫",
    "Amazing! 🎉",
    "Perfect! 💝"
];

let shownMilestones = new Set();

function resizeCanvas() {
    const rect = gameContainer.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
}

function getRandomItemType() {
    const random = Math.random();
    let cumulative = 0;
    for (const item of itemTypes) {
        cumulative += item.weight;
        if (random <= cumulative) {
            return item;
        }
    }
    return itemTypes[0];
}

function spawnItem() {
    const itemType = getRandomItemType();
    const size = 40 + Math.random() * 20;
    const x = Math.random() * (canvas.width - size);
    
    const img = new Image();
    img.src = itemType.icon;
    
    items.push({
        x: x,
        y: -size,
        size: size,
        speed: 1 + Math.random() * 2,
        rotation: 0,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
        img: img,
        type: itemType.type,
        points: itemType.points
    });
}

function drawItem(item) {
    ctx.save();
    ctx.translate(item.x + item.size / 2, item.y + item.size / 2);
    ctx.rotate(item.rotation);
    ctx.drawImage(item.img, -item.size / 2, -item.size / 2, item.size, item.size);
    ctx.restore();
}

function showFloatingMessage(x, y, text) {
    const message = document.createElement('div');
    message.className = 'floating-message';
    message.textContent = text;
    message.style.left = x + 'px';
    message.style.top = y + 'px';
    gameContainer.appendChild(message);
    
    setTimeout(() => {
        message.remove();
    }, 2000);
}

function showMilestoneMessage(message) {
    const milestone = document.createElement('div');
    milestone.className = 'milestone-message';
    milestone.textContent = message;
    gameContainer.appendChild(milestone);
    
    setTimeout(() => {
        milestone.remove();
    }, 2500);
}

function checkMilestones() {
    for (const milestone of milestoneMessages) {
        if (score >= milestone.score && !shownMilestones.has(milestone.score)) {
            shownMilestones.add(milestone.score);
            showMilestoneMessage(milestone.message);
        }
    }
}

function handleClick(e) {
    if (!gameRunning) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = (e.clientX || e.touches[0].clientX) - rect.left;
    const y = (e.clientY || e.touches[0].clientY) - rect.top;
    
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const dx = x - (item.x + item.size / 2);
        const dy = y - (item.y + item.size / 2);
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < item.size / 2 + 10) {
            // Caught the item
            score += item.points;
            scoreDisplay.textContent = score;
            
            if (item.type === 'special') {
                const randomMessage = specialMessages[Math.floor(Math.random() * specialMessages.length)];
                showFloatingMessage(item.x, item.y, randomMessage);
            } else {
                showFloatingMessage(item.x, item.y, '+' + item.points);
            }
            
            items.splice(i, 1);
            checkMilestones();
            break;
        }
    }
}

function update(timestamp) {
    if (!gameRunning) return;
    
    // Spawn new items
    if (timestamp - lastSpawnTime > spawnInterval) {
        spawnItem();
        lastSpawnTime = timestamp;
        // Gradually increase difficulty
        spawnInterval = Math.max(400, 1000 - score * 10);
    }
    
    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        item.y += item.speed;
        item.rotation += item.rotationSpeed;
        
        // Remove items that fall off screen
        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }
    
    // Draw
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    for (const item of items) {
        drawItem(item);
    }
    
    animationId = requestAnimationFrame(update);
}

function startGame() {
    score = 0;
    scoreDisplay.textContent = score;
    items = [];
    shownMilestones.clear();
    spawnInterval = 1000;
    lastSpawnTime = 0;
    gameRunning = true;
    startScreen.style.display = 'none';
    
    resizeCanvas();
    animationId = requestAnimationFrame(update);
}

// Event listeners
startBtn.addEventListener('click', startGame);
canvas.addEventListener('click', handleClick);
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleClick(e);
});

window.addEventListener('resize', resizeCanvas);

// Initial setup
resizeCanvas();
