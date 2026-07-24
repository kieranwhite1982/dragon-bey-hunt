import React from 'react';

/* Ignis. Pure SVG so he scales to any phone and costs nothing to cache. */
export default function Dragon({ speaking = false, fire = false, size = 190 }) {
  return (
    <svg
      width={size}
      height={size * 1.18}
      viewBox="0 0 220 260"
      className="dragon-bob"
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="dbody" cx="40%" cy="30%">
          <stop offset="0%" stopColor="#ffb35c" />
          <stop offset="60%" stopColor="#ff7a2f" />
          <stop offset="100%" stopColor="#d61f1f" />
        </radialGradient>
        <linearGradient id="dwing" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ff2e63" />
          <stop offset="100%" stopColor="#7a0f3d" />
        </linearGradient>
        <linearGradient id="dflame" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="45%" stopColor="#ff9d2f" />
          <stop offset="100%" stopColor="#ff2e2e" />
        </linearGradient>
      </defs>

      {/* tail */}
      <g className="dragon-tail" style={{ transformOrigin: '150px 172px' }}>
        <path
          d="M148,172 C198,188 218,158 204,134 C197,122 183,125 181,136"
          fill="none"
          stroke="#e0521a"
          strokeWidth="15"
          strokeLinecap="round"
        />
        <path d="M178,142 l-13,-15 l26,-5 z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="3" strokeLinejoin="round" />
      </g>

      {/* wings */}
      <g className="wing-l">
        <path
          d="M72,118 C30,86 8,104 6,138 C30,132 44,140 50,158 C58,138 62,128 72,118 Z"
          fill="url(#dwing)"
          stroke="#5c0c2c"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M66,122 L18,112 M66,126 L20,132 M68,132 L34,150" stroke="#5c0c2c" strokeWidth="2.6" opacity="0.6" fill="none" />
      </g>
      <g className="wing-r">
        <path
          d="M148,118 C190,86 212,104 214,138 C190,132 176,140 170,158 C162,138 158,128 148,118 Z"
          fill="url(#dwing)"
          stroke="#5c0c2c"
          strokeWidth="4"
          strokeLinejoin="round"
        />
        <path d="M154,122 L202,112 M154,126 L200,132 M152,132 L186,150" stroke="#5c0c2c" strokeWidth="2.6" opacity="0.6" fill="none" />
      </g>

      {/* body */}
      <ellipse cx="110" cy="146" rx="58" ry="50" fill="url(#dbody)" stroke="#8f1a08" strokeWidth="5" />
      <ellipse cx="110" cy="158" rx="34" ry="32" fill="#ffd88a" opacity="0.95" />
      {[0, 1, 2].map((i) => (
        <line key={i} x1="82" y1={142 + i * 16} x2="138" y2={142 + i * 16} stroke="#e0a94a" strokeWidth="3" opacity="0.7" />
      ))}

      {/* spine spikes */}
      <path
        d="M62,116 l-11,-13 l16,2 z M158,116 l11,-13 l-16,2 z"
        fill="#ffe9b0"
        stroke="#8f1a08"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />

      {/* horns */}
      <path d="M70,52 L58,14 L88,42 Z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />
      <path d="M150,52 L162,14 L132,42 Z" fill="#ffe9b0" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />

      {/* head */}
      <ellipse cx="110" cy="78" rx="56" ry="46" fill="url(#dbody)" stroke="#8f1a08" strokeWidth="5" />

      {/* eyes with slit pupils */}
      <g className="dragon-blink">
        <ellipse cx="88" cy="70" rx="15" ry="16" fill="#fff" stroke="#8f1a08" strokeWidth="3" />
        <ellipse cx="132" cy="70" rx="15" ry="16" fill="#fff" stroke="#8f1a08" strokeWidth="3" />
        <circle cx="90" cy="71" r="8" fill="#ffc94a" />
        <circle cx="134" cy="71" r="8" fill="#ffc94a" />
        <ellipse cx="90" cy="71" rx="3" ry="8" fill="#1a0b2e" />
        <ellipse cx="134" cy="71" rx="3" ry="8" fill="#1a0b2e" />
        <circle cx="93" cy="67" r="2.4" fill="#fff" />
        <circle cx="137" cy="67" r="2.4" fill="#fff" />
      </g>

      {/* brow ridges */}
      <path d="M72,50 q16,-8 30,2 M148,50 q-16,-8 -30,2" fill="none" stroke="#8f1a08" strokeWidth="4" strokeLinecap="round" />

      {/* snout + jaw */}
      <ellipse cx="110" cy="102" rx="32" ry="17" fill="#ff9a4d" stroke="#8f1a08" strokeWidth="4" />
      <circle cx="100" cy="98" r="3.4" fill="#8f1a08" />
      <circle cx="120" cy="98" r="3.4" fill="#8f1a08" />
      <g className={speaking ? 'dragon-jaw' : ''} style={{ transformOrigin: '110px 106px' }}>
        <path d="M84,106 Q110,132 136,106 Q110,118 84,106 Z" fill="#7a0f2d" stroke="#8f1a08" strokeWidth="4" strokeLinejoin="round" />
        <path d="M92,108 l5,9 l5,-9 Z" fill="#fff" />
        <path d="M118,108 l5,9 l5,-9 Z" fill="#fff" />
      </g>

      {/* fire breath */}
      {fire && (
        <g style={{ transformOrigin: '110px 112px' }}>
          <path
            className="flame-a"
            d="M92,112 Q68,182 110,246 Q152,182 128,112 Z"
            fill="#ff2e2e"
            opacity="0.75"
            style={{ transformOrigin: '110px 112px' }}
          />
          <path
            className="flame-b"
            d="M98,114 Q84,180 110,228 Q136,180 122,114 Z"
            fill="url(#dflame)"
            style={{ transformOrigin: '110px 112px' }}
          />
          <path
            className="flame-c"
            d="M104,116 Q97,174 110,210 Q123,174 116,116 Z"
            fill="#fff3b0"
            opacity="0.95"
            style={{ transformOrigin: '110px 112px' }}
          />
        </g>
      )}

      {/* embers */}
      <g className="ember-1">
        <circle cx="58" cy="150" r="4" fill="#ffc94a" />
      </g>
      <g className="ember-2">
        <circle cx="168" cy="160" r="3.4" fill="#ff9d2f" />
      </g>
      <g className="ember-3">
        <circle cx="74" cy="176" r="3" fill="#ff6b35" />
      </g>
      <g className="ember-4">
        <circle cx="152" cy="182" r="4.2" fill="#ffe08a" />
      </g>

      {/* nostril smoke */}
      {speaking && (
        <g className="dragon-smoke">
          <circle cx="70" cy="98" r="7" fill="#ffffff" opacity="0.35" />
          <circle cx="56" cy="88" r="5" fill="#ffffff" opacity="0.25" />
          <circle cx="150" cy="98" r="7" fill="#ffffff" opacity="0.35" />
          <circle cx="164" cy="88" r="5" fill="#ffffff" opacity="0.25" />
        </g>
      )}
    </svg>
  );
}
