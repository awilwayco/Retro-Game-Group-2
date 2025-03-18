// Retro Game Project //
// Flipped Version //
// Space Breaker //

// Changeable Game Values
let lives = 5;
let bulletsTotal = 5;
let bulletSize = 10;
let bulletSpeed = 5;
let bulletCooldown = 400;
let enemyBulletSpeed = 2;
let enemyBulletSize = 5;
let enemyMoveDownFrames = 10;

// Unchangeable Game Values
let width = 500;
let height = 500;
let backgroundImg, endScreenImg, enemyImg, enemy2Img, enemy3Img, goldenEnemyImg, shipImg, shipHitImg, titleImg;
let ship;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let enemyDirection = 1;
let enemyMoveCounter = 0;
let enemyMovingDown = false;
let enemyMoveDownProgress = 0;
let invulnerable = false;
let bulletsUsed = 0;
let bulletsAvailable = bulletsTotal;
let lastBulletTime = 0;
let lastHitTime = 0;
let gameStarted = false;
let isWinner = false;
let isGameOver = false;
let level = 1;

// Preload Images
function preload() {
  backgroundImg = loadImage('assets/Background.png');
  endScreenImg = loadImage('assets/EndScreen.png');
  enemyImg = loadImage('assets/Enemy1.png');
  enemy2Img = loadImage('assets/Enemy2.png');
  enemy3Img = loadImage('assets/Enemy3.png');
  goldenEnemyImg = loadImage('assets/GoldenEnemy.png');
  shipImg = loadImage('assets/Ship.png');
  shipUpgradeImg = loadImage('assets/ShipUpgrade.png');
  shipHitImg = loadImage('assets/ShipHit.png');
  titleImg = loadImage('assets/Title.png');
}

// Setup Canvas and Player
function setup() {

  createCanvas(width, height);

  // Create Player Ship
  ship = new Ship(width / 2, height - 60);
  
}

// Draw Game
function draw() {

  // Title Screen
  if (!gameStarted) {
    showTitleScreen();
    metalBorder();
    return;
  }

  // Win Screen
  if (isWinner) {
    image(endScreenImg, 0, 0, width, height);

    // Display You Win!
    textSize(50);  // Adjust font size as necessary
    textFont('Press Start 2P');
    fill(255, 215, 0);  // Gold
    stroke(0, 0, 0);  // Black outline for bevel
    strokeWeight(4);  // Outline thickness
    text("You", width/2-75, height/2-10);
    text("Win!", width/2-85, height/2+60);
    noStroke();

    metalBorder();

    // Green Highlighting on Hover
    let buttonX = 134.5, buttonY = 381, buttonWidth = 224.5, buttonHeight = 45.5;
    if (
      mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY && mouseY <= buttonY + buttonHeight
    ) {
      noStroke();
      fill(0, 255, 0, 100); // Transparent green (100 for alpha)
      rect(buttonX, buttonY, buttonWidth, buttonHeight); // Rounded edges
    }

    return;
  }

  // Game Over
  if (isGameOver) {
    image(endScreenImg, 0, 0, width, height);

    // Display Game Over
    textSize(50);  // Adjust font size as necessary
    textFont('Press Start 2P');
    fill(175, 0, 0);  // Dark red fill
    stroke(0, 0, 0);  // Black outline for bevel
    strokeWeight(4);  // Outline thickness
    text("Game", width/2-95, height/2-10);
    text("Over", width/2-95, height/2+50);
    noStroke();

    metalBorder();

    // Green Highlighting on Hover
    let buttonX = 134.5, buttonY = 381, buttonWidth = 224.5, buttonHeight = 45.5;
    if (
      mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
      mouseY >= buttonY && mouseY <= buttonY + buttonHeight
    ) {
      noStroke();
      fill(0, 255, 0, 100); // Transparent green (100 for alpha)
      rect(buttonX, buttonY, buttonWidth, buttonHeight); // Rounded edges
    }

    return;
  }

  // Game Background
  image(backgroundImg, 0, 0, width, height);

  // Display Current Level in Red Beveled Font
  textSize(15);  // Adjust font size as necessary
  textFont('Press Start 2P');
  fill(175, 0, 0);  // Dark red fill
  stroke(0, 0, 0);  // Black outline for bevel
  strokeWeight(4);  // Outline thickness
  text("Level " + level, 20, 30);  // Position at top-left
  noStroke();

  // Draw a Metal Border
  metalBorder();

  // Update and Display Player Ship
  ship.update();
  ship.display();

  // Player bullets
  for (let i = bullets.length - 1; i >= 0; i--) {
    bullets[i].update();
    bullets[i].display();
  
    for (let j = enemies.length - 1; j >= 0; j--) {
      if (bullets[i].hits(enemies[j])) {
        if (enemies[j].type > 1) {
          enemies[j].type--; // Reduce enemy type instead of removing it
          enemies[j].image = enemies[j].getImageForType(); // Update image
        } else if (enemies[j].type === 1 && enemies[j].wasGolden) {
          ship.upgradeShip(); // If this was a golden enemy fully defeated, upgrade the ship
          enemies.splice(j, 1);
        }
        else {
          enemies.splice(j, 1); // Remove enemy if it’s at the lowest type
        }
        
        break;
      }
    }
    // Check collision with the player’s ship
    if (bullets[i].bounceOff(ship)) {
      continue;  // Skip removing the bullet if it bounced
    } else if (bullets[i].offScreen()) {
      bulletsAvailable--;
      bullets.splice(i, 1);
      break;
    }
  }  

  // Hold down Space Bar for Shooting
  if (keyIsDown(32) && millis() - lastBulletTime > bulletCooldown && bulletsUsed < bulletsTotal) {
    bulletsUsed++;
    bullets.push(new Bullet(ship.x + ship.width / 2, ship.y));
    lastBulletTime = millis();
  }

  // Enemy bullets
  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    enemyBullets[i].update();
    enemyBullets[i].display();

    if (!invulnerable && enemyBullets[i].hits(ship)) {
      enemyBullets.splice(i, 1);
      removeLife(); // Apply damage and trigger invulnerability
    } else if (enemyBullets[i].offScreen()) {
      enemyBullets.splice(i, 1);
    }
  }

  // Enemy shooting logic
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].display();
    var randomValue = random();
    if (randomValue < 0.002) {  // Chance of shooting
      if (enemies[i].lastShootTime < 1000) {
        enemyBullets.push(new EnemyBullet(enemies[i].x + enemies[i].width / 2, enemies[i].y + enemies[i].height));
      }
    }
  }

  // Enemy Movement
  updateEnemyMovement();

  // Player Lives
  displayLives();

  // Player Bullets
  displayBullets()

  // Check for all enemies killed
  if (enemies.length === 0) {
    nextLevel();
  }

  // Check if lost all bullets
  if (bulletsAvailable === 0) {
    isGameOver = true;
  }
}

// Handle Mouse Clicks
function mousePressed() {
  if (!gameStarted) {
    let buttonX = 202, buttonY = 314, buttonWidth = 97, buttonHeight = 50;
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
      gameStarted = true;
      createEnemies(level);
    }
  } else if (isWinner || isGameOver) {
    let buttonX = 134.5, buttonY = 381, buttonWidth = 224.5, buttonHeight = 45.5;
    if (mouseX >= buttonX && mouseX <= buttonX + buttonWidth && mouseY >= buttonY && mouseY <= buttonY + buttonHeight) {
      showTitleScreen();
      resetGame();
    }
  }
}

// Handle Key Presses
function keyPressed() {
  if (key === ' ') {
    if (millis() - lastBulletTime > bulletCooldown && bulletsUsed < bulletsTotal) {
      bulletsUsed++;
      bullets.push(new Bullet(ship.x + ship.width / 2, ship.y));
      lastBulletTime = millis();
    }
  }
}

// Show Title Screen
function showTitleScreen() {
  image(titleImg, 0, 0, width, height);

  // Green Highlighting on Hover
  let buttonX = 198, buttonY = 308.5, buttonWidth = 99, buttonHeight = 50.5;
  if (
    mouseX >= buttonX && mouseX <= buttonX + buttonWidth &&
    mouseY >= buttonY && mouseY <= buttonY + buttonHeight
  ) {
    noStroke();
    fill(0, 255, 0, 100); // Transparent green (100 for alpha)
    rect(buttonX, buttonY, buttonWidth, buttonHeight); // Rounded edges
  }
}

// Change Level
function nextLevel() {
  if (lives <= 0 || isGameOver) return;
  // Go to the next level and reset the necessary state
  if (enemies.length === 0) {
    if (level === 1) {
      level = 2;
    } else if (level === 2) {
      level = 3;
    // Win Screen
    } else if (level == 3) {
      isWinner = true;
      return;
    }
    createEnemies(level);
    bulletsUsed = 0;
    bulletsAvailable = bulletsTotal;
    bullets = [];
    enemyBullets = [];
  }
}

// Reset all game state for a new game
function resetGame() {
  bullets = [];
  enemies = [];
  enemyBullets = [];
  gameStarted = false;
  isWinner = false;
  isGameOver = false;
  bulletSize = 10;
  bulletSpeed = 5;
  bulletCooldown = 400;
  bulletsUsed = 0;
  bulletsAvailable = bulletsTotal;
  lastBulletTime = 0;
  lastHitTime = 0;
  enemyDirection = 1;
  enemyMoveCounter = 0;
  enemyMovingDown = false;
  enemyMoveDownFrames = 20;
  enemyMoveDownProgress = 0;
  invulnerable = false;
  lives = 5;
  level = 1;
  ship = new Ship(width / 2, height - 60);
  createEnemies(level);
}

// Add a Metal Border to Screen
function metalBorder() {
  // Draw Metal Border
  fill(192, 192, 192);  // Silver/metallic color
  stroke(128, 128, 128); // Darker metallic outline
  strokeWeight(3);
  rect(0, 0, 10, height); 
  rect(width - 10, 0, 10, height);
  rect(0, 0, width, 10);
  noStroke();
}

// Ship class (Player)
class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.speed = 5;
    this.width = 50;
    this.height = 50;
    this.image = shipImg;
    this.upgraded = false;
  }

  update() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      this.x -= this.speed;
    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
      this.x += this.speed;
    }
    this.x = constrain(this.x, 12, width - this.width - 12);
  }

  display() {
    image(this.image, this.x, this.y, this.width, this.height);
  }

  upgradeShip() {
    this.image = shipUpgradeImg;
    this.upgraded = true;
    // Upgrades Added
    bulletSize = 18;
    bulletSpeed = 8;
    this.speed = 7;
  }
}

// Bullet class (Player)
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = bulletSize;
    this.height = bulletSize;
    this.speedX = random(-2, 2);  // Slight random movement on release
    this.speedY = -bulletSpeed;   // Always move upwards at first
    this.trail = []; // Store previous positions
  }

  update() {
    // Add current position to trail
    this.trail.push({ x: this.x, y: this.y });

    // Limit the length of the trail
    if (this.trail.length > 10) {
      this.trail.shift(); // Remove oldest position
    }

    this.x += this.speedX;
    this.y += this.speedY;

    // Bounce off walls
    if (this.x < 16 || this.x > width - 16) {
      this.speedX *= -1;
    }

    // Bounce off top (Brick Breaker-style)
    if (this.y < 20) {
      this.speedY *= -1;
    }
  }

  display() {
    // Draw trail with fading effect
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 50, 255); // Fading effect
      fill(0, 255, 255, alpha); // Cyan trail with decreasing opacity
      noStroke();
      ellipse(this.trail[i].x, this.trail[i].y, this.width / 1.5, this.height / 1.5);
    }

    // Draw the main bullet
    fill(0, 255, 255);
    ellipse(this.x, this.y, this.width, this.height);
  }

  offScreen() {
    return this.y >= height; // Only remove if it falls below screen
  }

  hits(enemy) {
    if (
      this.x > enemy.x &&
      this.x < enemy.x + enemy.width &&
      this.y > enemy.y &&
      this.y < enemy.y + enemy.height
    ) {
      this.speedY *= -1; // Reverse Y direction to bounce downward
      this.speedX += random(-1, 1); // Small random change to horizontal direction
      return true;
    }
    return false;
  }

  bounceOff(ship) {
    if (
      this.x > ship.x &&
      this.x < ship.x + ship.width &&
      this.y > ship.y &&
      this.y < ship.y + ship.height
    ) {
      this.speedY *= -1; // Reverse Y direction to bounce downward
      this.speedX += random(-1, 1); // Small random change to horizontal direction
      return true;
    }
    return false;
  }
}

// Enemy class
class Enemy {
  constructor(x, y, type = 1) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.type = type;  // 1: Enemy1, 2: Enemy2, 3: Enemy3, 4: GoldenEnemy
    this.wasGolden = false; // Track if this enemy was golden initially
    this.image = this.getImageForType();
    this.lastShootTime = 0;
    
  }

  getImageForType() {
    if (this.type === 1) {
      return enemyImg; // Enemy1 image
    } else if (this.type === 2) {
      return enemy2Img; // Enemy2 image
    } else if (this.type === 3) {
      return enemy3Img; // Enemy3 image
    } else if (this.type === 4) {
      this.wasGolden = true;
      return goldenEnemyImg;
    }
  }

  move(dx, dy) {
    this.x += dx;
    this.y += dy;
  }

  display() {
    image(this.image, this.x, this.y, this.width, this.height);
  }

}

// Enemy Bullet class
class EnemyBullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = enemyBulletSize;
    this.height = enemyBulletSize;
    this.speed = enemyBulletSpeed;
    this.trail = []; // Store previous positions
  }

  update() {
    // Add current position to trail
    this.trail.push({ x: this.x, y: this.y });

    // Limit the length of the trail
    if (this.trail.length > 10) {
      this.trail.shift(); // Remove oldest position
    }

    this.y += this.speed;
  }

  display() {
    // Draw trail with fading effect
    for (let i = 0; i < this.trail.length; i++) {
      let alpha = map(i, 0, this.trail.length, 50, 255); // Fading effect
      fill(255, 0, 0, alpha); // Red trail with decreasing opacity
      noStroke();
      ellipse(this.trail[i].x, this.trail[i].y, this.width / 1.5, this.height / 1.5);
    }

    // Draw the main bullet
    fill(255, 0, 0);
    ellipse(this.x, this.y, this.width, this.height);
  }

  offScreen() {
    return this.y > height;
  }

  hits(ship) {
    return (
      this.x > ship.x &&
      this.x < ship.x + ship.width &&
      this.y > ship.y &&
      this.y < ship.y + ship.height
    );
  }
}

// Bullet update function
function updateBullet(bullet) {
  bullet.x += bullet.vx;
  bullet.y += bullet.vy;
}

// Bullet collision with enemy
function checkBulletCollision(bullet, enemy) {
  if (bullet.x < enemy.x + enemy.width &&
      bullet.x + bullet.width > enemy.x &&
      bullet.y < enemy.y + enemy.height &&
      bullet.y + bullet.height > enemy.y) {

      // Reverse direction
      bullet.vx *= -1;
      bullet.vy *= -1;
      
      // Optionally add a slight offset to prevent getting stuck inside enemy
      bullet.x += bullet.vx;
      bullet.y += bullet.vy;

      return true; // Collision happened
  }
  return false;
}

// Player Hit
function playerHit() {
  if (invulnerable) return;

  invulnerable = true;
  ship.image = shipHitImg;
  setTimeout(() => {
    invulnerable = false;
    ship.image = shipImg;
    lives--;
    if (lives <= 0) {
      isGameOver = true;
    }
  }, 1000);
}

// Remove Player Life
function removeLife() {
  if (invulnerable) return; // Ignore hits during invulnerability

  lives--; // Deduct a life immediately
  invulnerable = true;
  ship.image = shipHitImg; // Show ShipHit.png

  setTimeout(() => {
    invulnerable = false;
    ship.upgraded = false;
    // Upgrades Removed
    bulletSize = 10;
    bulletSpeed = 5;
    ship.speed = 5;
    ship.image = shipImg; // Restore normal ship
  }, 1000); // 1 second of invulnerability

  if (lives <= 0) {
    isGameOver = true;
  }
}

// Display Player Lives
function displayLives() {
  for (let i = 0; i < lives; i++) {
    tint(255, 50);
    image(ship.image, 20 + i * 30, height - 40, 25, 25);
  }
  noTint();
}

// Display Player Bullets
function displayBullets() {
  for (let i = 0; i < bulletsAvailable; i++) {
    fill(0, 255, 255, 70);
    ellipse(32 + i * 30, height - 55, 10, 10);
  }
}

// Create Enemies for each level
function createEnemies(level) {
  let startX = 50, startY = 60, spacing = 60;
  enemies = []; // Reset enemies at the start of each level
  let enemyType;

  // Set enemy types based on the level
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 6; col++) {
      if (level === 1) {
        enemyType = 1; // Level 1: all Enemy1
      } else if (level === 2) {
        enemyType = random() < 0.5 ? 1 : 2; // Level 2: randomly either Enemy1 or Enemy2
      } else if (level === 3) {
        if (random() < 0.1) {
          enemyType = 4; // 10% chance of golden enemy
        } else {
          enemyType = random() < 0.33 ? 1 : (random() < 0.5 ? 2 : 3);
        }
      }

      enemies.push(new Enemy(startX + col * spacing, startY + row * spacing, enemyType));
    }
  }
}

// Enemy Movement
function updateEnemyMovement() {
  let moveAmount = 1;
  let leftmostX = Infinity;
  let rightmostX = -Infinity;
  let enemyWidth = 50; // Assuming enemy width is 50

  enemyMoveCounter++;

  // Find the leftmost and rightmost enemies
  for (let enemy of enemies) {
    if (enemy.x < leftmostX) leftmostX = enemy.x;
    if (enemy.x + enemy.width > rightmostX) rightmostX = enemy.x + enemy.width;
  }

  // Check if enemies are about to hit screen boundaries
  if (leftmostX + moveAmount * enemyDirection < 12 || rightmostX + moveAmount * enemyDirection > width - 12) {
    enemyDirection *= -1; // Change direction
    enemyMovingDown = true; // Move down on bounce
  }

  // Handle downward movement
  if (enemyMovingDown) {
    let moveStep = enemyMoveDownFrames / enemyMoveDownFrames;
    for (let enemy of enemies) {
      enemy.move(0, moveStep);
      if (enemy.y + enemy.height >= height - ship.height) {
        isGameOver = true; // GAME OVER if an enemy reaches the bottom
        return;
      }
    }
    enemyMoveDownProgress++;
    if (enemyMoveDownProgress >= enemyMoveDownFrames) {
      enemyMovingDown = false;
      enemyMoveDownProgress = 0;
    }
  } else {
    for (let enemy of enemies) {
      enemy.move(moveAmount * enemyDirection, 0);
    }
  }
}
