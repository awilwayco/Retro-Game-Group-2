// Retro Game Project //

// Changeable Game Values
let lives = 3;
let bulletSize = 10;
let bulletSpeed = 5;
let bulletCooldown = 400;
let enemyBulletSpeed = 2;
let enemyBulletSize = 5;

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
let enemyMoveDownFrames = 20;
let enemyMoveDownProgress = 0;
let invulnerable = false;
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
        
        bullets.splice(i, 1); // Always remove the bullet
        break;
      }
    }
  
    if (bullets[i] && bullets[i].offScreen()) {
      bullets.splice(i, 1);
    }
  }  

  // Hold down Space Bar for Shooting
  if (keyIsDown(32) && millis() - lastBulletTime > bulletCooldown) {
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

  // Check for all enemies killed
  if (enemies.length === 0) {
    nextLevel();
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
    if (millis() - lastBulletTime > bulletCooldown) {
      bullets.push(new Bullet(ship.x + ship.width / 2, ship.y));
      lastBulletTime = millis();
    }
  }
}

// Show Title Screen
function showTitleScreen() {
  image(titleImg, 0, 0, width, height);

  // Green Highlighting on Hover
  let buttonX = 201, buttonY = 315, buttonWidth = 99, buttonHeight = 50;
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
  lastBulletTime = 0;
  lastHitTime = 0;
  enemyDirection = 1;
  enemyMoveCounter = 0;
  enemyMovingDown = false;
  enemyMoveDownFrames = 20;
  enemyMoveDownProgress = 0;
  invulnerable = false;
  lives = 3;
  level = 1;
  ship = new Ship(width / 2, height - 60);
  createEnemies(level);
}

// Ship class (Player)
class Ship {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 50;
    this.height = 50;
    this.image = shipImg;
    this.upgraded = false;
  }

  update() {
    if (keyIsDown(LEFT_ARROW) || keyIsDown(65)) {
      this.x -= 5;
    } else if (keyIsDown(RIGHT_ARROW) || keyIsDown(68)) {
      this.x += 5;
    }
    this.x = constrain(this.x, 0, width - this.width);
  }

  display() {
    image(this.image, this.x, this.y, this.width, this.height);
  }

  upgradeShip() {
    this.image = shipUpgradeImg;
    this.upgraded = true;
    bulletSize = 5;
    bulletSpeed = 10;
    bulletCooldown = 300;
  }
}

// Bullet class (Player)
class Bullet {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = bulletSize;
    this.height = bulletSize;
    this.speed = bulletSpeed;
  }

  update() {
    this.y -= this.speed;
  }

  display() {
    fill(0, 255, 255);
    ellipse(this.x, this.y, this.width, this.height);
  }

  offScreen() {
    return this.y < 0;
  }

  hits(enemy) {
    // Check if the bullet is colliding with the enemy
    if (
      this.x > enemy.x &&
      this.x < enemy.x + enemy.width &&
      this.y > enemy.y &&
      this.y < enemy.y + enemy.height
    ) {
      return true; // Signal that the bullet should be removed
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
  }

  update() {
    this.y += this.speed;
  }

  display() {
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
    bulletSize = 10;
    bulletSpeed = 5;
    bulletCooldown = 400;
    ship.image = shipImg; // Restore normal ship
  }, 1000); // 1 second of invulnerability

  if (lives <= 0) {
    isGameOver = true;
  }
}

// Display Player Lives
function displayLives() {
  for (let i = 0; i < lives; i++) {
    image(ship.image, 20 + i * 30, height - 40, 25, 25);
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
  if (leftmostX + moveAmount * enemyDirection < 0 || rightmostX + moveAmount * enemyDirection > width) {
    enemyDirection *= -1; // Change direction
    enemyMovingDown = true; // Move down on bounce
  }

  // Handle downward movement
  if (enemyMovingDown) {
    let moveStep = 20 / enemyMoveDownFrames;
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
