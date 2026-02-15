/**
 * Mobile Controls - Touch-based input system for mobile devices
 * Implements virtual joystick and fire button for touch devices
 */
export class MobileControls {
  constructor(player) {
    this.player = player;
    this.isMobile = this.detectMobile();
    
    // Touch state tracking
    this.joystickState = { x: 0, y: 0 };
    this.firePressed = false;
    
    if (this.isMobile) {
      this.createControls();
      this.attachEventListeners();
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
   * This should be called in the game loop
   */
  update() {
    if (!this.isMobile) return;
    
    // Update player keys based on joystick state
    // Right stick movement (A/D equivalent) - rotate ship
    if (this.joystickState.x < -0.3) {
      this.player.keys['a'] = true;
      this.player.keys['d'] = false;
    } else if (this.joystickState.x > 0.3) {
      this.player.keys['d'] = true;
      this.player.keys['a'] = false;
    } else {
      this.player.keys['a'] = false;
      this.player.keys['d'] = false;
    }
    
    // Vertical stick movement (W/S equivalent) - thrust
    if (this.joystickState.y < -0.3) {
      this.player.keys['w'] = true;
      this.player.keys['s'] = false;
    } else if (this.joystickState.y > 0.3) {
      this.player.keys['s'] = true;
      this.player.keys['w'] = false;
    } else {
      this.player.keys['w'] = false;
      this.player.keys['s'] = false;
    }
    
    // Fire button
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
