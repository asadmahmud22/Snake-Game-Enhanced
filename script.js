const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const levelDisplay = document.getElementById("level");
const gameOverScreen = document.getElementById("gameOverScreen");
const finalScoreDisplay = document.getElementById("finalScore");
const newRecordDisplay = document.getElementById("newRecord");

const box = 20;
const canvasSize = 400;
const gridSize = canvasSize / box;

let snake = [];
let direction = { x: 1, y: 0 };
let food = {};
let score = 0;
let highScore = parseInt(localStorage.getItem("snakeHighScore") || "0");
let level = 1;
let gameSpeed = 200;
let gameRunning = false;
let gamePaused = false;
let gameInterval;

// Partikel efek
let particles = [];

// Inisialisasi high score
highScoreDisplay.textContent = highScore;

// Particle class untuk efek visual
class Particle {
  constructor(x, y, color) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.color = color;
    this.life = 30;
    this.maxLife = 30;
    this.size = Math.random() * 3 + 2;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.vx *= 0.98;
    this.vy *= 0.98;
  }

  draw() {
    const alpha = this.life / this.maxLife;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
}

function createParticles(x, y, color, count = 8) {
  for (let i = 0; i < count; i++) {
    particles.push(new Particle(x, y, color));
  }
}

function updateParticles() {
  particles = particles.filter((particle) => {
    particle.update();
    particle.draw();
    return particle.life > 0;
  });
}

function initGame() {
  snake = [
    { x: 9, y: 10 },
    { x: 8, y: 10 },
    { x: 7, y: 10 },
  ];
  direction = { x: 1, y: 0 };
  food = spawnFood();
  score = 0;
  level = 1;
  scoreDisplay.textContent = score;
  levelDisplay.textContent = level;
  gameRunning = true;
  gamePaused = false;
  particles = [];
}

function spawnFood() {
  let newFood;
  do {
    newFood = {
      x: Math.floor(Math.random() * gridSize),
      y: Math.floor(Math.random() * gridSize),
    };
  } while (snake.some((part) => part.x === newFood.x && part.y === newFood.y));
  return newFood;
}

function drawSnake() {
  snake.forEach((part, index) => {
    // Gradient untuk kepala
    if (index === 0) {
      const gradient = ctx.createLinearGradient(
        part.x * box,
        part.y * box,
        part.x * box + box,
        part.y * box + box
      );
      gradient.addColorStop(0, "#00ff88");
      gradient.addColorStop(1, "#00cc66");
      ctx.fillStyle = gradient;
    } else {
      // Gradient untuk badan
      const gradient = ctx.createLinearGradient(
        part.x * box,
        part.y * box,
        part.x * box + box,
        part.y * box + box
      );
      gradient.addColorStop(0, "#44ff88");
      gradient.addColorStop(1, "#22cc66");
      ctx.fillStyle = gradient;
    }

    // Rounded rectangle untuk snake
    ctx.beginPath();
    ctx.roundRect(part.x * box + 2, part.y * box + 2, box - 4, box - 4, 6);
    ctx.fill();

    // Highlight untuk efek 3D
    if (index === 0) {
      ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
      ctx.beginPath();
      ctx.roundRect(part.x * box + 4, part.y * box + 4, box - 8, 4, 2);
      ctx.fill();
    }
  });
}

function drawFood() {
  // Animasi pulsing untuk makanan
  const pulseSize = Math.sin(Date.now() * 0.01) * 2;

  // Shadow
  ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
  ctx.beginPath();
  ctx.arc(
    food.x * box + box / 2 + 2,
    food.y * box + box / 2 + 2,
    box / 2 - 2 + pulseSize,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Main food
  const gradient = ctx.createRadialGradient(
    food.x * box + box / 2,
    food.y * box + box / 2,
    0,
    food.x * box + box / 2,
    food.y * box + box / 2,
    box / 2
  );
  gradient.addColorStop(0, "#ff4444");
  gradient.addColorStop(1, "#cc0000");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(
    food.x * box + box / 2,
    food.y * box + box / 2,
    box / 2 - 2 + pulseSize,
    0,
    Math.PI * 2
  );
  ctx.fill();

  // Highlight
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.beginPath();
  ctx.arc(
    food.x * box + box / 2 - 3,
    food.y * box + box / 2 - 3,
    3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function drawGrid() {
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 0.5;

  for (let i = 0; i <= gridSize; i++) {
    ctx.beginPath();
    ctx.moveTo(i * box, 0);
    ctx.lineTo(i * box, canvasSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, i * box);
    ctx.lineTo(canvasSize, i * box);
    ctx.stroke();
  }
}

function draw() {
  // Clear canvas dengan gradient background
  const bgGradient = ctx.createLinearGradient(0, 0, canvasSize, canvasSize);
  bgGradient.addColorStop(0, "#1a1a2e");
  bgGradient.addColorStop(1, "#16213e");
  ctx.fillStyle = bgGradient;
  ctx.fillRect(0, 0, canvasSize, canvasSize);

  drawGrid();
  drawFood();
  drawSnake();
  updateParticles();

  // Pause overlay
  if (gamePaused) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(0, 0, canvasSize, canvasSize);

    ctx.fillStyle = "white";
    ctx.font = "bold 30px Arial";
    ctx.textAlign = "center";
    ctx.fillText("PAUSED", canvasSize / 2, canvasSize / 2);
    ctx.textAlign = "left";
  }
}

function update() {
  if (!gameRunning || gamePaused) return;

  const head = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y,
  };

  // Check collision with walls
  if (head.x < 0 || head.y < 0 || head.x >= gridSize || head.y >= gridSize) {
    gameOver();
    return;
  }

  // Check collision with self
  if (snake.some((part) => part.x === head.x && part.y === head.y)) {
    gameOver();
    return;
  }

  snake.unshift(head);

  // Check if food is eaten
  if (head.x === food.x && head.y === food.y) {
    score++;
    scoreDisplay.textContent = score;

    // Create particles effect
    createParticles(
      food.x * box + box / 2,
      food.y * box + box / 2,
      "#ff4444",
      12
    );

    // Level up setiap 5 poin
    if (score % 5 === 0) {
      level++;
      levelDisplay.textContent = level;

      // Increase speed
      if (gameSpeed > 60) {
        gameSpeed -= 10;
        clearInterval(gameInterval);
        gameInterval = setInterval(update, gameSpeed);
      }
    }

    food = spawnFood();
  } else {
    snake.pop();
  }

  draw();
}

function gameOver() {
  gameRunning = false;
  clearInterval(gameInterval);

  // Create explosion effect
  createParticles(
    snake[0].x * box + box / 2,
    snake[0].y * box + box / 2,
    "#ff0000",
    20
  );

  // Check for new high score
  let isNewRecord = false;
  if (score > highScore) {
    highScore = score;
    highScoreDisplay.textContent = highScore;
    localStorage.setItem("snakeHighScore", highScore.toString());
    isNewRecord = true;
  }

  // Show game over screen
  setTimeout(() => {
    finalScoreDisplay.textContent = `Skor Anda: ${score}`;
    newRecordDisplay.style.display = isNewRecord ? "block" : "none";
    gameOverScreen.style.display = "flex";
  }, 1000);
}

function restartGame() {
  gameOverScreen.style.display = "none";
  initGame();
  draw();
  gameInterval = setInterval(update, gameSpeed);
}

function togglePause() {
  if (!gameRunning) return;
  gamePaused = !gamePaused;
  draw();
}

// Event listeners
document.addEventListener("keydown", (e) => {
  if (!gameRunning) return;

  switch (e.key) {
    case "ArrowUp":
    case "w":
    case "W":
      if (direction.y === 0) direction = { x: 0, y: -1 };
      break;
    case "ArrowDown":
    case "s":
    case "S":
      if (direction.y === 0) direction = { x: 0, y: 1 };
      break;
    case "ArrowLeft":
    case "a":
    case "A":
      if (direction.x === 0) direction = { x: -1, y: 0 };
      break;
    case "ArrowRight":
    case "d":
    case "D":
      if (direction.x === 0) direction = { x: 1, y: 0 };
      break;
    case " ":
    case "Escape":
      e.preventDefault();
      togglePause();
      break;
  }
});

// Touch controls
document.querySelectorAll(".control-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!gameRunning) return;

    const dir = btn.dataset.direction;
    switch (dir) {
      case "up":
        if (direction.y === 0) direction = { x: 0, y: -1 };
        break;
      case "down":
        if (direction.y === 0) direction = { x: 0, y: 1 };
        break;
      case "left":
        if (direction.x === 0) direction = { x: -1, y: 0 };
        break;
      case "right":
        if (direction.x === 0) direction = { x: 1, y: 0 };
        break;
      case "pause":
        togglePause();
        break;
    }
  });
});

// Difficulty selector
document.querySelectorAll(".difficulty-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (gameRunning) return;

    document
      .querySelectorAll(".difficulty-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    gameSpeed = parseInt(btn.dataset.speed);
  });
});

// Swipe detection for mobile
let touchStartX = 0;
let touchStartY = 0;

canvas.addEventListener("touchstart", (e) => {
  e.preventDefault();
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
});

canvas.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (!gameRunning) return;

  const touchEndX = e.changedTouches[0].clientX;
  const touchEndY = e.changedTouches[0].clientY;

  const deltaX = touchEndX - touchStartX;
  const deltaY = touchEndY - touchStartY;

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    // Horizontal swipe
    if (deltaX > 30 && direction.x === 0) {
      direction = { x: 1, y: 0 }; // Right
    } else if (deltaX < -30 && direction.x === 0) {
      direction = { x: -1, y: 0 }; // Left
    }
  } else {
    // Vertical swipe
    if (deltaY > 30 && direction.y === 0) {
      direction = { x: 0, y: 1 }; // Down
    } else if (deltaY < -30 && direction.y === 0) {
      direction = { x: 0, y: -1 }; // Up
    }
  }
});

// Polyfill for roundRect
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (
    x,
    y,
    width,
    height,
    radius
  ) {
    this.beginPath();
    this.moveTo(x + radius, y);
    this.lineTo(x + width - radius, y);
    this.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.lineTo(x + width, y + height - radius);
    this.quadraticCurveTo(
      x + width,
      y + height,
      x + width - radius,
      y + height
    );
    this.lineTo(x + radius, y + height);
    this.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.lineTo(x, y + radius);
    this.quadraticCurveTo(x, y, x + radius, y);
    this.closePath();
  };
}

// Initialize game
initGame();
draw();
gameInterval = setInterval(update, gameSpeed);
