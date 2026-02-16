import {
  Engine,
  Scene,
  FreeCamera,
  Vector3,
  HemisphericLight,
  Color3,
  Color4,
  MeshBuilder,
  StandardMaterial,
  PointerEventTypes,
  KeyboardEventTypes
} from '@babylonjs/core';

console.log('🚀 Stellar Voyage - Babylon.js Edition');

// Mobile detection
const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || 
                (window.matchMedia && window.matchMedia('(max-width: 768px)').matches);

console.log('Device:', isMobile ? 'Mobile' : 'Desktop');

// Game state
let gameState = 'menu'; // 'menu', 'playing', 'gameOver'
let score = 0;
let lives = 3;

// Game objects
let playerShip;
let enemies = [];
let projectiles = [];
let keys = {};
let touchJoystick = null;

// DOM elements
const canvas = document.getElementById('gameCanvas');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const startButton = document.getElementById('startButton');
const restartButton = document.getElementById('restartButton');
const scoreDisplay = document.getElementById('score');
const livesDisplay = document.getElementById('lives');
const finalScoreDisplay = document.getElementById('finalScore');

// Create engine
const engineOptions = {
  adaptToDeviceRatio: true,
  powerPreference: 'high-performance',
  antialias: !isMobile,
  stencil: !isMobile
};

const engine = new Engine(canvas, true, engineOptions);

// Clamp pixel ratio for mobile performance
const pixelRatio = Math.min(window.devicePixelRatio, 2);
engine.setHardwareScalingLevel(isMobile ? 1/pixelRatio : 1);

console.log(`Engine created - Pixel Ratio: ${window.devicePixelRatio} (using ${pixelRatio})`);

// Create scene
const scene = new Scene(engine);
scene.clearColor = new Color4(0, 0, 0.1, 1);

// Disable heavy features on mobile
if (isMobile) {
  scene.autoClear = false;
  scene.autoClearDepthAndStencil = false;
}

// Create camera
const camera = new FreeCamera('camera', new Vector3(0, 8, -25), scene);
camera.setTarget(new Vector3(0, 0, 10));
camera.minZ = 0.1;

// Create lighting
const light = new HemisphericLight('light', new Vector3(0, 1, 0), scene);
light.intensity = 0.7;

// Create starfield
createStarfield();

// Player ship
function createPlayer() {
  const ship = MeshBuilder.CreateBox('player', { width: 1, height: 0.5, depth: 2 }, scene);
  const nose = MeshBuilder.CreateCone('nose', { diameterBottom: 0.8, diameterTop: 0, height: 1 }, scene);
  nose.position.z = 1.5;
  nose.parent = ship;
  
  const material = new StandardMaterial('playerMat', scene);
  material.diffuseColor = new Color3(0.2, 0.6, 1);
  material.emissiveColor = new Color3(0.1, 0.3, 0.5);
  ship.material = material;
  nose.material = material;
  
  ship.position = new Vector3(0, 0, -5);
  
  return {
    mesh: ship,
    velocity: new Vector3(0, 0, 0),
    speed: 15,
    shootCooldown: 0
  };
}

// Enemy ship
function createEnemy(position) {
  const enemy = MeshBuilder.CreateBox('enemy', { size: 1.5 }, scene);
  const material = new StandardMaterial('enemyMat', scene);
  material.diffuseColor = new Color3(1, 0.2, 0.2);
  material.emissiveColor = new Color3(0.5, 0.1, 0.1);
  enemy.material = material;
  enemy.position = position;
  
  return {
    mesh: enemy,
    velocity: new Vector3(0, 0, -5),
    health: 2
  };
}

// Projectile
function createProjectile(position, direction, isPlayerProjectile = true) {
  const projectile = MeshBuilder.CreateCylinder('projectile', { 
    height: 1.5, 
    diameter: 0.2 
  }, scene);
  
  const material = new StandardMaterial('projectileMat', scene);
  if (isPlayerProjectile) {
    material.emissiveColor = new Color3(0, 1, 1);
  } else {
    material.emissiveColor = new Color3(1, 0.5, 0);
  }
  projectile.material = material;
  projectile.position = position.clone();
  projectile.rotation.x = Math.PI / 2;
  
  return {
    mesh: projectile,
    velocity: direction.scale(30),
    isPlayerProjectile
  };
}

// Starfield
function createStarfield() {
  const starCount = isMobile ? 500 : 1000;
  const stars = [];
  
  for (let i = 0; i < starCount; i++) {
    const star = MeshBuilder.CreateSphere(`star${i}`, { diameter: 0.2 }, scene);
    star.position = new Vector3(
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200,
      (Math.random() - 0.5) * 200 + 50
    );
    
    const material = new StandardMaterial(`starMat${i}`, scene);
    material.emissiveColor = new Color3(1, 1, 1);
    star.material = material;
    
    stars.push(star);
  }
}

// Input handling
scene.onKeyboardObservable.add((kbInfo) => {
  if (gameState !== 'playing') return;
  
  if (kbInfo.type === KeyboardEventTypes.KEYDOWN) {
    keys[kbInfo.event.key.toLowerCase()] = true;
    
    if (kbInfo.event.key === ' ' && playerShip.shootCooldown <= 0) {
      shoot();
      kbInfo.event.preventDefault();
    }
  } else if (kbInfo.type === KeyboardEventTypes.KEYUP) {
    keys[kbInfo.event.key.toLowerCase()] = false;
  }
});

// Touch/Mouse shooting
scene.onPointerObservable.add((pointerInfo) => {
  if (gameState !== 'playing') return;
  if (pointerInfo.type === PointerEventTypes.POINTERDOWN) {
    if (playerShip.shootCooldown <= 0) {
      shoot();
    }
  }
});

// Shoot function
function shoot() {
  if (!playerShip) return;
  const projectile = createProjectile(
    playerShip.mesh.position,
    new Vector3(0, 0, 1),
    true
  );
  projectiles.push(projectile);
  playerShip.shootCooldown = 0.3;
}

// Start game
function startGame() {
  console.log('Starting game...');
  gameState = 'playing';
  score = 0;
  lives = 3;
  
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  // Clear old objects
  enemies.forEach(e => e.mesh.dispose());
  projectiles.forEach(p => p.mesh.dispose());
  enemies = [];
  projectiles = [];
  
  // Create player
  if (playerShip) playerShip.mesh.dispose();
  playerShip = createPlayer();
  
  updateHUD();
}

// Game over
function gameOver() {
  console.log('Game Over!');
  gameState = 'gameOver';
  gameOverScreen.style.display = 'flex';
  finalScoreDisplay.textContent = score;
}

// Update HUD
function updateHUD() {
  scoreDisplay.textContent = score;
  livesDisplay.textContent = lives;
}

// Enemy spawning
let enemySpawnTimer = 0;
function spawnEnemy() {
  const x = (Math.random() - 0.5) * 20;
  const z = 50;
  const enemy = createEnemy(new Vector3(x, 0, z));
  enemies.push(enemy);
}

// Game loop
let lastTime = Date.now();
engine.runRenderLoop(() => {
  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000;
  lastTime = now;
  
  if (gameState === 'playing') {
    updateGame(deltaTime);
  }
  
  scene.render();
});

function updateGame(deltaTime) {
  if (!playerShip) return;
  
  // Player movement
  const inputDir = new Vector3(0, 0, 0);
  if (keys['w'] || keys['arrowup']) inputDir.z += 1;
  if (keys['s'] || keys['arrowdown']) inputDir.z -= 1;
  if (keys['a'] || keys['arrowleft']) inputDir.x -= 1;
  if (keys['d'] || keys['arrowright']) inputDir.x += 1;
  if (keys['q']) inputDir.y += 1;
  if (keys['e']) inputDir.y -= 1;
  
  if (inputDir.length() > 0) {
    inputDir.normalize();
    playerShip.velocity = inputDir.scale(playerShip.speed);
  } else {
    playerShip.velocity.scaleInPlace(0.9);
  }
  
  playerShip.mesh.position.addInPlace(playerShip.velocity.scale(deltaTime));
  
  // Clamp player position
  playerShip.mesh.position.x = Math.max(-15, Math.min(15, playerShip.mesh.position.x));
  playerShip.mesh.position.y = Math.max(-5, Math.min(10, playerShip.mesh.position.y));
  playerShip.mesh.position.z = Math.max(-10, Math.min(20, playerShip.mesh.position.z));
  
  // Shoot cooldown
  if (playerShip.shootCooldown > 0) {
    playerShip.shootCooldown -= deltaTime;
  }
  
  // Update projectiles
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    proj.mesh.position.addInPlace(proj.velocity.scale(deltaTime));
    
    // Remove if out of bounds
    if (Math.abs(proj.mesh.position.z) > 60) {
      proj.mesh.dispose();
      projectiles.splice(i, 1);
    }
  }
  
  // Update enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const enemy = enemies[i];
    enemy.mesh.position.addInPlace(enemy.velocity.scale(deltaTime));
    
    // Remove if out of bounds
    if (enemy.mesh.position.z < -20) {
      enemy.mesh.dispose();
      enemies.splice(i, 1);
      lives--;
      updateHUD();
      if (lives <= 0) gameOver();
    }
  }
  
  // Collision detection
  for (let i = projectiles.length - 1; i >= 0; i--) {
    const proj = projectiles[i];
    if (!proj.isPlayerProjectile) continue;
    
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      const distance = Vector3.Distance(proj.mesh.position, enemy.mesh.position);
      
      if (distance < 1.5) {
        // Hit!
        enemy.health--;
        proj.mesh.dispose();
        projectiles.splice(i, 1);
        
        if (enemy.health <= 0) {
          enemy.mesh.dispose();
          enemies.splice(j, 1);
          score += 10;
          updateHUD();
        }
        break;
      }
    }
  }
  
  // Spawn enemies
  enemySpawnTimer += deltaTime;
  if (enemySpawnTimer > 2) {
    spawnEnemy();
    enemySpawnTimer = 0;
  }
}

// Resize handling
window.addEventListener('resize', () => {
  engine.resize();
  console.log(`Resized: ${window.innerWidth}x${window.innerHeight}`);
});

// Button listeners
startButton.addEventListener('click', startGame);
restartButton.addEventListener('click', startGame);

console.log('Game initialized. Click Start to begin!');
