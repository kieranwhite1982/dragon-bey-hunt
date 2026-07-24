import React from 'react';
import { PART_IMAGES } from '../optionalAssets.js';

/* One Bey part, drawn as its artwork if public/part-<key>.* exists and as its
   emoji if it doesn't. The parts show up at four sizes across the app (hunt
   header tray, reward reveal, reward tray, victory list), so this keeps the
   image-or-emoji decision in one place.

   The generated art has a solid indigo background rather than transparency,
   so it gets rounded corners and a tinted ring to read as a deliberate token
   instead of a pasted square. */
export default function PartIcon({ part, size, ring = true }) {
  const src = part && part.key ? PART_IMAGES[part.key] : null;

  if (!src) {
    return (
      <span style={{ fontSize: Math.round(size * 0.82), lineHeight: 1 }}>
        {part ? part.emoji : '·'}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt=""
      className="object-cover"
      style={{
        width: size,
        height: size,
        /* Several of these sit inside flex containers narrower than the icon
           (the trays have their own borders eating the content box). Without
           this the icon shrinks on the main axis only and the part comes out
           visibly squashed rather than square. */
        flexShrink: 0,
        borderRadius: Math.max(6, Math.round(size * 0.22)),
        border: ring ? `2px solid ${part.color}` : 'none',
        boxShadow: ring ? `0 0 ${Math.round(size * 0.3)}px ${part.color}66` : 'none',
      }}
    />
  );
}
