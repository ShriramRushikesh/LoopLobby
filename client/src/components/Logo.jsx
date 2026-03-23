import React from 'react';

export default function Logo({ className = "w-full h-full text-white" }) {
  return (
    <svg 
      width="100%" 
      height="100%" 
      viewBox="0 0 300 80" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className + " drop-shadow-[0_0_15px_rgba(236,72,153,0.3)]"}
    >
      <defs>
        <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="100%" stopColor="#EC4899" />
        </linearGradient>
      </defs>

      {/* "LoopLobby" Main Text */}
      <text 
        x="0" 
        y="50" 
        fontFamily="Arial, sans-serif" 
        fontWeight="900" 
        fontSize="54" 
        letterSpacing="-3"
        fill="url(#logoGradient)"
      >
        LoopLobby
      </text>
      
      {/* "sync vibes" Subtitle */}
      <text 
        x="2" 
        y="72" 
        fontFamily="Arial, sans-serif" 
        fontWeight="800" 
        fontSize="12" 
        letterSpacing="0.4em" 
        fill="#EC4899" 
        style={{ textTransform: 'uppercase', opacity: 0.8 }}
      >
        sync vibes
      </text>

      {/* Floating Elements (Heart + Music Note) */}
      <g transform="translate(200, 10)">
        {/* Heart */}
        <path 
          d="M14.5,2 C12,2 9.8,3.5 9,5.8 C8.2,3.5 6,2 3.5,2 C1.5,2 0,3.5 0,5.5 C0,9.5 9,16 9,16 C9,16 18,9.5 18,5.5 C18,3.5 16.5,2 14.5,2 Z" 
          fill="currentColor" 
          transform="translate(12, 0) scale(0.9)" 
          className="animate-pulse"
        />
        {/* Main Music Note */}
        <path 
          d="M9,22 L9,10 L22,7 L22,19 C20.5,18 18.5,18 17,19 C14.5,20.5 14,23.5 15.5,26 C17,28.5 20,29 22.5,27 C24.5,25.5 25,23 25,21 L25,3 L9,7 L9,22 C7.5,21 5.5,21 4,22 C1.5,23.5 1,26.5 2.5,29 C4,31.5 7,32 9.5,30 C11.5,28.5 12,26 12,24 L12,22 L9,22 Z" 
          fill="currentColor" 
          transform="translate(0, 8)"
        />
        {/* Small Music Note */}
        <path 
          d="M12,2 L12,8 C11,7.5 9.5,7.5 8.5,8 C7,9 6.5,10.5 7.5,12 C8.5,13.5 10,13.5 11.5,12.5 C12.5,11.5 13,10.5 13,9 L13,2 L12,2 Z" 
          fill="currentColor" 
          transform="translate(24, 14) scale(0.8)"
        />
        {/* Teeny floating note */}
        <path 
          d="M10,2 L10,6 C9.5,5.5 8.5,5.5 7.5,6 C6.5,6.5 6,7.5 6.5,8.5 C7,9.5 8.5,9.5 9.5,9 C10.5,8.5 11,7.5 11,6.5 L11,2 L10,2 Z" 
          fill="currentColor" 
          transform="translate(4, 5) scale(0.6)"
        />
      </g>
    </svg>
  );
}
