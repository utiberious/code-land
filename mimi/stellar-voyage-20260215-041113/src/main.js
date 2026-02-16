import * as THREE from 'three';
import { Game } from './Game.js';
import { MobileControls } from './MobileControls.js';

/**
 * Stellar Voyage - Main Game Entry Point
 * A 3D space shooter game built with Three.js
 */

const VERSION = 'mobile-fix-v1'; // Git commit hash for version tracking
console.log('===== Stellar Voyage - Game Initialization Starting =====');
console.log('VERSION:', VERSION, '(Mobile canvas fix: clamped pixelRatio)');

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
let controlsHelpOverlay;
let controlsHelpBtn;
let controlsHelpShown = false;

/**
 * Initialize the Three.js scene, camera, and renderer
 */
function initThreeJs() {
   try {
     console.log('Initializing Three.js scene...');
     
     // Create scene
     scene = new THREE.Scene();
     scene.background = new THREE.Color(0x000011);
     console.log('✓ Scene created');
     
     // Log device and canvas info
     const width = window.innerWidth;
     const height = window.innerHeight;
     console.log(`Canvas size: ${width}x${height}`);
     console.log(`Device pixel ratio: ${window.devicePixelRatio}`);
     console.log(`User Agent: ${navigator.userAgent.substring(0, 60)}...`);
     
     // Create camera
     camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 2000);
     camera.position.set(0, 0, 25);  // Closer for better visibility
     camera.lookAt(0, 0, 0);
     console.log('✓ Camera created at (0, 0, 25) - closer for test cube');
     
     // Create renderer
     console.log('Creating WebGL renderer...');
     const rendererOptions = { 
       antialias: true,
       alpha: true,
       powerPreference: 'high-performance'
     };
     
     try {
       renderer = new THREE.WebGLRenderer(rendererOptions);
       console.log('✓ WebGL renderer created');
     } catch (err) {
       console.error('⚠ WebGL error: ' + err.message);
       console.error('WebGL Renderer Error:', err);
       throw err;
     }
     
     // Log WebGL context info
     const glContext = renderer.getContext();
     if (glContext) {
       console.log(`✓ WebGL context: ${glContext.constructor.name}`);
       const vendor = glContext.getParameter(glContext.VENDOR);
       const renderer_info = glContext.getParameter(glContext.RENDERER);
       console.log(`GPU: ${vendor} / ${renderer_info}`);
     } else {
       console.warn('⚠ WARNING: Could not access WebGL context');
     }
     
     // MOBILE FIX: Clamp pixel ratio to prevent huge canvas sizes
     const pixelRatio = Math.min(window.devicePixelRatio, 2);
     console.log(`Pixel ratio: device=${window.devicePixelRatio}, using=${pixelRatio}`);
     
     renderer.setSize(width, height);
     renderer.setPixelRatio(pixelRatio); // Use clamped ratio
     renderer.shadowMap.enabled = false; // Disable shadows for mobile performance
     renderer.shadowMap.type = THREE.PCFShadowMap;
     
     // Style the canvas to fill the viewport
     renderer.domElement.style.display = 'block';
     renderer.domElement.style.position = 'fixed';
     renderer.domElement.style.top = '0';
     renderer.domElement.style.left = '0';
     renderer.domElement.style.width = '100vw';  // Use viewport units for mobile
     renderer.domElement.style.height = '100vh'; // Use viewport units for mobile
     renderer.domElement.style.zIndex = '1'; // Above background, below UI
     renderer.domElement.style.margin = '0';
     renderer.domElement.style.padding = '0';
     renderer.domElement.style.touchAction = 'none'; // Prevent touch scrolling
     
     // Log actual canvas dimensions for debugging
     console.log(`Canvas buffer size: ${renderer.domElement.width}x${renderer.domElement.height}`);
     
     // Add canvas to DOM
     document.body.appendChild(renderer.domElement);
     console.log('✓ Renderer added to DOM with styling');
     
     // Verify canvas is in DOM
     const canvas = document.querySelector('canvas');
     if (canvas) {
       const canvasStyle = window.getComputedStyle(canvas);
       console.log(`✓ Canvas found in DOM: ${canvas.width}x${canvas.height}`);
       console.log(`  Canvas display: ${canvasStyle.display}`);
       console.log(`  Canvas position: ${canvasStyle.position}`);
       console.log(`  Canvas width style: ${canvasStyle.width}`);
       console.log(`  Canvas height style: ${canvasStyle.height}`);
       
       // Double-check visibility
       if (canvas.offsetWidth === 0 || canvas.offsetHeight === 0) {
         console.warn('⚠ WARNING: Canvas has zero size!');
       } else {
         console.log(`✓ Canvas is visible: ${canvas.offsetWidth}x${canvas.offsetHeight}`);
       }
     } else {
       console.warn('⚠ WARNING: Canvas not found in DOM after appendChild!');
     }
     
     // Create lighting
     createLighting();
     console.log('✓ Lighting created');
     
     // Create starfield background
     createStarfield();
     console.log('✓ Starfield created');
     
     // Create game clock
     clock = new THREE.Clock();
     console.log('✓ Clock created');
     
     console.log('✓ Three.js initialization complete!');
   } catch (err) {
     const errorMsg = `CRITICAL: Three.js init failed: ${err.message}`;
     console.error(errorMsg, err);
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
   
   camera.aspect = width / height;
   camera.updateProjectionMatrix();
   
   // MOBILE FIX: Use clamped pixel ratio
   const pixelRatio = Math.min(window.devicePixelRatio, 2);
   renderer.setSize(width, height);
   renderer.setPixelRatio(pixelRatio);
   
   console.log('[onWindowResize] Camera and renderer updated');
   console.log(`  Canvas buffer: ${renderer.domElement.width}x${renderer.domElement.height}`);
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
   
   // Controls help overlay
   if (controlsHelpBtn) {
     controlsHelpBtn.addEventListener('click', () => {
       controlsHelpOverlay.style.display = 'none';
     });
   }
   
   // Handle window resize
   window.addEventListener('resize', onWindowResize);
 }
 
 /**
  * Show controls help overlay once on first game start
  */
 function showControlsHelpOnce() {
   if (!controlsHelpShown && controlsHelpOverlay) {
     controlsHelpOverlay.style.display = 'block';
     controlsHelpShown = true;
   }
 }

/**
 * Start a new game
 */
function startGame() {
   try {
     console.log('=== Starting game ===');
     
     // Hide menus
     startScreen.style.display = 'none';
     gameOverScreen.style.display = 'none';
     console.log('✓ Menus hidden');
     
     // Create game if first time
     if (!game) {
       console.log('Creating Game instance...');
       game = new Game(scene);
       console.log('✓ Game instance created');
       
       console.log('Initializing MobileControls...');
       mobileControls = new MobileControls(game.player);
       // Activate mobile controls mode if mobile controls were created
       if (mobileControls.isMobile) {
         game.player.mobileControlsActive = true;
         console.log('✓ Mobile controls activated');
       }
       console.log('✓ MobileControls initialized');
     }
     
     // Start game
     console.log('Calling game.start()...');
     game.start();
     console.log('✓ game.start() completed');
     
     // Show controls help on first game start
     showControlsHelpOnce();
     
     // Verify player is in scene
     if (game.player && game.player.mesh) {
       console.log(`✓ Player created and in scene`);
       console.log(`  Position: (${game.player.mesh.position.x.toFixed(2)}, ${game.player.mesh.position.y.toFixed(2)}, ${game.player.mesh.position.z.toFixed(2)})`);
       console.log(`  Scene children: ${scene.children.length}`);
     } else {
       console.warn('⚠ WARNING: Player or player.mesh is null!');
     }
   } catch (err) {
     const errorMsg = `ERROR in startGame: ${err.message}`;
     console.error(errorMsg, err);
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
     console.log('Initializing DOM elements...');
     
     // Initialize DOM elements
     startScreen = document.getElementById('startScreen');
     gameOverScreen = document.getElementById('gameOverScreen');
     scoreDisplay = document.getElementById('score');
     livesDisplay = document.getElementById('lives');
     levelDisplay = document.getElementById('level');
     finalScoreDisplay = document.getElementById('finalScore');
     startButton = document.getElementById('startButton');
     restartButton = document.getElementById('restartButton');
     controlsHelpOverlay = document.getElementById('controls-help');
     controlsHelpBtn = document.getElementById('controls-help-btn');
     
     // Verify all DOM elements exist
     const domElements = {
       startScreen, gameOverScreen, scoreDisplay, livesDisplay, 
       levelDisplay, finalScoreDisplay, startButton, restartButton,
       controlsHelpOverlay, controlsHelpBtn
     };
     
     let missingElements = [];
     for (const [name, elem] of Object.entries(domElements)) {
       if (!elem) missingElements.push(name);
     }
     
     if (missingElements.length > 0) {
       console.warn(`⚠ Missing DOM elements: ${missingElements.join(', ')}`);
     } else {
       console.log('✓ All DOM elements found');
     }
     
     console.log('Initializing Three.js...');
     initThreeJs();
     
     console.log('Setting up input handlers...');
     setupInputHandlers();
     
     console.log('Starting game loop...');
     gameLoop();
     
     console.log('✓✓✓ INITIALIZATION COMPLETE ✓✓✓');
   } catch (err) {
     const errorMsg = `CRITICAL: Init failed: ${err.message}`;
     console.error(errorMsg, err);
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
