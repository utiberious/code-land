import * as THREE from 'three';
import { Game } from './Game.js';

/**
 * Stellar Voyage - Main Game Entry Point
 * A 3D space shooter game built with Three.js
 */

// Game variables
let scene, camera, renderer;
let game;
let clock;

// DOM elements (will be initialized in init())
let startScreen;
let gameOverScreen;
let scoreDisplay;
let livesDisplay;
let levelDisplay;
let finalScoreDisplay;
let startButton;
let restartButton;

/**
 * Initialize the Three.js scene, camera, and renderer
 */
function initThreeJs() {
  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000011);
  
  // Create camera
  const width = window.innerWidth;
  const height = window.innerHeight;
  camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
  camera.position.set(0, 0, 30);
  camera.lookAt(0, 0, 0);
  
  // Create renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(width, height);
   renderer.shadowMap.enabled = true;
   renderer.shadowMap.type = THREE.PCFShadowMap;
  document.body.appendChild(renderer.domElement);
  
  // Create lighting
  createLighting();
  
  // Create starfield background
  createStarfield();
  
  // Create game clock
  clock = new THREE.Clock();
}

/**
 * Create lighting for the scene
 */
function createLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);
  
  // Directional light for shadows and depth
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(50, 50, 50);
  directionalLight.castShadow = true;
  directionalLight.shadow.mapSize.width = 2048;
  directionalLight.shadow.mapSize.height = 2048;
  directionalLight.shadow.camera.far = 2000;
  directionalLight.shadow.camera.left = -100;
  directionalLight.shadow.camera.right = 100;
  directionalLight.shadow.camera.top = 100;
  directionalLight.shadow.camera.bottom = -100;
  scene.add(directionalLight);
  
  // Point light for dynamic lighting
  const pointLight = new THREE.PointLight(0x0088ff, 0.5);
  pointLight.position.set(0, 0, 50);
  scene.add(pointLight);
}

/**
 * Create a starfield background using particles
 */
function createStarfield() {
  const starCount = 1000;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(starCount * 3);
  
  // Generate random star positions
  for (let i = 0; i < starCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 2000;     // x
    positions[i + 1] = (Math.random() - 0.5) * 2000; // y
    positions[i + 2] = (Math.random() - 0.5) * 2000; // z
  }
  
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  
  // Create star material
  const material = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.5,
    sizeAttenuation: true
  });
  
  const stars = new THREE.Points(geometry, material);
  scene.add(stars);
}

/**
 * Handle window resize
 */
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/**
 * Handle keyboard input
 */
function setupInputHandlers() {
  document.addEventListener('keydown', (e) => {
    if (game && game.gameState === 'playing') {
      game.player.onKeyDown(e.key);
      
      // Handle space for shooting
      if (e.key === ' ') {
        game.player.shoot();
        e.preventDefault();
      }
    }
  });
  
  document.addEventListener('keyup', (e) => {
    if (game && game.gameState === 'playing') {
      game.player.onKeyUp(e.key);
    }
  });
  
  // Handle mouse click for shooting
  document.addEventListener('click', () => {
    if (game && game.gameState === 'playing') {
      game.player.shoot();
    }
  });
  
  // Start button
  if (startButton) {
    startButton.addEventListener('click', () => {
      startGame();
    });
  }
  
  // Restart button
  if (restartButton) {
    restartButton.addEventListener('click', () => {
      startGame();
    });
  }
  
  // Handle window resize
  window.addEventListener('resize', onWindowResize);
}

/**
 * Start a new game
 */
function startGame() {
  // Hide menus
  startScreen.style.display = 'none';
  gameOverScreen.style.display = 'none';
  
  // Create game if first time
  if (!game) {
    game = new Game(scene);
  }
  
  // Start game
  game.start();
}

/**
 * Update HUD display
 */
function updateHUD() {
  if (!game) return;
  
  const state = game.getState();
  scoreDisplay.textContent = state.score;
  livesDisplay.textContent = state.lives;
  levelDisplay.textContent = state.level;
}

/**
 * Show game over screen
 */
function showGameOverScreen() {
  gameOverScreen.style.display = 'flex';
  finalScoreDisplay.textContent = game.getState().score;
}

/**
 * Main game loop
 */
function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = clock.getDelta();
  
  if (game) {
    // Update game
    game.update(deltaTime);
    
    // Update HUD
    updateHUD();
    
    // Check for game over transition
    if (game.gameState === 'gameOver' && gameOverScreen.style.display === 'none') {
      showGameOverScreen();
    }
  }
  
  // Render scene
  renderer.render(scene, camera);
}

/**
 * Initialize the game
 */
function init() {
  // Initialize DOM elements
  startScreen = document.getElementById('startScreen');
  gameOverScreen = document.getElementById('gameOverScreen');
  scoreDisplay = document.getElementById('score');
  livesDisplay = document.getElementById('lives');
  levelDisplay = document.getElementById('level');
  finalScoreDisplay = document.getElementById('finalScore');
  startButton = document.getElementById('startButton');
  restartButton = document.getElementById('restartButton');
  
  initThreeJs();
  setupInputHandlers();
  gameLoop();
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
