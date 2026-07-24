/* Floor plan geometry, tuned against photos of the real house.
   Deliberately simplified and landmark-driven rather than an accurate
   architectural trace — a 7-year-old recognises rooms by their contents.
   Both floors share the 0 0 600 900 viewBox. */

export const ROOMS_UP = [
  { id: 'pantry', name: "Butler's\nPantry", x: 40, y: 30, w: 112, h: 150, fill: '#f9a8d4', icon: 'shelves' },
  { id: 'nook', name: '', x: 40, y: 190, w: 112, h: 52, fill: '#dfe3ea' },
  { id: 'kitchen', name: 'Kitchen', x: 40, y: 252, w: 112, h: 180, fill: '#5eead4', icon: 'kitchen' },
  {
    id: 'living',
    name: 'Living Room',
    poly: '162,30 522,30 522,420 332,420 332,720 202,720 202,420 162,420',
    cx: 350,
    cy: 190,
    fill: '#fca5a5',
    icon: 'sofa',
  },
  { id: 'laundry', name: 'Laundry', x: 42, y: 450, w: 138, h: 162, fill: '#a7f3d0', icon: 'washer' },
  { id: 'room2', name: '', x: 402, y: 442, w: 118, h: 96, fill: '#bfdbfe' },
  { id: 'bedroom', name: 'Bedroom', x: 350, y: 556, w: 212, h: 200, fill: '#fde68a', icon: 'bed' },
  { id: 'study', name: 'Study', x: 38, y: 656, w: 152, h: 204, fill: '#a5b4fc', icon: 'desk' },
];

export const ROOMS_DOWN = [
  { id: 'lounge', name: 'Movie Room', x: 298, y: 148, w: 252, h: 262, fill: '#fbbf24', icon: 'tv' },
  { id: 'halldown', name: 'Hall', x: 300, y: 410, w: 170, h: 106, fill: '#bfdbfe', lx: 336, ly: 470 },
  { id: 'garage', name: 'GARAGE', x: 30, y: 328, w: 264, h: 332, fill: '#c4b5fd', icon: 'car' },
];

export function roomsFor(floor) {
  return floor === 'up' ? ROOMS_UP : ROOMS_DOWN;
}

export function roomCentre(r) {
  return r.poly ? { x: r.cx, y: r.cy } : { x: r.x + r.w / 2, y: r.y + r.h / 2 };
}
