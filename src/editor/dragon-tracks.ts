import * as THREE from 'three/webgpu';
import { GAME } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';
import type GameEnemyDragon from '@/game/enemy/enemy-dragon';
import type GameDragonDen from '@/game/props/dragon-den';

// Depth-only occluder just inside the wall hides the far side of a wrapping trail (same trick
// as HexGridOverlay). < wall radius so the near side + dens still show.
const OCCLUDER_INSET = 0.5;
const OCCLUDER_HEIGHT = 500;
const ENTRY_COLOR = 0x33ff66;  // emerge den
const TARGET_COLOR = 0xff3344; // dive den
const TRAIL_MAX = 2048;

/*
  Editor-only visualization of the dragon's live motion (the dragon is gait-first now — no
  precomputed rail; see enemy/dragon-serpentine). Draws the head's actual world trail and
  rings the current entry (green) and target (red) dens. Rebuilt every frame while visible.
  Added to world.group on construct.
*/
export default class DragonTracks {
  dragon: GameEnemyDragon;
  parent: THREE.Object3D;
  group: THREE.Group;
  private trailLine: THREE.Line;
  private trailPos: Float32Array;
  private marks: THREE.Group;
  private occluder: THREE.Mesh;

  constructor(dragon: GameEnemyDragon, parent: THREE.Object3D) {
    this.dragon = dragon;
    this.parent = parent;
    this.group = new THREE.Group();
    this.group.name = 'DragonTracks';
    this.group.visible = false;

    this.trailPos = new Float32Array(TRAIL_MAX * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(this.trailPos, 3));
    geo.setDrawRange(0, 0);
    const mat = new THREE.LineBasicMaterial({ color: 0xffd27a });
    mat.fog = false;
    this.trailLine = new THREE.Line(geo, mat);
    this.trailLine.frustumCulled = false;

    this.marks = new THREE.Group();
    this.group.add(this.trailLine, this.marks);

    const occGeo = new THREE.CylinderGeometry(
      GAME.CylinderRadius - OCCLUDER_INSET, GAME.CylinderRadius - OCCLUDER_INSET,
      OCCLUDER_HEIGHT, 48, 1, true);
    const occMat = new THREE.MeshBasicMaterial({ colorWrite: false });
    this.occluder = new THREE.Mesh(occGeo, occMat);
    this.occluder.frustumCulled = false;
    this.group.add(this.occluder);

    parent.add(this.group);
  }

  // Show/hide and (while visible) redraw the live trail + den marks.
  update(visible: boolean) {
    this.group.visible = visible;
    if (!visible) { return; }

    const { trail, entryDen, targetDen } = this.dragon.getDebugState();
    const n = Math.min(trail.length, TRAIL_MAX);
    const start = trail.length - n;
    for (let i = 0; i < n; i++) {
      const p = trail[start + i];
      this.trailPos[i * 3] = p.x; this.trailPos[i * 3 + 1] = p.y; this.trailPos[i * 3 + 2] = p.z;
    }
    this.trailLine.geometry.setDrawRange(0, n);
    this.trailLine.geometry.attributes.position.needsUpdate = true;

    this.clearChildren(this.marks);
    if (entryDen) { this.marks.add(this.buildMark(entryDen, ENTRY_COLOR)); }
    if (targetDen) { this.marks.add(this.buildMark(targetDen, TARGET_COLOR)); }
  }

  private buildMark(den: GameDragonDen, color: number): THREE.Mesh {
    const mat = new THREE.MeshBasicMaterial({ color, wireframe: true });
    mat.fog = false;
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(2.4, 10, 8), mat);
    mesh.frustumCulled = false;
    CartesianToCylinder(mesh.position, den.body.position.x, den.body.position.y, 0);
    return mesh;
  }

  private clearChildren(g: THREE.Group) {
    for (const child of g.children) {
      const o = child as THREE.Mesh;
      (o.geometry as THREE.BufferGeometry).dispose();
      (o.material as THREE.Material).dispose();
    }
    g.clear();
  }

  dispose() {
    this.parent.remove(this.group);
    this.clearChildren(this.marks);
    (this.trailLine.geometry as THREE.BufferGeometry).dispose();
    (this.trailLine.material as THREE.Material).dispose();
    (this.occluder.geometry as THREE.BufferGeometry).dispose();
    (this.occluder.material as THREE.Material).dispose();
  }
}
