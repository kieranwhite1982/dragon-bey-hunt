import React from 'react';
import RoomIcon from './RoomIcon.jsx';
import { roomCentre, roomsFor } from '../data/rooms.js';
import { C } from '../theme.js';

/* The map highlights a ROOM and never the hiding spot — that reveal belongs
   to Sawyer's radar, which is what keeps both boys needed. */
export default function FloorMap({ floor, targetRoom, showArrow, onPick, wrongId }) {
  const rooms = roomsFor(floor);

  return (
    <svg viewBox="0 0 600 900" className="w-full h-full" style={{ touchAction: 'manipulation' }}>
      <defs>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="7" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <pattern id="grid" width="26" height="26" patternUnits="userSpaceOnUse">
          <path d="M 26 0 L 0 0 0 26" fill="none" stroke="rgba(80,45,10,0.10)" strokeWidth="1.5" />
        </pattern>
      </defs>

      <rect x="0" y="0" width="600" height="900" fill={C.parch} rx="18" />
      <rect x="0" y="0" width="600" height="900" fill="url(#grid)" rx="18" />

      {rooms.map((r) => {
        const isTarget = r.id === targetRoom;
        const isWrong = r.id === wrongId;
        const c = roomCentre(r);
        const lx = r.lx != null ? r.lx : c.x;
        const ly = r.ly != null ? r.ly : c.y;
        const common = {
          fill: r.fill,
          opacity: isTarget ? 1 : 0.42,
          stroke: isTarget ? C.ember : '#7c5b34',
          strokeWidth: isTarget ? 8 : 3.5,
          filter: isTarget ? 'url(#glow)' : undefined,
          style: { cursor: 'pointer', transition: 'opacity 250ms' },
          onClick: () => onPick(r.id),
        };
        return (
          <g key={r.id} className={isWrong ? 'shake' : ''}>
            {r.poly ? (
              <polygon points={r.poly} {...common} />
            ) : (
              <rect x={r.x} y={r.y} width={r.w} height={r.h} rx="7" {...common} />
            )}
            {r.icon && <RoomIcon type={r.icon} cx={lx} cy={ly + (r.id === 'living' ? 0 : 26)} />}
            {r.name &&
              r.name.split('\n').map((line, i, arr) => (
                <text
                  key={i}
                  x={lx}
                  y={ly - (r.id === 'living' ? 46 : 22) + i * 22 - (arr.length - 1) * 8}
                  textAnchor="middle"
                  fontSize={r.id === 'garage' ? 30 : 21}
                  fontWeight="900"
                  fill={isTarget ? '#5b1a00' : '#6b4a28'}
                  style={{ letterSpacing: '0.5px', pointerEvents: 'none' }}
                >
                  {line}
                </text>
              ))}
            {isTarget && (
              <g style={{ pointerEvents: 'none' }}>
                <circle cx={lx} cy={ly + (r.id === 'living' ? 40 : 70)} r="26" fill={C.flame} className="pulse" />
                <text
                  x={lx}
                  y={ly + (r.id === 'living' ? 51 : 81)}
                  textAnchor="middle"
                  fontSize="34"
                  fontWeight="900"
                  fill="#fff"
                >
                  ?
                </text>
              </g>
            )}
          </g>
        );
      })}

      {/* stairs — downstairs they arrive in the hall */}
      {floor === 'up' ? (
        <g style={{ pointerEvents: 'none' }}>
          <rect x="215" y="612" width="104" height="100" rx="6" fill="#e9d5ff" stroke="#7c5b34" strokeWidth="3" opacity="0.9" />
          {[0, 1, 2, 3].map((i) => (
            <line key={i} x1="219" y1={630 + i * 22} x2="315" y2={630 + i * 22} stroke="#7c5b34" strokeWidth="3" />
          ))}
          <text x="267" y="600" textAnchor="middle" fontSize="18" fontWeight="900" fill="#6b4a28">
            STAIRS ↓
          </text>
        </g>
      ) : (
        <g style={{ pointerEvents: 'none' }}>
          <rect x="392" y="418" width="70" height="90" rx="6" fill="#e9d5ff" stroke="#7c5b34" strokeWidth="3" opacity="0.9" />
          {[0, 1, 2].map((i) => (
            <line key={i} x1="396" y1={440 + i * 24} x2="458" y2={440 + i * 24} stroke="#7c5b34" strokeWidth="3" />
          ))}
          <text x="427" y="536" textAnchor="middle" fontSize="17" fontWeight="900" fill="#6b4a28">
            STAIRS ↑
          </text>
        </g>
      )}

      {/* the door from the hall into the garage */}
      {floor === 'down' && (
        <g style={{ pointerEvents: 'none' }}>
          <rect x="288" y="438" width="14" height="50" fill={C.ember} rx="3" />
          <text x="262" y="425" textAnchor="middle" fontSize="16" fontWeight="900" fill="#5b1a00">
            DOOR
          </text>
        </g>
      )}

      {/* 60-second rescue arrow */}
      {showArrow &&
        targetRoom &&
        (() => {
          const r = rooms.find((x) => x.id === targetRoom);
          if (!r) return null;
          const c = roomCentre(r);
          const ax = r.lx != null ? r.lx : c.x;
          const ay = r.ly != null ? r.ly : c.y;
          return (
            <g className="bounce" style={{ pointerEvents: 'none' }}>
              <path
                d={`M ${ax} ${ay - 118} l 26 -34 h -14 v -44 h -24 v 44 h -14 z`}
                fill={C.flame}
                stroke="#fff"
                strokeWidth="4"
                transform={`rotate(180 ${ax} ${ay - 150})`}
              />
            </g>
          );
        })()}
    </svg>
  );
}
