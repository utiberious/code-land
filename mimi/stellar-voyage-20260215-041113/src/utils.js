/**
 * Utility functions for the Stellar Voyage game
 */

/**
 * Generate a random number between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number between min and max
 */
export function random(min, max) {
  return Math.random() * (max - min) + min;
}

/**
 * Generate a random integer between min and max (inclusive)
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random integer between min and max
 */
export function randomInt(min, max) {
  return Math.floor(random(min, max + 1));
}

/**
 * Generate a random point in 3D space within specified bounds
 * @param {number} xBound - X axis boundary
 * @param {number} yBound - Y axis boundary
 * @param {number} zBound - Z axis boundary
 * @returns {Object} Object with x, y, z coordinates
 */
export function randomVector3(xBound, yBound, zBound) {
  return {
    x: random(-xBound, xBound),
    y: random(-yBound, yBound),
    z: random(-zBound, zBound)
  };
}

/**
 * Calculate distance between two 3D points
 * @param {Object} p1 - First point {x, y, z}
 * @param {Object} p2 - Second point {x, y, z}
 * @returns {number} Distance between points
 */
export function distance(p1, p2) {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  const dz = p1.z - p2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * Get direction vector from point p1 to point p2
 * @param {Object} p1 - Start point {x, y, z}
 * @param {Object} p2 - End point {x, y, z}
 * @returns {Object} Normalized direction vector {x, y, z}
 */
export function getDirection(p1, p2) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  
  if (dist === 0) return { x: 0, y: 0, z: 0 };
  
  return {
    x: dx / dist,
    y: dy / dist,
    z: dz / dist
  };
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Create explosion particles effect
 * @param {THREE.Vector3} position - Position of explosion
 * @param {THREE.Scene} scene - Three.js scene
 * @param {Object} THREE - Three.js module
 * @param {number} count - Number of particles
 * @returns {Array} Array of particle objects
 */
export function createExplosion(position, scene, THREE, count = 20) {
  const particles = [];
  
  for (let i = 0; i < count; i++) {
    const particle = createParticle(position, scene, THREE);
    particles.push(particle);
  }
  
  return particles;
}

/**
 * Create a single particle
 * @param {THREE.Vector3} position - Position of particle
 * @param {THREE.Scene} scene - Three.js scene
 * @param {Object} THREE - Three.js module
 * @returns {Object} Particle object with mesh, velocity, and lifetime
 */
export function createParticle(position, scene, THREE) {
  const geometry = new THREE.SphereGeometry(0.1, 4, 4);
  const material = new THREE.MeshBasicMaterial({
    color: 0xff6600,
    emissive: 0xff4400
  });
  const mesh = new THREE.Mesh(geometry, material);
  
  mesh.position.copy(position);
  
  const velocity = {
    x: random(-2, 2),
    y: random(-2, 2),
    z: random(-2, 2)
  };
  
  scene.add(mesh);
  
  return {
    mesh,
    velocity,
    lifetime: 1.0,
    age: 0
  };
}

/**
 * Update particles and remove dead ones
 * @param {Array} particles - Array of particle objects
 * @param {number} deltaTime - Time since last frame
 * @param {THREE.Scene} scene - Three.js scene
 */
export function updateParticles(particles, deltaTime, scene) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const particle = particles[i];
    particle.age += deltaTime;
    
    if (particle.age >= particle.lifetime) {
      scene.remove(particle.mesh);
      particles.splice(i, 1);
    } else {
      particle.mesh.position.x += particle.velocity.x * deltaTime;
      particle.mesh.position.y += particle.velocity.y * deltaTime;
      particle.mesh.position.z += particle.velocity.z * deltaTime;
      
      // Fade out
      const alpha = 1 - (particle.age / particle.lifetime);
      particle.mesh.material.opacity = alpha;
    }
  }
}
