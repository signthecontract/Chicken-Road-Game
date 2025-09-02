const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const startScreen = document.getElementById("start-screen");
const gameOverScreen = document.getElementById("game-over");
const finalScoreElement = document.getElementById("final-score");
const startBtn = document.getElementById("start-btn");
const restartBtn = document.getElementById("restart-btn");

// Game settings
const GRID_SIZE = 50;
const COLS = canvas.width / GRID_SIZE; // 8
const ROWS = canvas.height / GRID_SIZE; // 12
let score = 0;
let gameSpeed = 2;
let difficultyLevel = 1;
let gameActive = false;

// Chicken position
let chicken = {
  x: 3,
  y: ROWS - 1,
  width: 40,
  height: 40,
};

// Lane types: 'road', 'river', 'grass'
let lanes = [];

// Obstacle class
class Obstacle {
  constructor(x, y, width, height, speed, laneType) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.laneType = laneType;
  }

  update() {
    this.x += this.speed;
    // Wrap around for continuous motion
    if (this.speed > 0 && this.x > canvas.width) this.x = -this.width;
    if (this.speed < 0 && this.x < -this.width) this.x = canvas.width;
  }

  draw() {
    ctx.fillStyle = this.laneType === "road" ? "red" : "brown";
    ctx.fillRect(this.x, this.y * GRID_SIZE + 15, this.width, this.height);
  }

  collidesWith(chicken) {
    return (
      this.x < (chicken.x * GRID_SIZE + 10) + chicken.width &&
      this.x + this.width > (chicken.x * GRID_SIZE + 10) &&
      this.y * GRID_SIZE + 15 < (chicken.y * GRID_SIZE + 10) + chicken.height &&
      this.y * GRID_SIZE + 15 + this.height > (chicken.y * GRID_SIZE + 10)
    );
  }
}

// Generate lanes
function generateLanes() {
  lanes = [];
  for (let y = 0; y < ROWS; y++) {
    if (y === ROWS - 1 || y === 0) {
      lanes.push({ type: "grass", obstacles: [] });
    } else if (y % 2 === 0) {
      const isRight = Math.random() < 0.5;
      const speed = isRight ? 2 + difficultyLevel * 0.5 : -(2 + difficultyLevel * 0.5);
      lanes.push({ type: "road", direction: isRight ? "right" : "left", speed, obstacles: [] });
    } else {
      lanes.push({ type: "grass", obstacles: [] });
    }
  }
  // Add cars to road lanes
  lanes.forEach((lane, y) => {
    if (lane.type === "road") {
      const gap = Math.max(2, 4 - difficultyLevel * 0.3);
      for (let x = -50; x < canvas.width + 50; x += GRID_SIZE * gap + Math.random() * GRID_SIZE) {
        lane.obstacles.push(new Obstacle(x, y, 60, 20, lane.speed, "road"));
      }
    }
  });
}

// Reset game
function resetGame() {
  score = 0;
  gameSpeed = 2;
  difficultyLevel = 1;
  chicken.x = 3;
  chicken.y = ROWS - 1;
  generateLanes();
  scoreElement.textContent = "Score: 0";
}

// Game loop
function gameLoop() {
  if (!gameActive) return;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw lanes
  for (let y = 0; y < ROWS; y++) {
    ctx.fillStyle = lanes[y].type === "road" ? "#555" : "#8bc34a";
    ctx.fillRect(0, y * GRID_SIZE, canvas.width, GRID_SIZE);

    // Draw road markings
    if (lanes[y].type === "road") {
      ctx.strokeStyle = "yellow";
      ctx.setLineDash([20, 20]);
      ctx.beginPath();
      ctx.moveTo(0, y * GRID_SIZE + GRID_SIZE / 2);
      ctx.lineTo(canvas.width, y * GRID_SIZE + GRID_SIZE / 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  // Update and draw obstacles
  lanes.forEach((lane) => {
    lane.obstacles.forEach((obs) => {
      obs.update();
      obs.draw();
    });
  });

  // Draw chicken
  ctx.fillStyle = "yellow";
  ctx.fillRect(
    chicken.x * GRID_SIZE + 10,
    chicken.y * GRID_SIZE + 10,
    chicken.width,
    chicken.height
  );
  ctx.strokeStyle = "orange";
  ctx.strokeRect(
    chicken.x * GRID_SIZE + 10,
    chicken.y * GRID_SIZE + 10,
    chicken.width,
    chicken.height
  );

  // Check collisions
  const currentLane = lanes[chicken.y];
  if (currentLane.type === "road") {
    for (const obs of currentLane.obstacles) {
      if (obs.collidesWith(chicken)) {
        endGame();
        return;
      }
    }
  }

  // Increase score when moving forward
  if (chicken.y < ROWS - 1) {
    score += 0.1;
    scoreElement.textContent = `Score: ${Math.floor(score)}`;
  }

  // Increase difficulty
  if (score > 0 && Math.floor(score) % 50 === 0) {
    difficultyLevel = 1 + Math.floor(score / 50);
  }

  requestAnimationFrame(gameLoop);
}

function endGame() {
  gameActive = false;
  finalScoreElement.textContent = Math.floor(score);
  gameOverScreen.style.display = "flex";
}

// Input handling
function handleInput(dir) {
  if (!gameActive) return;

  if (dir === "left" && chicken.x > 0) chicken.x--;
  if (dir === "right" && chicken.x < COLS - 1) chicken.x++;
  if (dir === "up" && chicken.y > 0) {
    chicken.y--;
    if (chicken.y === 0) {
      // Reached top, reset to bottom (like Crossy Road)
      setTimeout(() => {
        chicken.y = ROWS - 1;
      }, 100);
    }
  }
  if (dir === "down" && chicken.y < ROWS - 1) chicken.y++;
}

// Keyboard
document.addEventListener("keydown", (e) => {
  switch (e.key) {
    case "ArrowLeft":
      e.preventDefault();
      handleInput("left");
      break;
    case "ArrowRight":
      e.preventDefault();
      handleInput("right");
      break;
    case "ArrowUp":
      e.preventDefault();
      handleInput("up");
      break;
    case "ArrowDown":
      e.preventDefault();
      handleInput("down");
      break;
  }
});

// Touch (mobile)
let touchStartX, touchStartY;
canvas.addEventListener("touchstart", (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  e.preventDefault();
});

canvas.addEventListener("touchend", (e) => {
  if (!gameActive) return;
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;

  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 50) handleInput("right");
    else if (dx < -50) handleInput("left");
  } else {
    if (dy < -50) handleInput("up");
    else if (dy > 50) handleInput("down");
  }
  e.preventDefault();
});

// UI Buttons
startBtn.addEventListener("click", () => {
  startScreen.style.display = "none";
  gameActive = true;
  resetGame();
  gameLoop();
});

restartBtn.addEventListener("click", () => {
  gameOverScreen.style.display = "none";
  gameActive = true;
  resetGame();
  gameLoop();
});

// Initialize
generateLanes();