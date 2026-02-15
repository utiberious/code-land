import * as THREE from 'three';
import { random, randomInt } from './utils.js';

/**
 * Obstacle class - Represents asteroids and debris
 */
export class Obstacle {
  constructor(position, scene) {
    this.scene = scene;
    this.speed = 3;
    this.rotationSpeed = {
      x: random(-2, 2),
      y: random(-2, 2),
      z: random(-2, 2)
    };
    
    // Random size
    this.size = random(0.5, 2);
    
    // Create random asteroid geometry
    this.createAsteroid(position);
    
    // Velocity (drift direction)
    this.velocity = {
      x: random(-3, 3),
      y: random(-3, 3),
      z: random(-3, 3)
    };
  }
  
  /**
   * Create asteroid geometry with random shape
   * @param {THREE.Vector3} position - Starting position
   */
  createAsteroid(position) {
    // Use different geometries for variety
    const geometryType = randomInt(0, 3);
    let geometry;
    
    switch (geometryType) {
      case 0:
        // Sphere
        geometry = new THREE.IcosahedronGeometry(this.size, 2);
        break;
      case 1:
        // Cube with random scale
        geometry = new THREE.BoxGeometry(this.size, this.size * 0.8, this.size * 1.2);
        break;
      case 2:
        // Octahedron
        geometry = new THREE.OctahedronGeometry(this.size);
        break;
      default:
        // Dodecahedron
        geometry = new THREE.DodecahedronGeometry(this.size);
    }
    
    // Use gray material for asteroids
    const material = new THREE.MeshStandardMaterial({
      color: 0x888888,
      roughness: 0.8,
      metalness: 0.2
    });
    
    this.mesh = new THREE.Mesh(geometry, material);
    if (position.x !== undefined) {
      this.mesh.position.set(position.x, position.y, position.z);
    } else {
      this.mesh.position.copy(position);
    }
    
    // Random initial rotation
    this.mesh.rotation.x = random(0, Math.PI * 2);
    this.mesh.rotation.y = random(0, Math.PI * 2);
    this.mesh.rotation.z = random(0, Math.PI * 2);
    
    this.scene.add(this.mesh);
  }
  
  /**
   * Update obstacle position and rotation
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // Update position (drift)
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.y += this.velocity.y * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;
    
    // Update rotation
    this.mesh.rotation.x += this.rotationSpeed.x * deltaTime;
    this.mesh.rotation.y += this.rotationSpeed.y * deltaTime;
    this.mesh.rotation.z += this.rotationSpeed.z * deltaTime;
  }
  
  /**
   * Check if obstacle is off-screen
   * @param {number} maxDistance - Maximum distance from origin
   * @returns {boolean} True if off-screen
   */
  isOffScreen(maxDistance = 600) {
    const dist = Math.sqrt(
      this.mesh.position.x ** 2 + 
      this.mesh.position.y ** 2 + 
      this.mesh.position.z ** 2
    );
    return dist > maxDistance;
  }
  
  /**
   * Get obstacle position
   * @returns {Object} Position {x, y, z}
   */
  getPosition() {
    return {
      x: this.mesh.position.x,
      y: this.mesh.position.y,
      z: this.mesh.position.z
    };
  }
  
  /**
   * Get obstacle radius for collision detection
   * @returns {number} Collision radius
   */
  getRadius() {
    return this.size * 1.5;
  }
  
  /**
   * Remove obstacle from scene
   */
  destroy() {
    this.scene.remove(this.mesh);
  }
}
