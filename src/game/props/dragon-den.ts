import * as THREE from 'three/webgpu';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import GamePhysicsBody from '@/game/physics/physics-body';
import { GAME, PHYSICS } from '@/game/const';
import { CartesianToCylinder } from '@/game/utils';
import { createHexRingGeometry, createHexWindowGeometry } from '@/game/props/socket-geometry';
import { CylinderProp } from '@/game/props/cylinder-prop';

/*
  Dragon Den — a hexagonal hole inset into the cylinder wall, the dragon's future
  hideaway. A hex `frame` rim sits on the surface around a recessed `window` face
  rendered with the interior-mapping material (SocketInterior), which fakes the
  depth of an empty recess. Map-derived (MAP.DragonDen) like a collectible.

  The dragon's behaviour to actually enter and hide here is deferred; the den is
  visual-only for now. The sensor body carries its map-space position (so the
  chunk can place/translate it) and is the hook a future dragon-enter trigger
  will use.
*/

const RING_DEPTH = 0.5;
let FrameGeometry: THREE.BufferGeometry | null = null;
let WindowGeometry: THREE.BufferGeometry | null = null;
const tmpLook = new THREE.Vector3();

export type DenDirection = 'input' | 'output' | 'both';

const DEFAULT = {
  x: 0,
  y: 0,
  // Which dragon transitions this den allows: emerge-from (input), dive-into
  // (output), or both. Default 'both' = original behaviour (every den is both).
  direction: 'both' as DenDirection,
};

export default class GameDragonDen implements CylinderProp {
  opts!: Record<string, any>;
  group: THREE.Group;
  body!: GamePhysicsBody;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.group = new THREE.Group();
    this.group.name = 'GameDragonDen';
    this.addFrame();
    this.addWindow();
    this.addBody();
  }

  static getFrameGeometry() {
    if (FrameGeometry === null) {
      FrameGeometry = createHexRingGeometry(2.9, 2.05, RING_DEPTH);
      // Centre the extrusion on z so the rim reads from either side of the face.
      FrameGeometry.translate(0, 0, -RING_DEPTH / 2);
    }
    return FrameGeometry;
  }

  static getWindowGeometry() {
    if (WindowGeometry === null) {
      WindowGeometry = createHexWindowGeometry(2.0);
    }
    return WindowGeometry;
  }

  addFrame() {
    const mat = MaterialFactory.getMaterial('CollectibleSocket', {
      name: 'dragon_den_frame',
      color: 0x05060a,
    }, 'dragon_den_frame');
    const mesh = new THREE.Mesh(GameDragonDen.getFrameGeometry(), mat);
    this.group.add(mesh);
  }

  addWindow() {
    const mat = MaterialFactory.getMaterial('SocketInterior', {
      name: 'dragon_den_interior',
    }, 'dragon_den_interior');
    const mesh = new THREE.Mesh(GameDragonDen.getWindowGeometry(), mat);
    this.group.add(mesh);
  }

  addBody() {
    const { x, y } = this.opts;
    this.body = new GamePhysicsBody({
      type: PHYSICS.DragonDen,
      isStatic: true,
      isSensor: true,
      label: 'dragon_den',
      onUpdate: this.syncGroup.bind(this),
      distance: GAME.DragonDenOffset,
      scale: new THREE.Vector2(4, 4),
      // No collision targets yet — the dragon-enter trigger lands with the
      // deferred movement work.
      collisionTargets: [],
    });
    this.body.position.set(x, y);
  }

  setPosition(position: THREE.Vector2) {
    this.body.position.copy(position);
    // Place the group immediately (chunk load calls this before the body is in
    // the physics world) so it doesn't render at the origin for a frame.
    this.body.renderPosition.copy(position);
    this.syncGroup(this.body);
  }

  // Place the whole den group on the cylinder facing outward (toward the player),
  // matching how the collectible glyph orients its socket.
  syncGroup(body: any) {
    const { group } = this;
    const pos = body.renderPosition || body.position;
    CartesianToCylinder(group.position, pos.x, pos.y, GAME.DragonDenOffset);
    const look = tmpLook.set(0, pos.y, 0);
    look.subVectors(group.position, look).add(group.position);
    group.lookAt(look);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  update(_delta: number) {
    // Static for now; interior animation / dragon-occupied state lands later.
  }
}
