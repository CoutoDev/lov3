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

async function loadSVG(svgFileName = '') {
    const response = await fetch(`./svg/${svgFileName}.svg`);
    return await response.text();
}

const itemTypes = []
// Cute SVG icons as data URLs
const generateIcons = async () => {
    const lilo =  await loadSVG('lilosvg')
    const ze =  await loadSVG('zesvg')
    const usVapor =  await loadSVG('us-vapor')
    const joyTrip =  await loadSVG('joy-trip')
    const joyPhoto =  await loadSVG('joy-phototime')

    return {
        heart: `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="%23ff6b9d" d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>')}`,
        lilo: `data:image/svg+xml,${encodeURIComponent(lilo)}`,
        ze: `data:image/svg+xml,${encodeURIComponent(ze)}`,
        joyPhoto: `data:image/svg+xml,${encodeURIComponent(joyPhoto)}`,
        joyTrip: `data:image/svg+xml,${encodeURIComponent(joyTrip)}`,
        special: `data:image/svg+xml,${encodeURIComponent(usVapor)}`
    }
};

const milestoneMessages = [
    { score: 5, message: "Vai la, mosi! 💕" },
    { score: 15, message: "Foco amorzinho ⭐" },
    { score: 30, message: "Me pega assim também! 🌸" },
    { score: 100, message: "Impressionante 💖" },
    { score: 150, message: "A melhor jogadora! 🏆" }
];

const specialMessages = [
    "🐢🐛",
    "Cucuritos ❤️",
    "Te amo 🐢🐛❤️"
];

const liloMessages = [
    "Fiuuuu",
    "Lilinho",
    "Lilo iuuu"
];

const zeMessages = [
    "Zéco 🐕",
    "Au au au 🐕",
    "🐶"
];

const joyPhotoMessages = [
    "Modo fotografa 📸",
    "Posa pra mim! 📸",
    "Girl power!"
];

const joyTripMessages = [
    "Modo viagem 🚗",
    "Work, work, work...",
    "🛫"
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

            switch (item.type) {
                case 'special':
                    const randomMessage = specialMessages[Math.floor(Math.random() * specialMessages.length)];
                    showFloatingMessage(item.x, item.y, randomMessage);
                    break;

                case 'lilo':
                    const randomLiloMessage = liloMessages[Math.floor(Math.random() * liloMessages.length)];
                    showFloatingMessage(item.x, item.y, randomLiloMessage);
                    break;

                case 'ze':
                    const randomZeMessage = zeMessages[Math.floor(Math.random() * zeMessages.length)];
                    showFloatingMessage(item.x, item.y, randomZeMessage);
                    break;
                    
                case 'joyPhoto':
                    const randomJoyPhotoMessage = joyPhotoMessages[Math.floor(Math.random() * joyPhotoMessages.length)];
                    showFloatingMessage(item.x, item.y, randomJoyPhotoMessage);
                    break;
                    
                case 'joyTrip':
                    const randomJoyTripMessage = joyTripMessages[Math.floor(Math.random() * joyTripMessages.length)];
                    showFloatingMessage(item.x, item.y, randomJoyTripMessage);
                    break;
            
                default:
                    showFloatingMessage(item.x, item.y, '+' + item.points);
                    break;
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

    generateIcons().then(svgIcons => {
        itemTypes.push(
            { type: 'heart', icon: svgIcons.heart, points: 1, weight: 0.3 },
            { type: 'lilo', icon: svgIcons.lilo, points: 3, weight: 0.2 },
            { type: 'ze', icon: svgIcons.ze, points: 3, weight: 0.2 },
            { type: 'joyPhoto', icon: svgIcons.joyPhoto, points: 10, weight: 0.15 },
            { type: 'joyTrip', icon: svgIcons.joyTrip, points: 15, weight: 0.25 },
            { type: 'special', icon: svgIcons.special, points: 20, weight: 0.1 }
        )
        resizeCanvas();
        animationId = requestAnimationFrame(update);
    })
    
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
