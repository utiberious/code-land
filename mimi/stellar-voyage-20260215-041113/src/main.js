import * as THREE from 'three';
import { Game } from './Game.js';
import { MobileControls } from './MobileControls.js';

/**
 * Stellar Voyage - Main Game Entry Point
 * A 3D space shooter game built with Three.js
 */

// ============================================================================
// MOBILE DEBUGGING - Error logging and diagnostics
// ============================================================================

// Log all global errors
window.addEventListener('error', (e) => {
  const errorMsg = `Global error: ${e.error?.message || e.message}`;
  console.error(errorMsg);
  updateDebugStatus(errorMsg);
  if (e.error?.stack) {
    console.error(e.error.stack);
  }
});

// Log all unhandled promise rejections
window.addEventListener('unhandledrejection', (e) => {
  const errorMsg = `Unhandled promise rejection: ${e.reason}`;
  console.error(errorMsg);
  updateDebugStatus(errorMsg);
});

// Helper function to update debug status display
function updateDebugStatus(msg) {
  const statusDiv = document.getElementById('debug-status');
  if (statusDiv) {
    // Append timestamp and message
    const time = new Date().toLocaleTimeString();
    const entry = `[${time}] ${msg}`;
    statusDiv.innerHTML += '<br>' + entry;
    // Auto-scroll to bottom
    statusDiv.scrollTop = statusDiv.scrollHeight;
  }
  console.log('[DEBUG]', msg);
}

console.log('===== Stellar Voyage - Game Initialization Starting =====');
updateDebugStatus('Game starting...');

// Game variables
let scene, camera, renderer;
let game;
let clock;
let mobileControls;

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
  try {
    updateDebugStatus('Initializing Three.js scene...');
    
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    updateDebugStatus('✓ Scene created');
    
    // Log device and canvas info
    const width = window.innerWidth;
    const height = window.innerHeight;
    updateDebugStatus(`Canvas size: ${width}x${height}`);
    updateDebugStatus(`Device pixel ratio: ${window.devicePixelRatio}`);
    updateDebugStatus(`User Agent: ${navigator.userAgent.substring(0, 60)}...`);
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
    camera.position.set(0, 0, 30);
    camera.lookAt(0, 0, 0);
    updateDebugStatus('✓ Camera created at (0, 0, 30)');
    
    // Create renderer with enhanced diagnostics
    updateDebugStatus('Creating WebGL renderer...');
    const rendererOptions = { 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    };
    
    try {
      renderer = new THREE.WebGLRenderer(rendererOptions);
      updateDebugStatus('✓ WebGL renderer created');
    } catch (err) {
      updateDebugStatus('⚠ WebGL error: ' + err.message);
      console.error('WebGL Renderer Error:', err);
      throw err;
    }
    
    // Log WebGL context info
    const glContext = renderer.getContext();
    if (glContext) {
      updateDebugStatus(`✓ WebGL context: ${glContext.constructor.name}`);
      const vendor = glContext.getParameter(glContext.VENDOR);
      const renderer_info = glContext.getParameter(glContext.RENDERER);
      updateDebugStatus(`GPU: ${vendor} / ${renderer_info}`);
    } else {
      updateDebugStatus('⚠ WARNING: Could not access WebGL context');
    }
    
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFShadowMap;
    
    // Style the canvas to fill the viewport
    renderer.domElement.style.display = 'block';
    renderer.domElement.style.position = 'fixed';
    renderer.domElement.style.top = '0';
    renderer.domElement.style.left = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.zIndex = '0';
    renderer.domElement.style.margin = '0';
    renderer.domElement.style.padding = '0';
    
    // Add canvas to DOM
    document.body.appendChild(renderer.domElement);
    updateDebugStatus('✓ Renderer added to DOM with styling');
    
    // Verify canvas is in DOM
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const canvasStyle = window.getComputedStyle(canvas);
      updateDebugStatus(`✓ Canvas found in DOM: ${canvas.width}x${canvas.height}`);
      updateDebugStatus(`  Canvas display: ${canvasStyle.display}`);
      updateDebugStatus(`  Canvas position: ${canvasStyle.position}`);
      updateDebugStatus(`  Canvas width style: ${canvasStyle.width}`);
      updateDebugStatus(`  Canvas height style: ${canvasStyle.height}`);
      
      // Double-check visibility
      if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
        updateDebugStatus('⚠ WARNING: Canvas has zero size!');
      } else {
        updateDebugStatus(`✓ Canvas is visible: ${canvas.offsetWidth}x${canvas.offsetHeight}`);
      }
    } else {
      updateDebugStatus('⚠ WARNING: Canvas not found in DOM after appendChild!');
    }
    
    // Create lighting
    createLighting();
    updateDebugStatus('✓ Lighting created');
    
    // Create starfield background
    createStarfield();
    updateDebugStatus('✓ Starfield created');
    
    // Create game clock
    clock = new THREE.Clock();
    updateDebugStatus('✓ Clock created');
    
    updateDebugStatus('✓ Three.js initialization complete!');
  } catch (err) {
    const errorMsg = `CRITICAL: Three.js init failed: ${err.message}`;
    console.error(errorMsg, err);
    updateDebugStatus(errorMsg);
    throw err;
  }
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
 * Handle window resize (important for mobile orientation changes)
 */
function onWindowResize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  console.log('[onWindowResize] New size:', width, 'x', height);
  updateDebugStatus(`Window resized to ${width}x${height}`);
  
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
  renderer.setPixelRatio(window.devicePixelRatio);
  
  console.log('[onWindowResize] Camera and renderer updated');
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
  try {
    updateDebugStatus('=== Starting game ===');
    
    // Hide menus
    startScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    updateDebugStatus('✓ Menus hidden');
    
    // Create game if first time
    if (!game) {
      updateDebugStatus('Creating Game instance...');
      game = new Game(scene);
      updateDebugStatus('✓ Game instance created');
      
      updateDebugStatus('Initializing MobileControls...');
      mobileControls = new MobileControls(game.player);
      updateDebugStatus('✓ MobileControls initialized');
    }
    
    // Start game
    updateDebugStatus('Calling game.start()...');
    game.start();
    updateDebugStatus('✓ game.start() completed');
    
    // Verify player is in scene
    if (game.player && game.player.mesh) {
      updateDebugStatus(`✓ Player created and in scene`);
      updateDebugStatus(`  Position: (${game.player.mesh.position.x.toFixed(2)}, ${game.player.mesh.position.y.toFixed(2)}, ${game.player.mesh.position.z.toFixed(2)})`);
      updateDebugStatus(`  Scene children: ${scene.children.length}`);
    } else {
      updateDebugStatus('⚠ WARNING: Player or player.mesh is null!');
    }
  } catch (err) {
    const errorMsg = `ERROR in startGame: ${err.message}`;
    console.error(errorMsg, err);
    updateDebugStatus(errorMsg);
    if (err.stack) {
      console.error(err.stack);
    }
  }
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
let frameCount = 0;
function gameLoop() {
  requestAnimationFrame(gameLoop);
  
  const deltaTime = clock.getDelta();
  frameCount++;
  
  // Log first few frames for debugging
  if (frameCount === 1) {
    console.log('[gameLoop] First frame rendered');
  }
  if (frameCount === 5 && game && game.player) {
    console.log('[gameLoop] Frame 5: Player exists, position:', {
      x: game.player.mesh.position.x,
      y: game.player.mesh.position.y,
      z: game.player.mesh.position.z
    });
  }
  
  if (game) {
    // Update mobile controls (maps touch input to player keys)
    if (mobileControls) {
      mobileControls.update();
    }
    
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
  try {
    updateDebugStatus('Initializing DOM elements...');
    
    // Initialize DOM elements
    startScreen = document.getElementById('startScreen');
    gameOverScreen = document.getElementById('gameOverScreen');
    scoreDisplay = document.getElementById('score');
    livesDisplay = document.getElementById('lives');
    levelDisplay = document.getElementById('level');
    finalScoreDisplay = document.getElementById('finalScore');
    startButton = document.getElementById('startButton');
    restartButton = document.getElementById('restartButton');
    
    // Verify all DOM elements exist
    const domElements = {
      startScreen, gameOverScreen, scoreDisplay, livesDisplay, 
      levelDisplay, finalScoreDisplay, startButton, restartButton
    };
    
    let missingElements = [];
    for (const [name, elem] of Object.entries(domElements)) {
      if (!elem) missingElements.push(name);
    }
    
    if (missingElements.length > 0) {
      updateDebugStatus(`⚠ Missing DOM elements: ${missingElements.join(', ')}`);
    } else {
      updateDebugStatus('✓ All DOM elements found');
    }
    
    updateDebugStatus('Initializing Three.js...');
    initThreeJs();
    
    updateDebugStatus('Setting up input handlers...');
    setupInputHandlers();
    
    updateDebugStatus('Starting game loop...');
    gameLoop();
    
    updateDebugStatus('✓✓✓ INITIALIZATION COMPLETE ✓✓✓');
  } catch (err) {
    const errorMsg = `CRITICAL: Init failed: ${err.message}`;
    console.error(errorMsg, err);
    updateDebugStatus(errorMsg);
    if (err.stack) {
      console.error(err.stack);
    }
  }
}

// Start the game when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
