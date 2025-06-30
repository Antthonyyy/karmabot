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
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="lotusMainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#C084FC", stopOpacity:1}} />
            <stop offset="30%" style={{stopColor:"#A855F7", stopOpacity:1}} />
            <stop offset="70%" style={{stopColor:"#8B5CF6", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#7C3AED", stopOpacity:1}} />
          </linearGradient>
          
          <linearGradient id="petalGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:"#FFFFFF", stopOpacity:1}} />
            <stop offset="50%" style={{stopColor:"#F3E8FF", stopOpacity:1}} />
            <stop offset="100%" style={{stopColor:"#E9D5FF", stopOpacity:1}} />
          </linearGradient>

          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{stopColor:"#FFFFFF", stopOpacity:0.9}} />
            <stop offset="70%" style={{stopColor:"#C084FC", stopOpacity:0.6}} />
            <stop offset="100%" style={{stopColor:"#8B5CF6", stopOpacity:0.3}} />
          </radialGradient>

          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Animated background glow */}
        <circle 
          cx="60" 
          cy="60" 
          r="55" 
          fill="url(#lotusMainGradient)"
          filter="url(#softGlow)"
          opacity="0.8"
          className="animate-pulse"
          style={{animationDuration: '3s'}}
        />
        
        {/* Outer lotus petals - large layer */}
        <g className="animate-spin origin-center" style={{animationDuration: '20s'}}>
          {[0, 60, 120, 180, 240, 300].map((angle, i) => (
            <g key={`outer-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 15 Q50 35 60 50 Q70 35 60 15"
                fill="url(#petalGradient)"
                stroke="#8B5CF6"
                strokeWidth="0.5"
                opacity="0.85"
                filter="url(#softGlow)"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.3}s`,
                  animationDuration: '2s'
                }}
              />
            </g>
          ))}
        </g>
        
        {/* Middle lotus petals */}
        <g className="animate-spin origin-center" style={{animationDuration: '15s', animationDirection: 'reverse'}}>
          {[30, 90, 150, 210, 270, 330].map((angle, i) => (
            <g key={`middle-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 25 Q52 40 60 50 Q68 40 60 25"
                fill="url(#petalGradient)"
                stroke="#A855F7"
                strokeWidth="0.5"
                opacity="0.9"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.4}s`,
                  animationDuration: '2.5s'
                }}
              />
            </g>
          ))}
        </g>
        
        {/* Inner lotus petals - small layer */}
        <g className="animate-spin origin-center" style={{animationDuration: '12s'}}>
          {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => (
            <g key={`inner-${i}`} transform={`rotate(${angle} 60 60)`}>
              <path
                d="M60 35 Q56 45 60 50 Q64 45 60 35"
                fill="#FFFFFF"
                stroke="#C084FC"
                strokeWidth="0.3"
                opacity="0.95"
                className="animate-pulse"
                style={{ 
                  animationDelay: `${i * 0.2}s`,
                  animationDuration: '1.8s'
                }}
              />
            </g>
          ))}
        </g>
        
        {/* Sacred center with mandala */}
        <g className="animate-spin origin-center" style={{animationDuration: '8s', animationDirection: 'reverse'}}>
          <circle 
            cx="60" 
            cy="60" 
            r="8" 
            fill="url(#centerGlow)"
            className="animate-pulse"
            style={{animationDuration: '2s'}}
          />
          <circle 
            cx="60" 
            cy="60" 
            r="5" 
            fill="#FFFFFF"
            opacity="0.9"
            className="animate-pulse"
            style={{ 
              animationDelay: '0.5s',
              animationDuration: '2s'
            }}
          />
          <circle 
            cx="60" 
            cy="60" 
            r="2" 
            fill="url(#lotusMainGradient)"
            className="animate-pulse"
            style={{ 
              animationDelay: '1s',
              animationDuration: '2s'
            }}
          />
        </g>
        
        {/* Floating energy particles */}
        {[0, 72, 144, 216, 288].map((angle, i) => (
          <circle
            key={`particle-${i}`}
            cx={60 + 35 * Math.cos((angle * Math.PI) / 180)}
            cy={60 + 35 * Math.sin((angle * Math.PI) / 180)}
            r="1.5"
            fill="#FFFFFF"
            opacity="0.7"
            className="animate-ping"
            style={{ 
              animationDelay: `${i * 0.6}s`, 
              animationDuration: '3s'
            }}
          />
        ))}

        {/* Subtle mandala lines */}
        <g opacity="0.3" className="animate-spin origin-center" style={{animationDuration: '25s'}}>
          {[0, 30, 60, 90, 120, 150].map((angle, i) => (
            <line
              key={`line-${i}`}
              x1="60"
              y1="20"
              x2="60"
              y2="100"
              stroke="#FFFFFF"
              strokeWidth="0.5"
              transform={`rotate(${angle} 60 60)`}
              className="animate-pulse"
              style={{ 
                animationDelay: `${i * 0.5}s`,
                animationDuration: '4s'
              }}
            />
          ))}
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