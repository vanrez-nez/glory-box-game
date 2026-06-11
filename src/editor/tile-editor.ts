import * as THREE from 'three/webgpu';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CylinderFromCartesian } from '@/game/utils';
import HexGrid from '@/game/world/hex-grid';

interface TileEditorOptions {
  camera: THREE.PerspectiveCamera;
  canvas: HTMLElement;
  hexGrid: HexGrid;
  parent: THREE.Object3D;
  // True while editor edit-mode is active (replaces the old GameConfig flag).
  isActive: () => boolean;
}

// Highlights sit further out than the grid overlay (OVERLAY_PROJECT = 0.15) so
// they render on top; hover slightly above selection so it reads over selected.
const SELECT_PROJECT = 0.22;
const HOVER_PROJECT = 0.26;
const HOVER_COLOR = 0xffffff;
const SELECT_COLOR = 0x33ff99;

interface CellId { col: number; row: number; }

/*
  Editor tile picking: in edit mode (StaticDesign) the cursor highlights the hex
  tile under it, a click selects the front tile (analytic ray↔cylinder cast from
  the camera), and Shift+click toggles tiles for multi-select. Picking is purely
  mathematical (ray vs cylinder of GAME.CylinderRadius) so it matches the virtual
  hex grid's coordinate frame and works even when the cylinder mesh is hidden.
  Selection is the substrate the future placement UI builds on.
*/
export default class TileEditor {
  opts: TileEditorOptions;
  raycaster: THREE.Raycaster;
  ndc: THREE.Vector2;
  hasPointer: boolean;
  group: THREE.Group;
  hover: THREE.Mesh;
  selectionMesh: THREE.Mesh;
  selection: Set<string>;
  private hoverCell: CellId | null = null;
  private hit = new THREE.Vector3();

  constructor(opts: TileEditorOptions) {
    this.opts = opts;
    this.raycaster = new THREE.Raycaster();
    this.ndc = new THREE.Vector2();
    this.hasPointer = false;
    this.selection = new Set();

    this.group = new THREE.Group();
    this.group.name = 'TileEditor';
    this.group.visible = false;
    opts.parent.add(this.group);

    // Start with a valid (empty) position attribute so the renderer never sees a
    // geometry with no attributes.
    this.hover = new THREE.Mesh(this.buildFan([], HOVER_PROJECT), new THREE.MeshBasicMaterial({
      color: HOVER_COLOR, transparent: true, opacity: 0.28,
      depthWrite: false, side: THREE.DoubleSide,
    }));
    this.hover.frustumCulled = false;
    this.hover.visible = false;
    this.group.add(this.hover);

    this.selectionMesh = new THREE.Mesh(this.buildFan([], SELECT_PROJECT), new THREE.MeshBasicMaterial({
      color: SELECT_COLOR, transparent: true, opacity: 0.4,
      depthWrite: false, side: THREE.DoubleSide,
    }));
    this.selectionMesh.frustumCulled = false;
    this.group.add(this.selectionMesh);

    opts.canvas.addEventListener('mousemove', this.onMouseMove);
    opts.canvas.addEventListener('click', this.onClick);
  }

  private setNdc(e: MouseEvent) {
    const rect = this.opts.canvas.getBoundingClientRect();
    this.ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    this.hasPointer = true;
  }

  private onMouseMove = (e: MouseEvent) => {
    if (!this.opts.isActive()) { return; }
    this.setNdc(e);
  };

  private onClick = (e: MouseEvent) => {
    if (!this.opts.isActive()) { return; }
    this.setNdc(e);
    const cell = this.pickCell();
    if (!cell) {
      // Plain click on empty space clears; Shift keeps the selection.
      if (!e.shiftKey && this.selection.size) {
        this.selection.clear();
        this.rebuildSelection();
      }
      return;
    }
    const key = `${cell.col},${cell.row}`;
    if (e.shiftKey) {
      if (this.selection.has(key)) { this.selection.delete(key); }
      else { this.selection.add(key); }
    } else {
      this.selection.clear();
      this.selection.add(key);
    }
    this.rebuildSelection();
  };

  // Analytic ray↔cylinder (radius GAME.CylinderRadius, axis Y); nearest positive
  // root = the front wall. Returns the hex cell under the cursor, or null on miss.
  private pickCell(): CellId | null {
    const { camera, hexGrid } = this.opts;
    this.raycaster.setFromCamera(this.ndc, camera);
    const { origin: o, direction: d } = this.raycaster.ray;
    const r = GAME.CylinderRadius;
    const a = d.x * d.x + d.z * d.z;
    if (a < 1e-8) { return null; }
    const b = 2 * (o.x * d.x + o.z * d.z);
    const c = o.x * o.x + o.z * o.z - r * r;
    const disc = b * b - 4 * a * c;
    if (disc < 0) { return null; }
    const sq = Math.sqrt(disc);
    let t = (-b - sq) / (2 * a);
    if (t < 0) { t = (-b + sq) / (2 * a); }
    if (t < 0) { return null; }
    this.hit.set(o.x + d.x * t, o.y + d.y * t, o.z + d.z * t);
    const [, theta] = CylinderFromCartesian(this.hit);
    return hexGrid.cellAt(theta / GameConfig.ThetaPerUnit, this.hit.y);
  }

  // Triangle-fan geometry covering the given cells (6 tris per hex).
  private buildFan(cells: CellId[], project: number) {
    const pos: number[] = [];
    for (let i = 0; i < cells.length; i++) {
      const v = this.opts.hexGrid.cellVertices(cells[i].col, cells[i].row, project);
      const centre = v[0];
      for (let k = 0; k < 6; k++) {
        const a = v[1 + k];
        const b = v[1 + ((k + 1) % 6)];
        pos.push(centre.x, centre.y, centre.z, a.x, a.y, a.z, b.x, b.y, b.z);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    return geo;
  }

  private rebuildSelection() {
    const cells: CellId[] = [];
    this.selection.forEach((k) => {
      const [col, row] = k.split(',').map(Number);
      cells.push({ col, row });
    });
    this.selectionMesh.geometry.dispose();
    this.selectionMesh.geometry = this.buildFan(cells, SELECT_PROJECT);
  }

  // Per-frame: refresh the hover highlight from the latest cursor position.
  update() {
    if (!this.opts.isActive()) {
      if (this.group.visible) { this.group.visible = false; }
      return;
    }
    this.group.visible = true;
    if (!this.hasPointer) { this.hover.visible = false; return; }
    this.opts.camera.updateMatrixWorld();
    const cell = this.pickCell();
    if (!cell) { this.hover.visible = false; this.hoverCell = null; return; }
    if (!this.hoverCell || this.hoverCell.col !== cell.col || this.hoverCell.row !== cell.row) {
      this.hoverCell = cell;
      this.hover.geometry.dispose();
      this.hover.geometry = this.buildFan([cell], HOVER_PROJECT);
    }
    this.hover.visible = true;
  }

  dispose() {
    this.opts.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.opts.canvas.removeEventListener('click', this.onClick);
  }
}
