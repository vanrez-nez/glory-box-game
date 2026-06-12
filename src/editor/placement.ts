import * as THREE from 'three/webgpu';
import type HexGrid from '@/game/world/hex-grid';
import { editorStore, cellKey, type CellId, type ItemType } from '@/editor/store';
import { ITEM_CATALOG, ITEM_TYPES } from '@/editor/items';

// Previews sit further out than the grid overlay so they read on top.
const PREVIEW_PROJECT = 0.3;
const VALID_COLOR = 0x33ff66;
const INVALID_COLOR = 0xff3333;

// Triangle-fan over the given cells (same approach as the tile-editor highlights).
function buildFan(hexGrid: HexGrid, cells: CellId[], project: number) {
  const pos: number[] = [];
  for (const cell of cells) {
    const v = hexGrid.cellVertices(cell.col, cell.row, project);
    const c = v[0];
    for (let k = 0; k < 6; k++) {
      const a = v[1 + k];
      const b = v[1 + ((k + 1) % 6)];
      pos.push(c.x, c.y, c.z, a.x, a.y, a.z, b.x, b.y, b.z);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return geo;
}

interface PlacementCtx {
  hexGrid: HexGrid;
  parent: THREE.Object3D;
  // The GAME map owns spawning/ticking/physics; placement only mutates records.
  map: any;
}

/*
  RTS-style placement. INSERT mode previews the hovered item's footprint (green =
  free, red = occupied — never replace) and a click places it (record + real
  prop). SELECT mode picks the placed item under the cursor; Delete removes it.
  `insertMeta` holds the per-type editable params (pad width, den direction, glyph)
  the tweakpane folders bind to.
*/
export default class Placement {
  ctx: PlacementCtx;
  insertMeta = {} as Record<ItemType, any>;
  private group: THREE.Group;
  private validMesh: THREE.Mesh;
  private invalidMesh: THREE.Mesh;

  constructor(ctx: PlacementCtx) {
    this.ctx = ctx;
    for (const t of ITEM_TYPES) {
      this.insertMeta[t] = { ...ITEM_CATALOG[t].defaultMeta };
    }
    this.group = new THREE.Group();
    this.group.name = 'EditorPlacementPreview';
    this.group.visible = false;
    this.validMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
      color: VALID_COLOR, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.invalidMesh = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({
      color: INVALID_COLOR, transparent: true, opacity: 0.45, depthWrite: false, side: THREE.DoubleSide,
    }));
    this.validMesh.frustumCulled = false;
    this.invalidMesh.frustumCulled = false;
    this.group.add(this.validMesh, this.invalidMesh);
    ctx.parent.add(this.group);
  }

  private footprint(anchor: CellId, type: ItemType): CellId[] {
    return ITEM_CATALOG[type].footprint(anchor, this.insertMeta[type], this.ctx.hexGrid);
  }

  // INSERT hover preview: green for free cells, red for occupied (no replace).
  updatePreview(hoverCell: CellId | null) {
    const s = editorStore.getState();
    if (s.mode !== 'insert' || !s.insertType || !hoverCell) {
      this.group.visible = false;
      return;
    }
    this.group.visible = true;
    const cells = this.footprint(hoverCell, s.insertType);
    const free: CellId[] = [];
    const occupied: CellId[] = [];
    for (const c of cells) {
      (s.occupancy[cellKey(c)] ? occupied : free).push(c);
    }
    this.validMesh.geometry.dispose();
    this.validMesh.geometry = buildFan(this.ctx.hexGrid, free, PREVIEW_PROJECT);
    this.invalidMesh.geometry.dispose();
    this.invalidMesh.geometry = buildFan(this.ctx.hexGrid, occupied, PREVIEW_PROJECT);
  }

  // Click in INSERT mode: place iff every footprint cell is free.
  placeAt(hoverCell: CellId | null) {
    const s = editorStore.getState();
    if (s.mode !== 'insert' || !s.insertType || !hoverCell) { return; }
    const type = s.insertType;
    const cells = this.footprint(hoverCell, type);
    for (const c of cells) {
      if (s.occupancy[cellKey(c)]) { return; }
    }
    const record = {
      id: crypto.randomUUID(),
      type,
      anchor: { col: hoverCell.col, row: hoverCell.row },
      cells: cells.map(cellKey),
      meta: { ...this.insertMeta[type] },
    };
    if (s.add(record)) {
      this.ctx.map.addRecord(record);
    }
  }

  // Click in SELECT mode: select the placed item under the cursor (or clear).
  pickSelect(hoverCell: CellId | null) {
    const s = editorStore.getState();
    s.select(hoverCell ? (s.occupancy[cellKey(hoverCell)] ?? null) : null);
  }

  deleteSelected() {
    const s = editorStore.getState();
    if (!s.selectedId) { return; }
    const id = s.selectedId;
    s.remove(id);
    this.ctx.map.removeRecord(id);
  }

  // Pull the selected item's meta into the editable insertMeta so its tweakpane
  // folder reflects the selected values.
  syncSelectedMeta() {
    const s = editorStore.getState();
    if (!s.selectedId) { return; }
    const rec = s.records[s.selectedId];
    if (rec) { Object.assign(this.insertMeta[rec.type], rec.meta); }
  }

  // tweakpane change: if a matching item is selected, rebuild it with the new meta
  // (recomputes cells in case width changed; reverts if it would collide).
  applyMeta(type: ItemType) {
    const s = editorStore.getState();
    const id = s.selectedId;
    if (!id) { return; }
    const rec = s.records[id];
    if (!rec || rec.type !== type) { return; }
    const newMeta = { ...this.insertMeta[type] };
    const newCells = this.footprint(rec.anchor, type).map(cellKey);
    s.remove(id);
    const rebuilt = { ...rec, meta: newMeta, cells: newCells };
    if (s.add(rebuilt)) {
      this.ctx.map.updateRecord(rebuilt);
    } else {
      s.add(rec); // collided with another item — revert
      this.ctx.map.updateRecord(rec);
    }
    s.select(id);
  }

  dispose() {
    this.ctx.parent.remove(this.group);
    this.validMesh.geometry.dispose();
    (this.validMesh.material as THREE.Material).dispose();
    this.invalidMesh.geometry.dispose();
    (this.invalidMesh.material as THREE.Material).dispose();
  }
}
