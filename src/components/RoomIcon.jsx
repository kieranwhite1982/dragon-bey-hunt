import React from 'react';

/* Hand-drawn landmarks. A 7-year-old finds the laundry by spotting the
   washing machine, not by reading the label. */
export default function RoomIcon({ type, cx, cy }) {
  const s = {
    fill: 'none',
    stroke: '#4b2e10',
    strokeWidth: 3.2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  switch (type) {
    case 'shelves':
      return (
        <g opacity="0.75">
          <rect x={cx - 26} y={cy - 24} width="52" height="48" rx="3" {...s} />
          <line x1={cx - 26} y1={cy - 8} x2={cx + 26} y2={cy - 8} {...s} />
          <line x1={cx - 26} y1={cy + 8} x2={cx + 26} y2={cy + 8} {...s} />
          <circle cx={cx - 12} cy={cy - 16} r="4" {...s} />
          <circle cx={cx + 6} cy={cy} r="4" {...s} />
        </g>
      );
    case 'kitchen':
      return (
        <g opacity="0.75">
          <rect x={cx - 26} y={cy - 22} width="52" height="44" rx="4" {...s} />
          <circle cx={cx - 13} cy={cy - 9} r="6" {...s} />
          <circle cx={cx + 12} cy={cy - 9} r="6" {...s} />
          <circle cx={cx - 13} cy={cy + 11} r="6" {...s} />
          <circle cx={cx + 12} cy={cy + 11} r="6" {...s} />
        </g>
      );
    case 'washer':
      return (
        <g opacity="0.75">
          <rect x={cx - 24} y={cy - 26} width="48" height="52" rx="5" {...s} />
          <circle cx={cx} cy={cy + 4} r="15" {...s} />
          <circle cx={cx - 15} cy={cy - 17} r="3" {...s} />
        </g>
      );
    case 'desk':
      return (
        <g opacity="0.75">
          <rect x={cx - 28} y={cy - 6} width="56" height="8" rx="2" {...s} />
          <line x1={cx - 22} y1={cy + 2} x2={cx - 22} y2={cy + 24} {...s} />
          <line x1={cx + 22} y1={cy + 2} x2={cx + 22} y2={cy + 24} {...s} />
          <rect x={cx - 14} y={cy - 26} width="28" height="18" rx="2" {...s} />
        </g>
      );
    case 'sofa':
      return (
        <g opacity="0.7">
          <rect x={cx - 30} y={cy - 8} width="60" height="24" rx="6" {...s} />
          <rect x={cx - 30} y={cy - 22} width="12" height="18" rx="4" {...s} />
          <rect x={cx + 18} y={cy - 22} width="12" height="18" rx="4" {...s} />
        </g>
      );
    case 'tv':
      return (
        <g opacity="0.78">
          <rect x={cx - 34} y={cy - 30} width="68" height="40" rx="4" {...s} />
          <line x1={cx} y1={cy + 10} x2={cx} y2={cy + 18} {...s} />
          <line x1={cx - 14} y1={cy + 18} x2={cx + 14} y2={cy + 18} {...s} />
          <rect x={cx - 26} y={cy + 26} width="52" height="16" rx="5" {...s} />
        </g>
      );
    case 'bed':
      return (
        <g opacity="0.7">
          <rect x={cx - 28} y={cy - 18} width="56" height="38" rx="5" {...s} />
          <rect x={cx - 28} y={cy - 18} width="56" height="14" rx="4" {...s} />
        </g>
      );
    case 'car':
      return (
        <g opacity="0.8">
          <path d={`M ${cx - 38} ${cy + 6} l 8 -18 h 60 l 8 18 z`} {...s} />
          <circle cx={cx - 22} cy={cy + 12} r="8" {...s} />
          <circle cx={cx + 22} cy={cy + 12} r="8" {...s} />
          <line x1={cx - 14} y1={cy - 12} x2={cx - 14} y2={cy + 4} {...s} />
          <line x1={cx + 14} y1={cy - 12} x2={cx + 14} y2={cy + 4} {...s} />
        </g>
      );
    default:
      return null;
  }
}
