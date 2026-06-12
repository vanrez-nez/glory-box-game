// Level placement record types. Game-side (the game spawns from these); the editor
// re-imports them. Cell/ratio metrics only — no world units — so the level is
// resizable (props re-derive from cells at the current hex-grid scale).

export type ItemType = 'staticPad' | 'movingPad' | 'collectible' | 'den';
export type DenDirection = 'input' | 'output' | 'both';

export interface CellId { col: number; row: number; }

// A placed item: anchor cell, the occupancy keys it covers (editor bookkeeping),
// and per-type metadata (pad: { width, padPercent }, collectible: { glyph },
// den: { direction }).
export interface PlacedItem {
  id: string;
  type: ItemType;
  anchor: CellId;
  cells: string[];
  meta: Record<string, any>;
}

export const cellKey = (c: CellId) => `${c.col},${c.row}`;
