import * as THREE from 'three/webgpu';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';
import type HexGrid from '@/game/world/hex-grid';

// Rows the overlay draws around its current (camera-following) centre.
const BAND_ROWS = 48;
// Outline lines sit just outside the wall so they're not z-fighting it.
const OVERLAY_PROJECT = 0.15;
// Depth-only occluder just INSIDE the wall (< wall radius so the near-side grid +
// player are never occluded). Its near hemisphere writes depth, so grid lines and
// highlights on the FAR side of the cylinder fail the depth test and vanish —
// works even when the cylinder mesh is hidden. Tall enough to cover the frustum.
const OCCLUDER_INSET = 0.5;
const OCCLUDER_HEIGHT = 500;

/*
  Editor-only visualization of the (game-side) virtual hex grid: a toggleable
  LineSegments honeycomb projected onto the cylinder, plus a depth-only occluder
  that hides the far side. Reads the math HexGrid's coordinate getters; owns no
  game state. Added to its parent (world.group) on construct, removed on dispose.
*/
export default class HexGridOverlay {
  grid: HexGrid;
  parent: THREE.Object3D;
  isActive: () => boolean;
  enabled = true;
  group: THREE.Group;
  overlay: THREE.LineSegments;
  occluder: THREE.Mesh;
  private mat: THREE.LineBasicMaterial;

  constructor(grid: HexGrid, parent: THREE.Object3D, isActive: () => boolean) {
    this.grid = grid;
    this.parent = parent;
    this.isActive = isActive;
    this.group = new THREE.Group();
    this.group.name = 'HexGridOverlay';
    this.group.visible = false;

    this.mat = new THREE.LineBasicMaterial({
      color: 0x00ffcc, transparent: true, opacity: 0.45,
    });
    this.overlay = new THREE.LineSegments(new THREE.BufferGeometry(), this.mat);
    this.overlay.frustumCulled = false;
    this.group.add(this.overlay);

    const occGeo = new THREE.CylinderGeometry(
      GAME.CylinderRadius - OCCLUDER_INSET, GAME.CylinderRadius - OCCLUDER_INSET,
      OCCLUDER_HEIGHT, 48, 1, true);
    const occMat = new THREE.MeshBasicMaterial({ colorWrite: false });
    this.occluder = new THREE.Mesh(occGeo, occMat);
    this.occluder.frustumCulled = false;
    this.occluder.name = 'HexGridOccluder';
    this.group.add(this.occluder);

    parent.add(this.group);
    this.rebuild();
  }

  // Show only while edit mode is active (and not manually disabled); keep the band
  // centred on `centerY` (the edit camera's pan height). The 2-row step keeps the
  // offset-row parity aligned with the absolute grid.
  update(centerY: number) {
    this.group.visible = this.isActive() && this.enabled;
    if (!this.group.visible) { return; }
    const step = this.grid.rowSpacingY * 2;
    this.group.position.y = Math.round(centerY / step) * step;
  }

  // Rebuild the hex-outline band (local rows around y = 0), each vertex projected
  // individually onto the cylinder. Cheap + occasional (construct + column change).
  rebuild() {
    const { grid } = this;
    const sx = grid.columnSpacingX;
    const s = grid.hexSizeWorld;
    const w = GameConfig.MapWidth;
    const xPerWorld = w / grid.circumference; // arc world-units → map-x
    const { columns } = grid.params;
    const rowH = grid.rowSpacingY;
    const positions: number[] = [];
    const verts = [
      new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
      new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3(),
    ];
    for (let row = -BAND_ROWS / 2; row <= BAND_ROWS / 2; row++) {
      const cy = row * rowH;
      const offset = (row & 1) ? sx * 0.5 : 0;
      for (let col = 0; col < columns; col++) {
        const cx = col * sx + offset;
        for (let k = 0; k < 6; k++) {
          const a = Math.PI / 6 + k * (Math.PI / 3);
          CartesianToCylinder(verts[k],
            cx + s * Math.cos(a) * xPerWorld, cy + s * Math.sin(a), OVERLAY_PROJECT);
        }
        for (let k = 0; k < 6; k++) {
          const a = verts[k];
          const b = verts[(k + 1) % 6];
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
        }
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    this.overlay.geometry.dispose();
    this.overlay.geometry = geo;
  }

  dispose() {
    this.parent.remove(this.group);
    this.overlay.geometry.dispose();
    this.mat.dispose();
    (this.occluder.geometry as THREE.BufferGeometry).dispose();
    (this.occluder.material as THREE.Material).dispose();
  }
}
