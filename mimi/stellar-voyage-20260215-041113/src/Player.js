import * as THREE from 'three';
import { Projectile } from './Projectile.js';
import { getDirection } from './utils.js';

/**
 * Player class - Represents the player's spaceship
 */
export class Player {
   constructor(scene) {
     console.log('[Player] Constructor called');
     this.scene = scene;
     this.thrust = 30;
     this.rotationSpeed = 2.5;
     this.shootCooldown = 0;
     this.shootCooldownMax = 0.2; // seconds
     
     // Movement state
     this.velocity = { x: 0, y: 0, z: 0 };
     this.keys = {};
     
     // Friction for inertia-based movement
     this.friction = 0.92;
     
     // Projectiles and engine glow arrays (MUST be initialized BEFORE createShip)
     this.projectiles = [];
     this.engineGlows = [];
     
     console.log('[Player] Properties initialized, calling createShip()...');
     
     // Create spaceship geometry (detailed fighter design)
     try {
       this.createShip();
       console.log('[Player] createShip() completed successfully');
     } catch (err) {
       console.error('[Player] ERROR in createShip():', err.message, err);
       throw err;
     }
     
     // Game boundaries
     this.boundX = 50;
     this.boundY = 35;
     this.boundZ = 20;
     
     console.log('[Player] Constructor complete - player ready!');
   }
  
   /**
    * Create the player ship geometry with detailed components
    */
   createShip() {
     console.log('[Player.createShip] Starting ship creation...');
     
     try {
       // Create a group for the entire ship
       this.mesh = new THREE.Group();
       console.log('[Player.createShip] Group created');
       
       // === FUSELAGE/MAIN BODY ===
       // Main fuselage using cylinder for streamlined shape
       const fuselageGeometry = new THREE.CylinderGeometry(0.4, 0.35, 2.5, 8);
       const fuselageMaterial = new THREE.MeshStandardMaterial({
         color: 0x1a1a2e,
         emissive: 0x0a0a14,
         metalness: 0.85,
         roughness: 0.25
       });
       const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
       fuselage.rotation.z = Math.PI / 2; // Rotate so it points along Y axis
       fuselage.position.y = 0;
       this.mesh.add(fuselage);
       console.log('[Player.createShip] Fuselage added');
    
    // === NOSE CONE ===
    // Sharp nose for better aerodynamic appearance
    const noseGeometry = new THREE.ConeGeometry(0.35, 0.8, 8);
    const noseMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d47a1,
      emissive: 0x1565c0,
      metalness: 0.9,
      roughness: 0.2
    });
    const nose = new THREE.Mesh(noseGeometry, noseMaterial);
    nose.rotation.z = Math.PI / 2;
    nose.position.y = 1.5; // Front of ship
    this.mesh.add(nose);
    
    // === COCKPIT ===
    // Transparent spherical cockpit
    const cockpitGeometry = new THREE.SphereGeometry(0.3, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const cockpitMaterial = new THREE.MeshStandardMaterial({
      color: 0x80d8ff,
      emissive: 0x4dd0e1,
      transparent: true,
      opacity: 0.6,
      metalness: 0.3,
      roughness: 0.1
    });
    const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
    cockpit.position.y = 0.3;
    cockpit.position.z = 0.2;
    this.mesh.add(cockpit);
    
    // === ENGINE NOZZLES ===
    // Left engine
    const engineGeometry = new THREE.CylinderGeometry(0.15, 0.12, 0.6, 6);
    const engineMaterial = new THREE.MeshStandardMaterial({
      color: 0x0a0a0a,
      emissive: 0x0088ff,
      metalness: 0.95,
      roughness: 0.15
    });
    
    const engineLeft = new THREE.Mesh(engineGeometry, engineMaterial);
    engineLeft.rotation.z = Math.PI / 2;
    engineLeft.position.x = -0.35;
    engineLeft.position.y = -1.3;
    this.mesh.add(engineLeft);
    
    // Right engine
    const engineRight = new THREE.Mesh(engineGeometry, engineMaterial);
    engineRight.rotation.z = Math.PI / 2;
    engineRight.position.x = 0.35;
    engineRight.position.y = -1.3;
    this.mesh.add(engineRight);
    
    // Engine glow effects
    const engineGlowMaterial = new THREE.MeshBasicMaterial({
      color: 0x0088ff,
      transparent: true,
      opacity: 0.5
    });
    
    const glowLeft = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.8, 6),
      engineGlowMaterial.clone()
    );
    glowLeft.rotation.z = Math.PI / 2;
    glowLeft.position.x = -0.35;
    glowLeft.position.y = -1.3;
    this.mesh.add(glowLeft);
    this.engineGlows.push(glowLeft);
    
    const glowRight = new THREE.Mesh(
      new THREE.CylinderGeometry(0.2, 0.15, 0.8, 6),
      engineGlowMaterial.clone()
    );
    glowRight.rotation.z = Math.PI / 2;
    glowRight.position.x = 0.35;
    glowRight.position.y = -1.3;
    this.mesh.add(glowRight);
    this.engineGlows.push(glowRight);
    
    // === WINGS ===
    // Create trapezoidal wings using BoxGeometry positioned at angles
    const wingGeometry = new THREE.BoxGeometry(1.6, 0.08, 0.5);
    const wingMaterial = new THREE.MeshStandardMaterial({
      color: 0x263238,
      emissive: 0x121212,
      metalness: 0.7,
      roughness: 0.4
    });
    
    const wingLeft = new THREE.Mesh(wingGeometry, wingMaterial);
    wingLeft.position.x = -0.95;
    wingLeft.position.y = 0.2;
    wingLeft.rotation.z = 0.2; // Slight angle
    wingLeft.position.z = -0.3;
    this.mesh.add(wingLeft);
    
    const wingRight = new THREE.Mesh(wingGeometry, wingMaterial);
    wingRight.position.x = 0.95;
    wingRight.position.y = 0.2;
    wingRight.rotation.z = -0.2; // Opposite angle
    wingRight.position.z = -0.3;
    this.mesh.add(wingRight);
    
    // === WEAPON MOUNTS ===
    // Left weapon hardpoint
    const weaponGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.3);
    const weaponMaterial = new THREE.MeshStandardMaterial({
      color: 0xff6f00,
      emissive: 0xff6f00,
      metalness: 0.8,
      roughness: 0.3
    });
    
    const weaponLeft = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weaponLeft.position.x = -0.5;
    weaponLeft.position.y = 0.7;
    weaponLeft.position.z = 0.1;
    this.mesh.add(weaponLeft);
    this.weaponLeft = weaponLeft;
    
    const weaponRight = new THREE.Mesh(weaponGeometry, weaponMaterial);
    weaponRight.position.x = 0.5;
    weaponRight.position.y = 0.7;
    weaponRight.position.z = 0.1;
    this.mesh.add(weaponRight);
    this.weaponRight = weaponRight;
    
       // Set initial position
       this.mesh.position.set(0, 0, 0);
       console.log('[Player.createShip] Mesh positioned at (0, 0, 0)');
       
       this.scene.add(this.mesh);
       console.log('[Player.createShip] Mesh added to scene');
       console.log('[Player.createShip] Scene now has', this.scene.children.length, 'children');
       console.log('[Player.createShip] Ship creation complete!');
     } catch (err) {
       console.error('[Player.createShip] ERROR during ship creation:', err.message, err);
       throw err;
     }
   }
  
  /**
   * Handle keyboard input
   * @param {string} key - The key pressed
   */
  onKeyDown(key) {
    this.keys[key.toLowerCase()] = true;
  }
  
  /**
   * Handle keyboard release
   * @param {string} key - The key released
   */
  onKeyUp(key) {
    this.keys[key.toLowerCase()] = false;
  }
  
  /**
   * Update player position based on input
   * @param {number} deltaTime - Time since last update
   */
  update(deltaTime) {
    // === ROTATION CONTROL ===
    // A/D keys for left/right rotation
    if (this.keys['a'] || this.keys['arrowleft']) {
      this.mesh.rotation.z += this.rotationSpeed * deltaTime;
    }
    if (this.keys['d'] || this.keys['arrowright']) {
      this.mesh.rotation.z -= this.rotationSpeed * deltaTime;
    }
    
    // === THRUST CONTROL ===
    // Calculate current ship direction based on rotation
    const angle = this.mesh.rotation.z;
    const direction = {
      x: Math.sin(angle),
      y: Math.cos(angle)
    };
    
    // W/S keys for forward/backward thrust
    if (this.keys['w'] || this.keys['arrowup']) {
      this.velocity.x += direction.x * this.thrust * deltaTime;
      this.velocity.y += direction.y * this.thrust * deltaTime;
    }
    if (this.keys['s'] || this.keys['arrowdown']) {
      this.velocity.x -= direction.x * this.thrust * deltaTime;
      this.velocity.y -= direction.y * this.thrust * deltaTime;
    }
    
    // === VERTICAL MOVEMENT (Z AXIS) ===
    // Q/E keys for up/down movement
    if (this.keys['q']) {
      this.velocity.z -= this.thrust * deltaTime;
    }
    if (this.keys['e']) {
      this.velocity.z += this.thrust * deltaTime;
    }
    
    // === INERTIA AND FRICTION ===
    // Apply friction for realistic space physics with inertia
    this.velocity.x *= this.friction;
    this.velocity.y *= this.friction;
    this.velocity.z *= this.friction;
    
    // === UPDATE POSITION ===
    this.mesh.position.x += this.velocity.x * deltaTime;
    this.mesh.position.y += this.velocity.y * deltaTime;
    this.mesh.position.z += this.velocity.z * deltaTime;
    
    // === BOUNDARY CONSTRAINTS ===
    // Clamp position within bounds
    this.mesh.position.x = Math.max(-this.boundX, Math.min(this.boundX, this.mesh.position.x));
    this.mesh.position.y = Math.max(-this.boundY, Math.min(this.boundY, this.mesh.position.y));
    this.mesh.position.z = Math.max(-this.boundZ, Math.min(this.boundZ, this.mesh.position.z));
    
    // === ENGINE VISUAL FEEDBACK ===
    // Increase engine glow intensity when thrusting forward
    const isThrusting = this.keys['w'] || this.keys['arrowup'];
    this.engineGlows.forEach(glow => {
      if (isThrusting) {
        glow.material.opacity = Math.min(0.8, glow.material.opacity + 0.1);
      } else {
        glow.material.opacity = Math.max(0.3, glow.material.opacity - 0.05);
      }
    });
    
    // === WEAPON FLASH ===
    // Brief flash of weapon mounts when shooting
    const weaponFlash = this.shootCooldown < this.shootCooldownMax * 0.1;
    if (this.weaponLeft && this.weaponRight) {
      if (weaponFlash) {
        this.weaponLeft.material.emissive.setHex(0xffff00);
        this.weaponRight.material.emissive.setHex(0xffff00);
      } else {
        this.weaponLeft.material.emissive.setHex(0xff6f00);
        this.weaponRight.material.emissive.setHex(0xff6f00);
      }
    }
    
    // Update shoot cooldown
    if (this.shootCooldown > 0) {
      this.shootCooldown -= deltaTime;
    }
    
    // Update projectiles
    this.updateProjectiles(deltaTime);
  }
  
  /**
   * Shoot a projectile
   */
  shoot() {
    if (this.shootCooldown > 0) return;
    
    // Calculate shooting direction based on ship's current rotation
    const angle = this.mesh.rotation.z;
    const direction = {
      x: Math.sin(angle),
      y: Math.cos(angle),
      z: 0
    };
    
    // Offset projectile spawn position to ship's nose (2 units forward)
    const spawnOffset = 2;
    const spawnPosition = new THREE.Vector3(
      this.mesh.position.x + direction.x * spawnOffset,
      this.mesh.position.y + direction.y * spawnOffset,
      this.mesh.position.z + direction.z * spawnOffset
    );
    
    const projectile = new Projectile(
      spawnPosition,
      direction,
      this.scene
    );
    
    this.projectiles.push(projectile);
    this.shootCooldown = this.shootCooldownMax;
  }
  
  /**
   * Update projectiles and remove dead ones
   * @param {number} deltaTime - Time since last update
   */
  updateProjectiles(deltaTime) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];
      projectile.update(deltaTime);
      
      if (!projectile.isAlive() || projectile.isOffScreen()) {
        projectile.destroy();
        this.projectiles.splice(i, 1);
      }
    }
  }
  
  /**
   * Get player position
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
   * Remove player from scene
   */
  destroy() {
    // Remove all projectiles
    this.projectiles.forEach(p => p.destroy());
    this.projectiles = [];
    
    // Remove player mesh
    this.scene.remove(this.mesh);
  }
}
