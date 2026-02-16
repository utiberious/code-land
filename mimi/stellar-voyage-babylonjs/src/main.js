import * as BABYLON from '@babylonjs/core';

// ========== 版本标记 ==========
const VERSION = 'b03c0fe';
console.log(`[Stellar Voyage] Version: ${VERSION}`);

// ========== 游戏状态 ==========
let gameState = 'menu';  // 'menu', 'playing', 'gameover'
let score = 0;
let lives = 3;
let level = 1;

// ========== 游戏对象 ==========
let player = null;
let enemies = [];
let lasers = [];

// ========== 控制状态 ==========
const keys = {};
let isShooting = false;
let lastShootTime = 0;
const shootCooldown = 250;  // ms

// ========== UI 元素 ==========
const startScreen = document.getElementById('start-screen');
const gameOverScreen = document.getElementById('game-over-screen');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const versionEl = document.getElementById('version');
const finalScoreEl = document.getElementById('final-score');

versionEl.textContent = `v${VERSION}`;

// ========== Babylon.js 初始化 ==========
const canvas = document.getElementById('renderCanvas');
const engine = new BABYLON.Engine(canvas, true, {
  preserveDrawingBuffer: true,
  stencil: true
});

// 移动端优化：限制 pixelRatio
engine.setHardwareScalingLevel(1 / Math.min(window.devicePixelRatio, 2));

const scene = new BABYLON.Scene(engine);
scene.clearColor = new BABYLON.Color3(0.01, 0.01, 0.05);  // 深蓝色太空背景

// ========== Camera ==========
const camera = new BABYLON.FreeCamera('camera', new BABYLON.Vector3(0, 0, -25), scene);
camera.setTarget(new BABYLON.Vector3(0, 0, 0));
camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;

// 设置正交相机视野
const aspect = canvas.width / canvas.height;
const orthoSize = 15;
camera.orthoTop = orthoSize;
camera.orthoBottom = -orthoSize;
camera.orthoLeft = -orthoSize * aspect;
camera.orthoRight = orthoSize * aspect;

// ========== Lights ==========
const light = new BABYLON.HemisphericLight('light', new BABYLON.Vector3(0, 1, 0), scene);
light.intensity = 0.8;

// ========== 创建 Player 飞船 ==========
function createPlayer() {
  // 飞船主体（蓝色 Box）
  const body = BABYLON.MeshBuilder.CreateBox('playerBody', {
    width: 1.5,
    height: 0.5,
    depth: 1.5
  }, scene);
  body.position.y = -10;
  
  const bodyMat = new BABYLON.StandardMaterial('playerBodyMat', scene);
  bodyMat.diffuseColor = new BABYLON.Color3(0.2, 0.5, 1);  // 蓝色
  bodyMat.emissiveColor = new BABYLON.Color3(0.1, 0.3, 0.6);
  body.material = bodyMat;

  // 飞船顶部（青色 Cone）
  const cone = BABYLON.MeshBuilder.CreateCylinder('playerCone', {
    diameterTop: 0,
    diameterBottom: 1.2,
    height: 1.5,
    tessellation: 4
  }, scene);
  cone.position.y = -10 + 1;
  cone.rotation.x = Math.PI;  // 翻转圆锥
  
  const coneMat = new BABYLON.StandardMaterial('playerConeMat', scene);
  coneMat.diffuseColor = new BABYLON.Color3(0.4, 0.8, 1);  // 亮蓝色
  coneMat.emissiveColor = new BABYLON.Color3(0.2, 0.4, 0.6);
  cone.material = coneMat;

  // 合并为一个 parent
  const playerParent = new BABYLON.TransformNode('player', scene);
  body.parent = playerParent;
  cone.parent = playerParent;
  playerParent.position.y = -10;

  player = {
    mesh: playerParent,
    body: body,
    cone: cone,
    speed: 0.3,
    bounds: { x: 12, y: 12 }
  };

  return player;
}

// ========== 创建 Enemy ==========
function createEnemy() {
  const enemy = BABYLON.MeshBuilder.CreateCylinder('enemy', {
    diameterTop: 0,
    diameterBottom: 1,
    height: 2,
    tessellation: 4
  }, scene);
  
  enemy.position.x = (Math.random() - 0.5) * 20;
  enemy.position.y = 15;
  enemy.rotation.x = Math.PI;  // 朝下
  
  const mat = new BABYLON.StandardMaterial('enemyMat', scene);
  mat.diffuseColor = new BABYLON.Color3(1, 0.2, 0.2);  // 红色
  mat.emissiveColor = new BABYLON.Color3(0.6, 0.1, 0.1);
  enemy.material = mat;

  enemies.push({
    mesh: enemy,
    speed: 0.05 + Math.random() * 0.05
  });
}

// ========== 创建 Laser ==========
function createLaser() {
  const laser = BABYLON.MeshBuilder.CreateCylinder('laser', {
    diameter: 0.2,
    height: 1.5
  }, scene);
  
  laser.position.x = player.mesh.position.x;
  laser.position.y = player.mesh.position.y + 1;
  
  const mat = new BABYLON.StandardMaterial('laserMat', scene);
  mat.diffuseColor = new BABYLON.Color3(0, 1, 1);  // 青色
  mat.emissiveColor = new BABYLON.Color3(0, 0.8, 0.8);
  laser.material = mat;

  lasers.push({
    mesh: laser,
    speed: 0.6
  });
}

// ========== 碰撞检测 ==========
function checkCollisions() {
  // Laser-Enemy 碰撞
  for (let i = lasers.length - 1; i >= 0; i--) {
    const laser = lasers[i];
    for (let j = enemies.length - 1; j >= 0; j--) {
      const enemy = enemies[j];
      
      const distance = BABYLON.Vector3.Distance(
        laser.mesh.position,
        enemy.mesh.position
      );
      
      if (distance < 1.5) {
        // 碰撞！
        laser.mesh.dispose();
        lasers.splice(i, 1);
        
        enemy.mesh.dispose();
        enemies.splice(j, 1);
        
        score += 10;
        updateHUD();
        break;
      }
    }
  }

  // Player-Enemy 碰撞
  if (player) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      const distance = BABYLON.Vector3.Distance(
        player.mesh.position,
        enemy.mesh.position
      );
      
      if (distance < 2) {
        // 玩家被击中！
        enemy.mesh.dispose();
        enemies.splice(i, 1);
        
        lives--;
        updateHUD();
        
        if (lives <= 0) {
          endGame();
        }
      }
    }
  }
}

// ========== 更新 HUD ==========
function updateHUD() {
  scoreEl.textContent = `Score: ${score}`;
  livesEl.textContent = `Lives: ${lives}`;
  levelEl.textContent = `Level: ${level}`;
}

// ========== 游戏循环 ==========
let enemySpawnTimer = 0;
const enemySpawnInterval = 120;  // frames

scene.registerBeforeRender(() => {
  if (gameState !== 'playing') return;

  // 移动 Player
  if (player) {
    if (keys['w'] || keys['ArrowUp']) {
      player.mesh.position.y += player.speed;
    }
    if (keys['s'] || keys['ArrowDown']) {
      player.mesh.position.y -= player.speed;
    }
    if (keys['a'] || keys['ArrowLeft']) {
      player.mesh.position.x -= player.speed;
    }
    if (keys['d'] || keys['ArrowRight']) {
      player.mesh.position.x += player.speed;
    }

    // 边界限制
    player.mesh.position.x = Math.max(-player.bounds.x, Math.min(player.bounds.x, player.mesh.position.x));
    player.mesh.position.y = Math.max(-player.bounds.y, Math.min(player.bounds.y, player.mesh.position.y));

    // 射击
    if (isShooting) {
      const now = Date.now();
      if (now - lastShootTime > shootCooldown) {
        createLaser();
        lastShootTime = now;
      }
    }
  }

  // 移动 Lasers
  for (let i = lasers.length - 1; i >= 0; i--) {
    lasers[i].mesh.position.y += lasers[i].speed;
    
    // 移除屏幕外的激光
    if (lasers[i].mesh.position.y > 20) {
      lasers[i].mesh.dispose();
      lasers.splice(i, 1);
    }
  }

  // 移动 Enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].mesh.position.y -= enemies[i].speed;
    
    // 移除屏幕外的敌人
    if (enemies[i].mesh.position.y < -20) {
      enemies[i].mesh.dispose();
      enemies.splice(i, 1);
    }
  }

  // 生成 Enemies
  enemySpawnTimer++;
  if (enemySpawnTimer > enemySpawnInterval) {
    createEnemy();
    enemySpawnTimer = 0;
  }

  // 碰撞检测
  checkCollisions();
});

// ========== 游戏控制 ==========
function startGame() {
  gameState = 'playing';
  score = 0;
  lives = 3;
  level = 1;
  
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  // 清理旧对象
  if (player) {
    player.mesh.dispose();
  }
  enemies.forEach(e => e.mesh.dispose());
  lasers.forEach(l => l.mesh.dispose());
  enemies = [];
  lasers = [];
  
  // 创建新 Player
  createPlayer();
  updateHUD();
}

function endGame() {
  gameState = 'gameover';
  
  finalScoreEl.textContent = `Final Score: ${score}`;
  gameOverScreen.style.display = 'flex';
}

// ========== 事件监听 ==========
document.getElementById('start-btn').addEventListener('click', startGame);
document.getElementById('restart-btn').addEventListener('click', startGame);

// 键盘控制
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  
  if (e.key === ' ' || e.key === 'Spacebar') {
    e.preventDefault();
    isShooting = true;
  }
});

window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  
  if (e.key === ' ' || e.key === 'Spacebar') {
    isShooting = false;
  }
});

// 触摸控制（移动端）
let touchStartX = 0;
let touchStartY = 0;
let touchMoveX = 0;
let touchMoveY = 0;
let isTouching = false;

canvas.addEventListener('touchstart', (e) => {
  e.preventDefault();
  isTouching = true;
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
  isShooting = true;  // 触摸时自动射击
});

canvas.addEventListener('touchmove', (e) => {
  e.preventDefault();
  if (!isTouching) return;
  
  touchMoveX = e.touches[0].clientX;
  touchMoveY = e.touches[0].clientY;
  
  const deltaX = touchMoveX - touchStartX;
  const deltaY = touchMoveY - touchStartY;
  
  if (player) {
    player.mesh.position.x += deltaX * 0.02;
    player.mesh.position.y -= deltaY * 0.02;  // Y 反向
    
    // 边界限制
    player.mesh.position.x = Math.max(-player.bounds.x, Math.min(player.bounds.x, player.mesh.position.x));
    player.mesh.position.y = Math.max(-player.bounds.y, Math.min(player.bounds.y, player.mesh.position.y));
  }
  
  touchStartX = touchMoveX;
  touchStartY = touchMoveY;
});

canvas.addEventListener('touchend', (e) => {
  e.preventDefault();
  isTouching = false;
  isShooting = false;
});

// ========== 渲染循环 ==========
engine.runRenderLoop(() => {
  scene.render();
});

// ========== 响应式 ==========
window.addEventListener('resize', () => {
  engine.resize();
  
  // 更新正交相机视野
  const aspect = canvas.width / canvas.height;
  camera.orthoLeft = -orthoSize * aspect;
  camera.orthoRight = orthoSize * aspect;
});

console.log('[Stellar Voyage] Game initialized. Click "Start Game" to begin!');
