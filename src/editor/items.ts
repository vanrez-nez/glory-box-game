import type HexGrid from '@/game/world/hex-grid';
import { cellKey, type CellId, type ItemType } from '@/editor/store';

/*
  Placeable-item catalog. Each descriptor declares its label, default insert
  metadata, and a FOOTPRINT function (anchor + meta → the cells it occupies). The
  footprint is the extensible constraint hook: single-cell and horizontal-run are
  implemented now; future formations (cross, etc.) register a new footprint fn.
*/
export interface ItemDescriptor {
  type: ItemType;
  label: string;
  defaultMeta: Record<string, any>;
  footprint(anchor: CellId, meta: Record<string, any>, grid: HexGrid): CellId[];
}

const wrapCol = (col: number, columns: number) => ((col % columns) + columns) % columns;

function singleCell(anchor: CellId): CellId[] {
  return [{ col: anchor.col, row: anchor.row }];
}

// Horizontal contiguous run of `width` cells centred on the anchor, same row,
// wrap-aware. Pads are never vertical — always horizontal-contiguous slots.
function horizontalRun(anchor: CellId, width: number, grid: HexGrid): CellId[] {
  const w = Math.max(1, Math.round(width));
  const cols = grid.params.columns;
  const start = anchor.col - Math.floor((w - 1) / 2);
  const cells: CellId[] = [];
  for (let i = 0; i < w; i++) {
    cells.push({ col: wrapCol(start + i, cols), row: anchor.row });
  }
  return cells;
}

export const ITEM_CATALOG: Record<ItemType, ItemDescriptor> = {
  staticPad: {
    type: 'staticPad', label: 'Static Pad',
    // width = track in CELLS (= footprint); a static pad fills its track.
    defaultMeta: { width: 3 },
    footprint: (a, m, g) => horizontalRun(a, m.width ?? 1, g),
  },
  movingPad: {
    type: 'movingPad', label: 'Moving Pad',
    // width = track (movement range) in CELLS; padPercent = pad width as a
    // fraction of the track (the pad oscillates within it).
    defaultMeta: { width: 3, padPercent: 1 / 3 },
    footprint: (a, m, g) => horizontalRun(a, m.width ?? 1, g),
  },
  collectible: {
    type: 'collectible', label: 'Collectible',
    defaultMeta: { glyph: 0 },
    footprint: (a) => singleCell(a),
  },
  den: {
    type: 'den', label: 'Dragon Den',
    defaultMeta: { direction: 'both' },
    footprint: (a) => singleCell(a),
  },
};

export const ITEM_TYPES = Object.keys(ITEM_CATALOG) as ItemType[];

// All footprint cells must be free in the occupancy index to place.
export function isPlaceable(cells: CellId[], occupancy: Record<string, string>): boolean {
  for (const c of cells) {
    if (occupancy[cellKey(c)]) { return false; }
  }
  return true;
}
