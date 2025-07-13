import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  isMobile, 
  isTablet, 
  isIOS, 
  isAndroid, 
  getDeviceType, 
  hapticFeedback,
  TouchGestureDetector,
  onOrientationChange,
  getScreenSize
} from '@/utils/mobile';

export function useMobile() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: isMobile(),
    isTablet: isTablet(),
    isIOS: isIOS(),
    isAndroid: isAndroid(),
    deviceType: getDeviceType(),
  });

  const [screenSize, setScreenSize] = useState(getScreenSize());
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>(
    window.innerHeight > window.innerWidth ? 'portrait' : 'landscape'
  );

  useEffect(() => {
    const handleResize = () => {
      setScreenSize(getScreenSize());
    };

    const cleanupOrientation = onOrientationChange((newOrientation) => {
      setOrientation(newOrientation as 'portrait' | 'landscape');
    });

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      cleanupOrientation();
    };
  }, []);

  return {
    ...deviceInfo,
    screenSize,
    orientation,
    haptic: hapticFeedback,
  };
}

// Hook for touch gestures
export function useTouchGestures(elementRef: React.RefObject<HTMLElement>) {
  const [gestures, setGestures] = useState({
    onTap: null as ((e: TouchEvent) => void) | null,
    onSwipeLeft: null as ((e: TouchEvent) => void) | null,
    onSwipeRight: null as ((e: TouchEvent) => void) | null,
    onSwipeUp: null as ((e: TouchEvent) => void) | null,
    onSwipeDown: null as ((e: TouchEvent) => void) | null,
    onLongPress: null as ((e: TouchEvent) => void) | null,
  });

  const gestureDetectorRef = useRef<TouchGestureDetector | null>(null);

  useEffect(() => {
    if (elementRef.current) {
      gestureDetectorRef.current = new TouchGestureDetector(elementRef.current);
      
      // Set up gesture handlers
      Object.entries(gestures).forEach(([key, handler]) => {
        if (handler && gestureDetectorRef.current) {
          (gestureDetectorRef.current as any)[key] = handler;
        }
      });

      return () => {
        gestureDetectorRef.current?.destroy();
      };
    }
  }, [elementRef.current, gestures]);

  const setGestureHandler = useCallback((
    gestureType: keyof typeof gestures,
    handler: (e: TouchEvent) => void
  ) => {
    setGestures(prev => ({
      ...prev,
      [gestureType]: handler,
    }));
  }, []);

  return {
    setGestureHandler,
    gestures,
  };
}

// Hook for responsive values
export function useResponsiveValue<T>(values: {
  mobile: T;
  tablet?: T;
  desktop?: T;
}) {
  const { deviceType } = useMobile();

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
}

// Hook for safe area
export function useSafeArea() {
  const [safeArea, setSafeArea] = useState({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  });

  useEffect(() => {
    const updateSafeArea = () => {
      const style = getComputedStyle(document.documentElement);
      setSafeArea({
        top: parseInt(style.getPropertyValue('--safe-area-inset-top') || '0', 10),
        right: parseInt(style.getPropertyValue('--safe-area-inset-right') || '0', 10),
        bottom: parseInt(style.getPropertyValue('--safe-area-inset-bottom') || '0', 10),
        left: parseInt(style.getPropertyValue('--safe-area-inset-left') || '0', 10),
      });
    };

    updateSafeArea();
    window.addEventListener('resize', updateSafeArea);
    window.addEventListener('orientationchange', updateSafeArea);

    return () => {
      window.removeEventListener('resize', updateSafeArea);
      window.removeEventListener('orientationchange', updateSafeArea);
    };
  }, []);

  return safeArea;
}

// Hook for haptic feedback with button interactions
export function useHapticFeedback() {
  const { isMobile } = useMobile();

  const feedback = useCallback((type: keyof typeof hapticFeedback) => {
    if (isMobile) {
      hapticFeedback[type]();
    }
  }, [isMobile]);

  // Enhanced button props with haptic feedback
  const getButtonProps = useCallback((
    onClick?: () => void,
    feedbackType: keyof typeof hapticFeedback = 'tap'
  ) => ({
    onClick: () => {
      feedback(feedbackType);
      onClick?.();
    },
    onTouchStart: () => {
      feedback('light');
    },
  }), [feedback]);

  return {
    feedback,
    getButtonProps,
  };
}

// Hook for mobile-optimized scrolling
export function useMobileScroll() {
  const { isMobile, isIOS } = useMobile();

  const scrollToTop = useCallback(() => {
    if (isMobile) {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, [isMobile]);

  const scrollIntoView = useCallback((element: HTMLElement) => {
    if (isMobile) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }
  }, [isMobile]);

  // iOS specific scroll optimization
  const preventOverscroll = useCallback((element: HTMLElement) => {
    if (isIOS) {
      element.style.overscrollBehavior = 'none';
      element.style.webkitOverflowScrolling = 'touch';
    }
  }, [isIOS]);

  return {
    scrollToTop,
    scrollIntoView,
    preventOverscroll,
  };
}

export default useMobile;
