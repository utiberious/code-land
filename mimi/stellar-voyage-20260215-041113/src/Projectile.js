import * as THREE from 'three';

/**
 * Projectile class - Represents a laser fired by the player
 */
export class Projectile {
  constructor(position, direction, scene) {
    this.scene = scene;
    this.speed = 30;
    this.lifetime = 5; // seconds
    this.age = 0;
    
    // Create projectile geometry - a small glowing cube
    const geometry = new THREE.BoxGeometry(0.2, 0.2, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      emissive: 0x00ff00
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    if (position.x !== undefined) {
      this.mesh.position.set(position.x, position.y, position.z);
    } else {
      this.mesh.position.copy(position);
    }
    
    // Add glow effect
    const glowGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.2);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.3
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    this.mesh.add(glow);
    
    // Set velocity based on direction
    this.velocity = {
      x: direction.x * this.speed,
      y: direction.y * this.speed,
      z: direction.z * this.speed
    };
    
    scene.add(this.mesh);
  }
  
  /**
   * Update projectile position
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.y += this.velocity.y * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;
    
    this.age += deltaTime;
  }
  
  /**
   * Check if projectile is still alive
   * @returns {boolean} True if projectile is alive
   */
  isAlive() {
    return this.age < this.lifetime;
  }
  
  /**
   * Check if projectile is off-screen (too far away)
   * @param {number} maxDistance - Maximum distance from origin
   * @returns {boolean} True if projectile is off-screen
   */
  isOffScreen(maxDistance = 500) {
    const dist = Math.sqrt(
      this.mesh.position.x ** 2 + 
      this.mesh.position.y ** 2 + 
      this.mesh.position.z ** 2
    );
    return dist > maxDistance;
  }
  
  /**
   * Remove projectile from scene
   */
  destroy() {
    this.scene.remove(this.mesh);
  }
  
  /**
   * Get projectile position as object
   * @returns {Object} Position {x, y, z}
   */
  getPosition() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z
    };
  }
}
