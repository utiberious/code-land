import { Player } from './Player.js';
import { Enemy } from './Enemy.js';
import { Obstacle } from './Obstacle.js';
import { CollisionDetector } from './CollisionDetector.js';
import { random } from './utils.js';

/**
 * Game class - Main game state and logic manager
 */
export class Game {
  constructor(scene) {
    this.scene = scene;
    
    // Game state
    this.gameState = 'menu'; // 'menu', 'playing', 'gameOver'
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.difficulty = 1;
    
    // Game objects
    this.player = null;
    this.enemies = [];
    this.obstacles = [];
    this.collisionDetector = new CollisionDetector();
    
    // Spawn management
    this.enemySpawnTimer = 0;
    this.enemySpawnInterval = 2; // seconds
    this.obstacleSpawnTimer = 0;
    this.obstacleSpawnInterval = 1.5; // seconds
    
    // Difficulty progression
    this.difficultyTimer = 0;
    this.difficultyIncreaseInterval = 30; // seconds
    
    // Bounds for spawning
    this.spawnRadius = 40;
    this.spawnZ = 25;
  }
  
  /**
    * Start a new game
    */
   start() {
     console.log('[Game.start] Starting new game...');
     
     try {
       // Reset game variables
       this.score = 0;
       this.lives = 3;
       this.level = 1;
       this.difficulty = 1;
       this.difficultyTimer = 0;
       this.enemySpawnTimer = 0;
       this.obstacleSpawnTimer = 0;
       console.log('[Game.start] Game variables reset');
       
       // Clear any existing objects
       this.cleanup();
       console.log('[Game.start] Cleanup complete');
       
       // Create player
       console.log('[Game.start] Creating Player...');
       this.player = new Player(this.scene);
       console.log('[Game.start] Player created:', this.player);
       console.log('[Game.start] Player mesh:', this.player.mesh);
       console.log('[Game.start] Player position:', {
         x: this.player.mesh.position.x,
         y: this.player.mesh.position.y,
         z: this.player.mesh.position.z
       });
       console.log('[Game.start] Scene children count:', this.scene.children.length);
       
       // Log all scene children
       this.scene.children.forEach((child, idx) => {
         console.log(`[Game.start] Scene child ${idx}: ${child.type} at (${child.position.x}, ${child.position.y}, ${child.position.z})`);
       });
       
       // Set state to playing AFTER everything is initialized
       this.gameState = 'playing';
       console.log('[Game.start] Game state set to playing');
       console.log('[Game.start] === Game start complete ===');
     } catch (err) {
       console.error('[Game.start] ERROR:', err.message, err);
       throw err;
     }
   }
  
  /**
   * Restart the game
   */
  restart() {
    this.start();
  }
  
  /**
   * End the game
   */
  gameOver() {
    this.gameState = 'gameOver';
  }
  
  /**
   * Main game update loop
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    if (this.gameState !== 'playing') return;
    if (!this.player) return; // Safety check for race conditions
    
    // Update player
    this.player.update(deltaTime);
    
    // Update enemies
    const playerPos = this.player.getPosition();
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(deltaTime, playerPos, this.difficulty);
      
      // Remove dead enemies
      if (!enemy.isAlive()) {
        enemy.destroy();
        this.enemies.splice(i, 1);
        this.score += 100;
      }
    }
    
    // Update obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obstacle = this.obstacles[i];
      obstacle.update(deltaTime);
      
      // Remove off-screen obstacles
      if (obstacle.isOffScreen()) {
        obstacle.destroy();
        this.obstacles.splice(i, 1);
      }
    }
    
    // Check collisions
    this.handleCollisions();
    
    // Spawn enemies
    this.enemySpawnTimer += deltaTime;
    if (this.enemySpawnTimer > this.enemySpawnInterval) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;
    }
    
    // Spawn obstacles
    this.obstacleSpawnTimer += deltaTime;
    if (this.obstacleSpawnTimer > this.obstacleSpawnInterval) {
      this.spawnObstacle();
      this.obstacleSpawnTimer = 0;
    }
    
    // Update difficulty
    this.difficultyTimer += deltaTime;
    if (this.difficultyTimer > this.difficultyIncreaseInterval) {
      this.increaseDifficulty();
      this.difficultyTimer = 0;
    }
    
    // Check game over condition
    if (this.lives <= 0) {
      this.gameOver();
    }
  }
  
  /**
   * Handle all collisions
   */
  handleCollisions() {
    const collisions = this.collisionDetector.checkAllCollisions(
      this.player,
      this.enemies,
      this.obstacles
    );
    
    // Remove projectiles that hit enemies (process in reverse)
    collisions.projectileEnemyHits.forEach(hit => {
      hit.enemy.takeDamage(1);
      hit.projectile.destroy();
    });
    
    // Remove projectiles from player.projectiles array in reverse order
    const projectileIndicesToRemove = new Set();
    collisions.projectileEnemyHits.forEach(hit => {
      projectileIndicesToRemove.add(hit.projectileIndex);
    });
    collisions.projectileObstacleHits.forEach(hit => {
      projectileIndicesToRemove.add(hit.projectileIndex);
    });
    
    // Remove projectiles in reverse order
    Array.from(projectileIndicesToRemove).sort((a, b) => b - a).forEach(index => {
      if (this.player.projectiles[index]) {
        this.player.projectiles[index].destroy();
        this.player.projectiles.splice(index, 1);
      }
    });
    
    // Remove projectiles that hit obstacles
    collisions.projectileObstacleHits.forEach(hit => {
      hit.obstacle.destroy();
      this.score += 10; // Bonus for dodging/destroying obstacles
    });
    
    // Remove obstacles in reverse order
    const obstacleIndicesToRemove = new Set(
      collisions.projectileObstacleHits.map(hit => hit.obstacleIndex)
    );
    Array.from(obstacleIndicesToRemove).sort((a, b) => b - a).forEach(index => {
      if (this.obstacles[index]) {
        this.obstacles.splice(index, 1);
      }
    });
    
    // Handle player collisions with enemies (deal damage)
    collisions.playerEnemyCollisions.forEach(hit => {
      this.lives -= 1;
    });
    
    // Handle player collisions with obstacles (deal damage)
    collisions.playerObstacleCollisions.forEach(hit => {
      this.lives -= 1;
    });
  }
  
  /**
   * Spawn a new enemy
   */
  spawnEnemy() {
    const x = random(-this.spawnRadius, this.spawnRadius);
    const y = random(-this.spawnRadius, this.spawnRadius);
    const z = this.spawnZ;
    
    const enemy = new Enemy(
      { x, y, z },
      this.scene
    );
    
    this.enemies.push(enemy);
  }
  
  /**
   * Spawn a new obstacle
   */
  spawnObstacle() {
    const x = random(-this.spawnRadius, this.spawnRadius);
    const y = random(-this.spawnRadius, this.spawnRadius);
    const z = this.spawnZ;
    
    const obstacle = new Obstacle(
      { x, y, z },
      this.scene
    );
    
    this.obstacles.push(obstacle);
  }
  
  /**
   * Increase difficulty
   */
  increaseDifficulty() {
    this.difficulty += 0.1;
    this.level = Math.floor(this.difficulty);
    
    // Increase spawn rates
    this.enemySpawnInterval = Math.max(0.8, 2 - this.difficulty * 0.15);
    this.obstacleSpawnInterval = Math.max(0.5, 1.5 - this.difficulty * 0.1);
  }
  
  /**
   * Clean up all game objects
   */
  cleanup() {
    // Remove all enemies
    this.enemies.forEach(enemy => enemy.destroy());
    this.enemies = [];
    
    // Remove all obstacles
    this.obstacles.forEach(obstacle => obstacle.destroy());
    this.obstacles = [];
    
    // Remove player
    if (this.player) {
      this.player.destroy();
      this.player = null;
    }
  }
  
  /**
   * Get current game state object
   * @returns {Object} Game state
   */
  getState() {
    return {
      state: this.gameState,
      score: this.score,
      lives: this.lives,
      level: this.level
    };
  }
}
