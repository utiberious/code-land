import { distance } from './utils.js';

/**
 * CollisionDetector - Handles all collision detection for the game
 */
export class CollisionDetector {
  constructor() {
    // Collision radii for different object types
    this.playerRadius = 1.5;
    this.projectileRadius = 0.3;
    this.enemyRadius = 1.2;
  }
  
  /**
   * Check collision between projectile and enemy
   * @param {Object} projectile - Projectile object
   * @param {Object} enemy - Enemy object
   * @returns {boolean} True if collision detected
   */
  checkProjectileEnemyCollision(projectile, enemy) {
    const projPos = projectile.getPosition();
    const enemyPos = enemy.getPosition();
    
    const dist = distance(projPos, enemyPos);
    return dist < (this.projectileRadius + this.enemyRadius);
  }
  
  /**
   * Check collision between player and enemy
   * @param {Object} player - Player object
   * @param {Object} enemy - Enemy object
   * @returns {boolean} True if collision detected
   */
  checkPlayerEnemyCollision(player, enemy) {
    const playerPos = player.getPosition();
    const enemyPos = enemy.getPosition();
    
    const dist = distance(playerPos, enemyPos);
    return dist < (this.playerRadius + this.enemyRadius);
  }
  
  /**
   * Check collision between player and obstacle
   * @param {Object} player - Player object
   * @param {Object} obstacle - Obstacle object
   * @returns {boolean} True if collision detected
   */
  checkPlayerObstacleCollision(player, obstacle) {
    const playerPos = player.getPosition();
    const obstaclePos = obstacle.getPosition();
    const obstacleRadius = obstacle.getRadius();
    
    const dist = distance(playerPos, obstaclePos);
    return dist < (this.playerRadius + obstacleRadius);
  }
  
  /**
   * Check collision between projectile and obstacle
   * @param {Object} projectile - Projectile object
   * @param {Object} obstacle - Obstacle object
   * @returns {boolean} True if collision detected
   */
  checkProjectileObstacleCollision(projectile, obstacle) {
    const projPos = projectile.getPosition();
    const obstaclePos = obstacle.getPosition();
    const obstacleRadius = obstacle.getRadius();
    
    const dist = distance(projPos, obstaclePos);
    return dist < (this.projectileRadius + obstacleRadius);
  }
  
  /**
   * Check all collisions and return collision events
   * @param {Object} player - Player object
   * @param {Array} enemies - Array of enemies
   * @param {Array} obstacles - Array of obstacles
   * @returns {Object} Collision events object
   */
  checkAllCollisions(player, enemies, obstacles) {
    const collisions = {
      projectileEnemyHits: [],
      projectileObstacleHits: [],
      playerEnemyCollisions: [],
      playerObstacleCollisions: []
    };
    
    // Check projectile vs enemies
    for (let i = player.projectiles.length - 1; i >= 0; i--) {
      const projectile = player.projectiles[i];
      
      for (let j = enemies.length - 1; j >= 0; j--) {
        const enemy = enemies[j];
        
        if (this.checkProjectileEnemyCollision(projectile, enemy)) {
          collisions.projectileEnemyHits.push({
            projectile,
            projectileIndex: i,
            enemy,
            enemyIndex: j
          });
        }
      }
      
      // Check projectile vs obstacles
      for (let j = obstacles.length - 1; j >= 0; j--) {
        const obstacle = obstacles[j];
        
        if (this.checkProjectileObstacleCollision(projectile, obstacle)) {
          collisions.projectileObstacleHits.push({
            projectile,
            projectileIndex: i,
            obstacle,
            obstacleIndex: j
          });
        }
      }
    }
    
    // Check player vs enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      
      if (this.checkPlayerEnemyCollision(player, enemy)) {
        collisions.playerEnemyCollisions.push({
          enemy,
          enemyIndex: i
        });
      }
    }
    
    // Check player vs obstacles
    for (let i = obstacles.length - 1; i >= 0; i--) {
      const obstacle = obstacles[i];
      
      if (this.checkPlayerObstacleCollision(player, obstacle)) {
        collisions.playerObstacleCollisions.push({
          obstacle,
          obstacleIndex: i
        });
      }
    }
    
    return collisions;
  }
}
