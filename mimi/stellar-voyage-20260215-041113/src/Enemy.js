import * as THREE from 'three';
import { getDirection, distance, random } from './utils.js';

/**
 * Enemy class - Represents enemy spacecraft
 */
export class Enemy {
  constructor(position, scene) {
    this.scene = scene;
    this.speed = 8;
    this.health = 2; // Takes 2 hits to destroy
    this.maxHealth = 2;
    
    // Create enemy geometry (similar to player but different color)
    this.createEnemyShip(position);
    
    // AI behavior
    this.behaviorTimer = 0;
    this.currentBehavior = 'chase'; // 'chase' or 'evade'
    this.behaviorChangeInterval = 3; // seconds
  }
  
  /**
   * Create the enemy ship geometry
   * @param {THREE.Vector3} position - Starting position
   */
  createEnemyShip(position) {
    // Main body - use a cone similar to player but red
    const bodyGeometry = new THREE.ConeGeometry(0.8, 2.5, 8);
    const bodyMaterial = new THREE.MeshStandardMaterial({
      color: 0xff3333,
      emissive: 0xaa0000,
      metalness: 0.6,
      roughness: 0.4
    });
    
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI / 2;
    
    // Create group for entire ship
    this.mesh = new THREE.Group();
    this.mesh.add(body);
    
    // Add wings
    const wingGeometry = new THREE.BoxGeometry(0.25, 1.5, 0.1);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0xcc0000,
      emissive: 0x880000
    });
    
    const wingLeft = new THREE.Mesh(wingGeometry, wingMaterial);
    wingLeft.position.x = -0.9;
    wingLeft.position.z = -0.4;
    
    const wingRight = new THREE.Mesh(wingGeometry, wingMaterial);
    wingRight.position.x = 0.9;
    wingRight.position.z = -0.4;
    
    this.mesh.add(wingLeft);
    this.mesh.add(wingRight);
    
    // Set position
    if (position.x !== undefined) {
      this.mesh.position.set(position.x, position.y, position.z);
    } else {
      this.mesh.position.copy(position);
    }
    this.scene.add(this.mesh);
  }
  
  /**
   * Update enemy position and behavior
   * @param {number} deltaTime - Time since last update
   * @param {Object} playerPos - Player position {x, y, z}
   * @param {number} difficulty - Current difficulty multiplier
   */
  update(deltaTime, playerPos, difficulty = 1) {
    this.behaviorTimer += deltaTime;
    
    // Change behavior periodically
    if (this.behaviorTimer > this.behaviorChangeInterval) {
      this.behaviorTimer = 0;
      this.currentBehavior = Math.random() > 0.4 ? 'chase' : 'evade';
    }
    
    let moveDirection = { x: 0, y: 0, z: 0 };
    
    // AI behavior
    if (this.currentBehavior === 'chase') {
      // Move toward player
      moveDirection = getDirection(this.getPosition(), playerPos);
    } else {
      // Evade - move away from player
      moveDirection = getDirection(playerPos, this.getPosition());
    }
    
    // Apply difficulty multiplier to speed
    const speed = this.speed * difficulty;
    this.mesh.position.x += moveDirection.x * speed * deltaTime;
    this.mesh.position.y += moveDirection.y * speed * deltaTime;
    this.mesh.position.z += moveDirection.z * speed * deltaTime;
    
    // Face player
    const angleToPlayer = Math.atan2(
      playerPos.x - this.mesh.position.x,
      playerPos.y - this.mesh.position.y
    );
    this.mesh.rotation.z = angleToPlayer;
    
    // Rotation animation
    const wings = this.mesh.children.filter(child => child.geometry.type === 'BoxGeometry');
    wings.forEach(wing => {
      wing.rotation.z += 0.05;
    });
  }
  
  /**
   * Take damage
   * @param {number} damage - Amount of damage (default 1)
   */
  takeDamage(damage = 1) {
    this.health -= damage;
  }
  
  /**
   * Check if enemy is alive
   * @returns {boolean} True if health > 0
   */
  isAlive() {
    return this.health > 0;
  }
  
  /**
   * Get enemy position
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
   * Remove enemy from scene
   */
  destroy() {
    this.scene.remove(this.mesh);
  }
}
