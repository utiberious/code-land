/**
 * Mobile Controls - Touch-based input system for mobile devices
 * Implements virtual joystick and fire button for touch devices
 */
export class MobileControls {
   constructor(player) {
     console.log('[MobileControls] Constructor called, player:', player);
     this.player = player;
     this.isMobile = this.detectMobile();
     console.log('[MobileControls] isMobile detected:', this.isMobile);
     
     // Touch state tracking
     this.joystickState = { x: 0, y: 0 };
     this.firePressed = false;
     
     if (this.isMobile) {
       console.log('[MobileControls] Creating mobile control elements...');
       this.createControls();
       console.log('[MobileControls] Control elements created');
       this.attachEventListeners();
       console.log('[MobileControls] Event listeners attached');
     } else {
       console.log('[MobileControls] Not a mobile device - controls disabled');
     }
   }
  
  /**
   * Detect if the device supports touch input
   * @returns {boolean} True if device has touch capability
   */
  detectMobile() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  }
  
  /**
   * Create DOM elements for mobile controls
   */
  createControls() {
    // Create left joystick container
    this.joystickContainer = document.createElement('div');
    this.joystickContainer.id = 'joystick-container';
    this.joystickContainer.className = 'mobile-joystick-container show-mobile';
    
    // Create joystick base
    this.joystickBase = document.createElement('div');
    this.joystickBase.className = 'mobile-joystick-base';
    
    // Create joystick knob
    this.joystickKnob = document.createElement('div');
    this.joystickKnob.className = 'mobile-joystick-knob';
    
    this.joystickBase.appendChild(this.joystickKnob);
    this.joystickContainer.appendChild(this.joystickBase);
    document.body.appendChild(this.joystickContainer);
    
    // Create right fire button
    this.fireButton = document.createElement('div');
    this.fireButton.id = 'fire-button';
    this.fireButton.className = 'mobile-fire-button show-mobile';
    this.fireButton.textContent = '🔥';
    document.body.appendChild(this.fireButton);
  }
  
  /**
   * Attach touch event listeners to mobile controls
   */
  attachEventListeners() {
    // Joystick touch events
    this.joystickBase.addEventListener('touchstart', (e) => this.onJoystickTouchStart(e));
    this.joystickBase.addEventListener('touchmove', (e) => this.onJoystickTouchMove(e));
    this.joystickBase.addEventListener('touchend', (e) => this.onJoystickTouchEnd(e));
    
    // Fallback: mouse events for desktop emulation
    this.joystickBase.addEventListener('mousedown', (e) => this.onJoystickMouseStart(e));
    this.joystickBase.addEventListener('mousemove', (e) => this.onJoystickMouseMove(e));
    this.joystickBase.addEventListener('mouseup', (e) => this.onJoystickMouseEnd(e));
    this.joystickBase.addEventListener('mouseleave', (e) => this.onJoystickMouseEnd(e));
    
    // Fire button touch events
    this.fireButton.addEventListener('touchstart', (e) => this.onFireTouchStart(e));
    this.fireButton.addEventListener('touchend', (e) => this.onFireTouchEnd(e));
    
    // Fire button mouse events (for emulation)
    this.fireButton.addEventListener('mousedown', (e) => this.onFireMouseDown(e));
    this.fireButton.addEventListener('mouseup', (e) => this.onFireMouseUp(e));
    this.fireButton.addEventListener('mouseleave', (e) => this.onFireMouseUp(e));
  }
  
  /**
   * Handle joystick touch start
   */
  onJoystickTouchStart(e) {
    e.preventDefault();
    this.joystickActive = true;
    const touch = e.touches[0];
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }
  
  /**
   * Handle joystick touch move
   */
  onJoystickTouchMove(e) {
    e.preventDefault();
    if (!this.joystickActive) return;
    const touch = e.touches[0];
    this.updateJoystickPosition(touch.clientX, touch.clientY);
  }
  
  /**
   * Handle joystick touch end
   */
  onJoystickTouchEnd(e) {
    e.preventDefault();
    this.joystickActive = false;
    this.resetJoystick();
  }
  
  /**
   * Handle joystick mouse start (for desktop emulation)
   */
  onJoystickMouseStart(e) {
    this.joystickActive = true;
    this.updateJoystickPosition(e.clientX, e.clientY);
  }
  
  /**
   * Handle joystick mouse move
   */
  onJoystickMouseMove(e) {
    if (!this.joystickActive) return;
    this.updateJoystickPosition(e.clientX, e.clientY);
  }
  
  /**
   * Handle joystick mouse end
   */
  onJoystickMouseEnd(e) {
    this.joystickActive = false;
    this.resetJoystick();
  }
  
  /**
   * Update joystick position based on pointer coordinates
   * @param {number} clientX - X coordinate of pointer
   * @param {number} clientY - Y coordinate of pointer
   */
  updateJoystickPosition(clientX, clientY) {
    const baseRect = this.joystickBase.getBoundingClientRect();
    const baseCenterX = baseRect.left + baseRect.width / 2;
    const baseCenterY = baseRect.top + baseRect.height / 2;
    
    // Calculate offset from center
    const offsetX = clientX - baseCenterX;
    const offsetY = clientY - baseCenterY;
    
    // Calculate distance and angle
    const distance = Math.sqrt(offsetX * offsetX + offsetY * offsetY);
    const maxDistance = baseRect.width / 2 - 15; // Leave space for knob
    
    // Clamp distance to joystick radius
    const clampedDistance = Math.min(distance, maxDistance);
    
    // Calculate normalized values (-1 to 1)
    if (distance === 0) {
      this.joystickState.x = 0;
      this.joystickState.y = 0;
    } else {
      this.joystickState.x = (offsetX / distance) * (clampedDistance / maxDistance);
      this.joystickState.y = (offsetY / distance) * (clampedDistance / maxDistance);
    }
    
    // Update knob visual position
    const angle = Math.atan2(offsetY, offsetX);
    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;
    
    this.joystickKnob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;
    
    // Add visual feedback - glow effect
    this.joystickBase.style.boxShadow = `0 0 20px rgba(0, 200, 255, ${0.3 + clampedDistance / maxDistance * 0.5})`;
  }
  
  /**
   * Reset joystick to center position
   */
  resetJoystick() {
    this.joystickState.x = 0;
    this.joystickState.y = 0;
    this.joystickKnob.style.transform = 'translate(-50%, -50%)';
    this.joystickBase.style.boxShadow = '0 0 10px rgba(0, 200, 255, 0.3)';
  }
  
  /**
   * Handle fire button touch start
   */
  onFireTouchStart(e) {
    e.preventDefault();
    this.firePressed = true;
    this.fireButton.classList.add('active');
  }
  
  /**
   * Handle fire button touch end
   */
  onFireTouchEnd(e) {
    e.preventDefault();
    this.firePressed = false;
    this.fireButton.classList.remove('active');
  }
  
  /**
   * Handle fire button mouse down
   */
  onFireMouseDown(e) {
    e.preventDefault();
    this.firePressed = true;
    this.fireButton.classList.add('active');
  }
  
  /**
   * Handle fire button mouse up
   */
  onFireMouseUp(e) {
    e.preventDefault();
    this.firePressed = false;
    this.fireButton.classList.remove('active');
  }
  
   /**
    * Update player input based on mobile controls
    * Implements arcade-style direct movement instead of rotation-based flight
    * This should be called in the game loop
    */
   update() {
     if (!this.isMobile) return;
     
     const deadzone = 0.1;
     const speed = 8.0; // Movement speed
     const rotationLerpSpeed = 0.1; // Rotation interpolation speed (0-1)
     
     // Check if joystick is active (above deadzone)
     const isActive = Math.abs(this.joystickState.x) > deadzone || 
                      Math.abs(this.joystickState.y) > deadzone;
     
     if (isActive) {
       // === ARCADE MODE: Direct velocity control ===
       // Joystick direction maps directly to movement
       this.player.velocity.x = this.joystickState.x * speed;
       this.player.velocity.y = -this.joystickState.y * speed; // Invert Y for intuitive controls
       
       // === AUTO-ROTATE: Ship faces movement direction ===
       // Calculate target angle based on joystick input
       const targetAngle = Math.atan2(this.joystickState.x, -this.joystickState.y);
       const currentAngle = this.player.mesh.rotation.z;
       
       // Normalize angle difference to [-PI, PI]
       let angleDiff = targetAngle - currentAngle;
       while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
       while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
       
       // Smooth rotation interpolation for natural feel
       this.player.mesh.rotation.z += angleDiff * rotationLerpSpeed;
       
     } else {
       // === DAMPING: Gradually stop when joystick released ===
       // Apply friction for smooth deceleration
       this.player.velocity.x *= 0.9;
       this.player.velocity.y *= 0.9;
     }
     
     // === FIRING ===
     if (this.firePressed) {
       this.player.shoot();
     }
   }
  
  /**
   * Cleanup mobile controls (if needed)
   */
  destroy() {
    if (this.joystickContainer) {
      document.body.removeChild(this.joystickContainer);
    }
    if (this.fireButton) {
      document.body.removeChild(this.fireButton);
    }
  }
}
