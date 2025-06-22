/**
 * Animation Utilities for Login Component
 * Provides reusable animation functions and constants
 * Ensures consistent animation behavior across the application
 */

/**
 * Animation timing constants for consistent behavior
 */
export const ANIMATION_TIMINGS = {
  fast: 200,
  normal: 300,
  slow: 500,
  extraSlow: 800,
  loadingSpinner: 1000,
  themeTransition: 300,
  formValidation: 500,
  buttonPress: 200,
  fadeIn: 600,
  slideIn: 500
};

/**
 * Animation easing functions for smooth transitions
 */
export const ANIMATION_EASINGS = {
  easeOut: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeIn: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeInOut: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)'
};

/**
 * Animation class names for different states
 */
export const ANIMATION_CLASSES = {
  entering: 'entering',
  visible: 'visible',
  exiting: 'exiting',
  success: 'success',
  error: 'error',
  loading: 'loading'
};

/**
 * Creates a smooth fade-in animation for elements
 * @param {HTMLElement} element - The element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @param {number} delay - Animation delay in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const fadeIn = (element, duration = ANIMATION_TIMINGS.normal, delay = 0) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    element.style.opacity = '0';
    element.style.transition = `opacity ${duration}ms ${ANIMATION_EASINGS.easeOut}`;
    
    setTimeout(() => {
      element.style.opacity = '1';
      setTimeout(resolve, duration);
    }, delay);
  });
};

/**
 * Creates a smooth fade-out animation for elements
 * @param {HTMLElement} element - The element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const fadeOut = (element, duration = ANIMATION_TIMINGS.normal) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    element.style.transition = `opacity ${duration}ms ${ANIMATION_EASINGS.easeOut}`;
    element.style.opacity = '0';
    
    setTimeout(resolve, duration);
  });
};

/**
 * Creates a slide-in animation from specified direction
 * @param {HTMLElement} element - The element to animate
 * @param {string} direction - Direction to slide from ('top', 'bottom', 'left', 'right')
 * @param {number} distance - Distance to slide in pixels
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const slideIn = (element, direction = 'bottom', distance = 30, duration = ANIMATION_TIMINGS.slideIn) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const transforms = {
      top: `translateY(-${distance}px)`,
      bottom: `translateY(${distance}px)`,
      left: `translateX(-${distance}px)`,
      right: `translateX(${distance}px)`
    };

    element.style.opacity = '0';
    element.style.transform = transforms[direction];
    element.style.transition = `opacity ${duration}ms ${ANIMATION_EASINGS.easeOut}, transform ${duration}ms ${ANIMATION_EASINGS.easeOut}`;
    
    // Trigger animation on next frame
    requestAnimationFrame(() => {
      element.style.opacity = '1';
      element.style.transform = 'translate(0, 0)';
      setTimeout(resolve, duration);
    });
  });
};

/**
 * Creates a shake animation for error feedback
 * @param {HTMLElement} element - The element to animate
 * @param {number} intensity - Shake intensity in pixels
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const shake = (element, intensity = 5, duration = ANIMATION_TIMINGS.formValidation) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const keyframes = `
      @keyframes shake-${Date.now()} {
        0%, 100% { transform: translateX(0); }
        25% { transform: translateX(-${intensity}px); }
        75% { transform: translateX(${intensity}px); }
      }
    `;

    // Inject keyframes
    const style = document.createElement('style');
    style.textContent = keyframes;
    document.head.appendChild(style);

    const animationName = keyframes.match(/@keyframes (\S+)/)[1];
    element.style.animation = `${animationName} ${duration}ms ${ANIMATION_EASINGS.easeInOut}`;
    
    setTimeout(() => {
      element.style.animation = '';
      document.head.removeChild(style);
      resolve();
    }, duration);
  });
};

/**
 * Creates a pulse animation for loading states
 * @param {HTMLElement} element - The element to animate
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Function} - Function to stop the animation
 */
export const pulse = (element, duration = ANIMATION_TIMINGS.loadingSpinner) => {
  if (!element) return () => {};

  element.style.animation = `pulse ${duration}ms ${ANIMATION_EASINGS.easeInOut} infinite`;
  
  return () => {
    element.style.animation = '';
  };
};

/**
 * Creates a scale animation for button press feedback
 * @param {HTMLElement} element - The element to animate
 * @param {number} scale - Scale factor (e.g., 0.95 for slight shrink)
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const buttonPress = (element, scale = 0.98, duration = ANIMATION_TIMINGS.buttonPress) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const originalTransform = element.style.transform;
    element.style.transition = `transform ${duration}ms ${ANIMATION_EASINGS.easeOut}`;
    element.style.transform = `scale(${scale})`;
    
    setTimeout(() => {
      element.style.transform = originalTransform;
      setTimeout(resolve, duration);
    }, duration / 2);
  });
};

/**
 * Creates a smooth height transition animation
 * @param {HTMLElement} element - The element to animate
 * @param {number} targetHeight - Target height in pixels (0 for collapse)
 * @param {number} duration - Animation duration in milliseconds
 * @returns {Promise} - Promise that resolves when animation completes
 */
export const slideHeight = (element, targetHeight, duration = ANIMATION_TIMINGS.normal) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    const startHeight = element.offsetHeight;
    element.style.overflow = 'hidden';
    element.style.transition = `height ${duration}ms ${ANIMATION_EASINGS.easeOut}`;
    element.style.height = `${startHeight}px`;
    
    requestAnimationFrame(() => {
      element.style.height = `${targetHeight}px`;
      
      setTimeout(() => {
        if (targetHeight === 0) {
          element.style.display = 'none';
        }
        element.style.height = '';
        element.style.overflow = '';
        element.style.transition = '';
        resolve();
      }, duration);
    });
  });
};

/**
 * Creates a shimmer loading effect
 * @param {HTMLElement} element - The element to apply shimmer to
 * @param {string} direction - Shimmer direction ('left-to-right' or 'top-to-bottom')
 * @returns {Function} - Function to stop the shimmer effect
 */
export const shimmer = (element, direction = 'left-to-right') => {
  if (!element) return () => {};

  const shimmerKeyframes = direction === 'left-to-right' 
    ? `
      @keyframes shimmer-lr {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(100%); }
      }
    `
    : `
      @keyframes shimmer-tb {
        0% { transform: translateY(-100%); }
        100% { transform: translateY(100%); }
      }
    `;

  const style = document.createElement('style');
  style.textContent = shimmerKeyframes;
  document.head.appendChild(style);

  const shimmerElement = document.createElement('div');
  shimmerElement.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    animation: ${direction === 'left-to-right' ? 'shimmer-lr' : 'shimmer-tb'} 1.5s infinite;
    pointer-events: none;
  `;

  element.style.position = 'relative';
  element.style.overflow = 'hidden';
  element.appendChild(shimmerElement);

  return () => {
    if (shimmerElement.parentNode) {
      shimmerElement.parentNode.removeChild(shimmerElement);
    }
    if (style.parentNode) {
      style.parentNode.removeChild(style);
    }
  };
};

/**
 * Creates a typing animation effect for text
 * @param {HTMLElement} element - The element containing text to animate
 * @param {string} text - The text to type out
 * @param {number} speed - Typing speed in milliseconds per character
 * @returns {Promise} - Promise that resolves when typing completes
 */
export const typeWriter = (element, text, speed = 50) => {
  return new Promise((resolve) => {
    if (!element) {
      resolve();
      return;
    }

    element.textContent = '';
    let i = 0;

    const typeInterval = setInterval(() => {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval);
        resolve();
      }
    }, speed);
  });
};

/**
 * Utility function to check if user prefers reduced motion
 * @returns {boolean} - True if user prefers reduced motion
 */
export const prefersReducedMotion = () => {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

/**
 * Wrapper function that respects user's motion preferences
 * @param {Function} animationFunction - The animation function to execute
 * @param {...any} args - Arguments to pass to the animation function
 * @returns {Promise} - Promise that resolves immediately if reduced motion is preferred
 */
export const respectMotionPreference = (animationFunction, ...args) => {
  if (prefersReducedMotion()) {
    return Promise.resolve();
  }
  return animationFunction(...args);
};

/**
 * Creates a staggered animation for multiple elements
 * @param {NodeList|Array} elements - Elements to animate
 * @param {Function} animationFunction - Animation function to apply to each element
 * @param {number} staggerDelay - Delay between each element's animation
 * @param {...any} animationArgs - Arguments to pass to the animation function
 * @returns {Promise} - Promise that resolves when all animations complete
 */
export const staggerAnimation = (elements, animationFunction, staggerDelay = 100, ...animationArgs) => {
  const animations = Array.from(elements).map((element, index) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        animationFunction(element, ...animationArgs).then(resolve);
      }, index * staggerDelay);
    });
  });

  return Promise.all(animations);
};

/**
 * Animation manager class for complex animation sequences
 */
export class AnimationManager {
  constructor() {
    this.activeAnimations = new Set();
    this.animationQueue = [];
  }

  /**
   * Add animation to the active set
   * @param {Promise} animation - Animation promise
   */
  addAnimation(animation) {
    this.activeAnimations.add(animation);
    animation.finally(() => {
      this.activeAnimations.delete(animation);
    });
  }

  /**
   * Wait for all active animations to complete
   * @returns {Promise} - Promise that resolves when all animations complete
   */
  waitForAll() {
    return Promise.all(Array.from(this.activeAnimations));
  }

  /**
   * Cancel all active animations
   */
  cancelAll() {
    this.activeAnimations.clear();
  }

  /**
   * Queue an animation to run after current ones complete
   * @param {Function} animationFunction - Animation function to queue
   * @returns {Promise} - Promise that resolves when queued animation completes
   */
  queueAnimation(animationFunction) {
    const queuedAnimation = this.waitForAll().then(animationFunction);
    this.addAnimation(queuedAnimation);
    return queuedAnimation;
  }
}

// Export default animation manager instance
export const defaultAnimationManager = new AnimationManager();