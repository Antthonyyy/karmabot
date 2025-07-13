// Mobile optimization utilities

// Device detection
export const isMobile = () => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
};

export const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

export const isAndroid = () => {
  return /Android/i.test(navigator.userAgent);
};

export const isTablet = () => {
  return /(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(
    navigator.userAgent
  );
};

export const getDeviceType = () => {
  if (isTablet()) return 'tablet';
  if (isMobile()) return 'mobile';
  return 'desktop';
};

// Screen size utilities
export const getScreenSize = () => {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    ratio: window.devicePixelRatio || 1,
  };
};

export const isLandscape = () => {
  return window.innerWidth > window.innerHeight;
};

export const isPortrait = () => {
  return window.innerHeight > window.innerWidth;
};

// Haptic feedback
export const vibrate = (pattern: number | number[]) => {
  if ('vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch (error) {
      console.warn('Vibration not supported:', error);
    }
  }
};

export const hapticFeedback = {
  light: () => vibrate(10),
  medium: () => vibrate(50),
  heavy: () => vibrate(100),
  success: () => vibrate([50, 50, 50]),
  error: () => vibrate([100, 50, 100, 50, 100]),
  warning: () => vibrate([75, 50, 75]),
  tap: () => vibrate(10),
  longPress: () => vibrate([20, 10, 20]),
  swipe: () => vibrate(15),
};

// Touch gesture detection
export class TouchGestureDetector {
  private startX = 0;
  private startY = 0;
  private startTime = 0;
  private element: HTMLElement;
  private threshold = 50; // minimum distance for swipe
  private timeThreshold = 300; // maximum time for tap

  constructor(element: HTMLElement) {
    this.element = element;
    this.setupListeners();
  }

  private setupListeners() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: true });
  }

  private handleTouchStart(e: TouchEvent) {
    const touch = e.touches[0];
    this.startX = touch.clientX;
    this.startY = touch.clientY;
    this.startTime = Date.now();
  }

  private handleTouchEnd(e: TouchEvent) {
    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - this.startX;
    const deltaY = endY - this.startY;
    const deltaTime = endTime - this.startTime;

    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Determine gesture type
    if (distance < 10 && deltaTime < this.timeThreshold) {
      this.onTap?.(e);
    } else if (distance > this.threshold) {
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        // Horizontal swipe
        if (deltaX > 0) {
          this.onSwipeRight?.(e);
        } else {
          this.onSwipeLeft?.(e);
        }
      } else {
        // Vertical swipe
        if (deltaY > 0) {
          this.onSwipeDown?.(e);
        } else {
          this.onSwipeUp?.(e);
        }
      }
    }

    if (deltaTime > 500) {
      this.onLongPress?.(e);
    }
  }

  // Event handlers (can be overridden)
  onTap?: (e: TouchEvent) => void;
  onSwipeLeft?: (e: TouchEvent) => void;
  onSwipeRight?: (e: TouchEvent) => void;
  onSwipeUp?: (e: TouchEvent) => void;
  onSwipeDown?: (e: TouchEvent) => void;
  onLongPress?: (e: TouchEvent) => void;

  destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this));
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this));
  }
}

// Safe area utilities for notch devices
export const getSafeAreaInsets = () => {
  const style = getComputedStyle(document.documentElement);
  return {
    top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
    right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
    bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
    left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
  };
};

// Responsive utilities
export const createResponsiveValues = <T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}) => {
  const deviceType = getDeviceType();
  switch (deviceType) {
    case 'mobile':
      return values.mobile;
    case 'tablet':
      return values.tablet || values.mobile;
    case 'desktop':
      return values.desktop || values.tablet || values.mobile;
    default:
      return values.mobile;
  }
};

// Touch-friendly button sizing
export const getTouchTargetSize = () => {
  // iOS HIG recommends 44pt (44px), Android Material Design recommends 48dp
  return isIOS() ? 44 : 48;
};

// Prevent zoom on input focus (iOS)
export const preventZoomOnFocus = () => {
  if (isIOS()) {
    const inputs = document.querySelectorAll('input, textarea, select');
    inputs.forEach(input => {
      input.addEventListener('focus', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0');
        }
      });

      input.addEventListener('blur', () => {
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
          viewport.setAttribute('content', 'width=device-width, initial-scale=1.0');
        }
      });
    });
  }
};

// Performance optimization for mobile
export const optimizeForMobile = () => {
  // Reduce motion for better performance
  if (isMobile()) {
    document.documentElement.style.setProperty('--animation-duration', '0.2s');
    document.documentElement.style.setProperty('--transition-duration', '0.15s');
  }

  // Prevent overscroll bounce on iOS
  if (isIOS()) {
    document.body.style.overscrollBehavior = 'none';
  }

  // Optimize touch delay
  document.addEventListener('touchstart', () => {}, { passive: true });
};

// Orientation change handler
export const onOrientationChange = (callback: (orientation: string) => void) => {
  const handleOrientationChange = () => {
    const orientation = isLandscape() ? 'landscape' : 'portrait';
    callback(orientation);
  };

  window.addEventListener('orientationchange', handleOrientationChange);
  window.addEventListener('resize', handleOrientationChange);

  return () => {
    window.removeEventListener('orientationchange', handleOrientationChange);
    window.removeEventListener('resize', handleOrientationChange);
  };
};

// Initialize mobile optimizations
export const initMobileOptimizations = () => {
  preventZoomOnFocus();
  optimizeForMobile();
  
  // Add mobile-specific CSS classes
  document.documentElement.classList.add(getDeviceType());
  
  if (isIOS()) {
    document.documentElement.classList.add('ios');
  }
  
  if (isAndroid()) {
    document.documentElement.classList.add('android');
  }

  console.log('📱 Mobile optimizations initialized');
}; 