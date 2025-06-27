import { motion } from 'framer-motion';
import { ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{
        duration: 0.3,
        ease: [0.4, 0.0, 0.2, 1], // Custom easing curve for smooth transitions
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Slide transition for tabbed content
export function SlideTransition({ children, direction = 'left' }: { children: ReactNode; direction?: 'left' | 'right' }) {
  const variants = {
    enter: (direction: string) => ({
      x: direction === 'left' ? 300 : -300,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: string) => ({
      zIndex: 0,
      x: direction === 'left' ? -300 : 300,
      opacity: 0
    })
  };

  return (
    <motion.div
      custom={direction}
      variants={variants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={{
        x: { type: "spring", stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 }
      }}
    >
      {children}
    </motion.div>
  );
}

// Fade transition for modal and overlay content
export function FadeTransition({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{
        duration: 0.2,
        delay,
        ease: "easeOut"
      }}
    >
      {children}
    </motion.div>
  );
}

// Scale transition for cards and interactive elements
export function ScaleTransition({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{
        duration: 0.3,
        delay: delay * 0.1, // Convert delay to seconds (100ms, 200ms, etc.)
        ease: [0.4, 0.0, 0.2, 1]
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}