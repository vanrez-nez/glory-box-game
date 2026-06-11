import * as THREE from 'three/webgpu';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';

const SQRT3 = Math.sqrt(3);

export interface HexGridParams {
  columns: number;
}

const DEFAULT_PARAMS: HexGridParams = {
  columns: 18,
};

interface Cell { x: number; y: number; }

/*
  Virtual hex grid laid over the EXISTING cylinder (no hex geometry replaces the
  wall) — pure COORDINATE MATH, no scene objects. Cells form a regular pointy-top
  honeycomb in cylinder-unrolled space: x = map-x (wraps 0..MapWidth around the
  full circle), y = world height. `columns` divides the circumference evenly, so
  the grid is seamless at the wrap seam. This is the game's positioning substrate
  (objects snap to it); the editor's HexGridOverlay visualises it.
*/
export default class HexGrid {
  params: HexGridParams;

  constructor(params: Partial<HexGridParams> = {}) {
    this.params = { ...DEFAULT_PARAMS, ...params };
  }

  // map-x spacing between column centres (a full circle spans MapWidth).
  get columnSpacingX() {
    return GameConfig.MapWidth / this.params.columns;
  }

  // World circumference of the wall.
  get circumference() {
    return GAME.CylinderRadius * Math.PI * 2;
  }

  // Hex circumradius in world units (pointy-top: flat-to-flat width = √3·size).
  get hexSizeWorld() {
    return this.circumference / this.params.columns / SQRT3;
  }

  // World-y spacing between honeycomb rows.
  get rowSpacingY() {
    return 1.5 * this.hexSizeWorld;
  }

  // World arc-length per 1 map-x unit (map-x is angular; y is world) — lets us
  // compare hex distances in real world space.
  get worldPerX() {
    return this.circumference / GameConfig.MapWidth;
  }

  // Centre of cell (col, row) in map-space (x map-x wrapped, y world).
  cellCenter(col: number, row: number, out: Cell = { x: 0, y: 0 }) {
    const sx = this.columnSpacingX;
    const offset = (row & 1) ? sx * 0.5 : 0;
    const w = GameConfig.MapWidth;
    out.x = (((col * sx + offset) % w) + w) % w;
    out.y = row * this.rowSpacingY;
    return out;
  }

  // Nearest cell centre to a map-space point.
  snap(x: number, y: number, out: Cell = { x: 0, y: 0 }) {
    const c = this.cellAt(x, y);
    return this.cellCenter(c.col, c.row, out);
  }

  // Shortest signed map-x delta across the wrap seam.
  wrapDeltaX(dx: number) {
    const w = GameConfig.MapWidth;
    let d = ((dx % w) + w) % w;
    if (d > w * 0.5) { d -= w; }
    return d;
  }

  // Nearest cell (col, row) to a map-space point. Rounds to a candidate cell then
  // checks it + neighbours and picks the nearest centre in WORLD space (honouring
  // the x-wrap) — true-ish hex picking, unlike snap()'s rect rounding. `col` is
  // normalised to [0, columns) so it's a stable selection key across the seam.
  cellAt(mapX: number, mapY: number): { col: number; row: number } {
    const sx = this.columnSpacingX;
    const rowH = this.rowSpacingY;
    const wpx = this.worldPerX;
    const cols = this.params.columns;
    const baseRow = Math.round(mapY / rowH);
    const c: Cell = { x: 0, y: 0 };
    let best = { col: 0, row: 0 };
    let bestD = Infinity;
    for (let dr = -1; dr <= 1; dr++) {
      const row = baseRow + dr;
      const offset = (row & 1) ? sx * 0.5 : 0;
      const baseCol = Math.round((mapX - offset) / sx);
      for (let dc = -1; dc <= 1; dc++) {
        const col = baseCol + dc;
        this.cellCenter(col, row, c);
        const ddx = this.wrapDeltaX(mapX - c.x) * wpx;
        const ddy = mapY - c.y;
        const d = ddx * ddx + ddy * ddy;
        if (d < bestD) { bestD = d; best = { col, row }; }
      }
    }
    best.col = ((best.col % cols) + cols) % cols;
    return best;
  }

  // Cell centre + its 6 ring vertices, projected onto the cylinder (world space).
  // Index 0 = centre, 1..6 = ring. Used by the editor to build highlight fans.
  cellVertices(col: number, row: number, project: number): THREE.Vector3[] {
    const s = this.hexSizeWorld;
    const xPerWorld = GameConfig.MapWidth / this.circumference;
    const c = this.cellCenter(col, row);
    const out: THREE.Vector3[] = [];
    const centre = new THREE.Vector3();
    CartesianToCylinder(centre, c.x, c.y, project);
    out.push(centre);
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + k * (Math.PI / 3);
      const v = new THREE.Vector3();
      CartesianToCylinder(v, c.x + s * Math.cos(a) * xPerWorld, c.y + s * Math.sin(a), project);
      out.push(v);
    }
    return out;
  }

  setColumns(n: number) {
    this.params.columns = Math.max(3, Math.round(n));
  }
}
