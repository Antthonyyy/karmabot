interface LogoProps {
  size?: number;
  className?: string;
}

export function Logo({ size = 40, className = "" }: LogoProps) {
  return (
    <div className={`inline-flex items-center justify-center ${className}`}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 120 120" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#A855F7", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#C084FC", stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="bookGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#F3E8FF", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#E9D5FF", stopOpacity:1}} />
          </linearGradient>
          <linearGradient id="penGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#FB923C", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#F97316", stopOpacity:1}} />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Background circle with gradient */}
        <circle cx="60" cy="60" r="55" fill="url(#mainGradient)" filter="url(#glow)" opacity="0.9"/>
        
        {/* Inner circle for depth */}
        <circle cx="60" cy="60" r="45" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1"/>
        
        {/* Book base */}
        <rect x="30" y="35" width="35" height="45" rx="3" fill="url(#bookGradient)" stroke="rgba(139,92,246,0.3)" strokeWidth="1"/>
        
        {/* Book spine */}
        <rect x="28" y="35" width="4" height="45" rx="2" fill="rgba(139,92,246,0.6)"/>
        
        {/* Book pages */}
        <rect x="32" y="38" width="30" height="39" fill="white" opacity="0.9"/>
        
        {/* Page lines */}
        <line x1="35" y1="45" x2="58" y2="45" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/>
        <line x1="35" y1="50" x2="55" y2="50" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/>
        <line x1="35" y1="55" x2="58" y2="55" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/>
        <line x1="35" y1="60" x2="50" y2="60" stroke="rgba(139,92,246,0.4)" strokeWidth="1"/>
        
        {/* Pen */}
        <rect x="55" y="25" width="3" height="25" rx="1.5" fill="url(#penGradient)" transform="rotate(25 56.5 37.5)"/>
        
        {/* Pen tip */}
        <circle cx="65" cy="28" r="2" fill="#DC2626" transform="rotate(25 56.5 37.5)"/>
        
        {/* Karma symbols (infinity-like curves) */}
        <path d="M 20 25 Q 25 15, 35 25 Q 25 35, 20 25" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" opacity="0.8"/>
        <path d="M 85 25 Q 90 15, 100 25 Q 90 35, 85 25" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2" opacity="0.8"/>
        
        {/* Sparkle effects */}
        <g opacity="0.8">
          <path d="M 25 50 L 27 52 L 25 54 L 23 52 Z" fill="white"/>
          <path d="M 85 70 L 87 72 L 85 74 L 83 72 Z" fill="white"/>
          <path d="M 90 45 L 92 47 L 90 49 L 88 47 Z" fill="white"/>
        </g>
        
        {/* Lotus petals around the circle */}
        <g opacity="0.6">
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(0 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(45 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(90 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(135 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(180 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(225 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(270 60 60)"/>
          <ellipse cx="60" cy="15" rx="3" ry="8" fill="rgba(255,255,255,0.7)" transform="rotate(315 60 60)"/>
        </g>
      </svg>
    </div>
  );
}

interface LogoWithTextProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export function LogoWithText({ size = 40, showText = true, className = "" }: LogoWithTextProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <Logo size={size} />
      {showText && (
        <div className="flex flex-col">
          <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-purple-800 dark:from-purple-400 dark:to-purple-600 bg-clip-text text-transparent">
            Кармічний Щоденник
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Шлях до внутрішньої гармонії
          </p>
        </div>
      )}
    </div>
  );
}