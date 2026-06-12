import * as THREE from 'three/webgpu';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import GamePlatform from '@/game/platform';
import GameCollectible from '@/game/collectible';
import GameDragonDen from '@/game/props/dragon-den';
import { MAP } from '@/game/const';
import type HexGrid from '@/game/world/hex-grid';
import type { PlacedItem } from '@/game/level/types';

export interface SpawnCtx {
  group: THREE.Object3D;
  physics: any;
  hexGrid: HexGrid;
  activeDens: any[];
}

export interface SpawnedEntry {
  prop: any;
  socket?: THREE.Group;
}

// Place a freshly-built prop at map-space (x,y). body.renderPosition is a truthy
// (0,0), so the renderPosition||position fallback in the sync never fires — copy
// the position into BOTH or the prop draws at the cylinder origin. Then run the
// body's own onUpdate (platform mesh / collectible item / den group sync).
function positionProp(prop: any, x: number, y: number) {
  const b = prop.body;
  b.position.set(x, y);
  b.prevPosition.copy(b.position);
  b.renderPosition.copy(b.position);
  b.prevRenderPosition.copy(b.position);
  if (b.opts.onUpdate) { b.opts.onUpdate(b); }
}

function build(record: PlacedItem, hexGrid: HexGrid): any {
  const c = hexGrid.cellCenter(record.anchor.col, record.anchor.row);
  const meta = record.meta || {};
  switch (record.type) {
    case 'staticPad':
    case 'movingPad': {
      // meta.width = TRACK in CELLS → world arc spans exactly that many columns.
      // Static: the pad fills the track. Moving: a padPercent-fraction pad
      // oscillates within the track (trackWidth drives socket + movement).
      const track = (meta.width ?? 1) * hexGrid.columnSpacingX;
      if (record.type === 'movingPad') {
        const pad = (meta.padPercent ?? 1 / 3) * track;
        return new GamePlatform({
          x: c.x, y: c.y, width: pad, trackWidth: track, type: MAP.MovingPlatform,
        });
      }
      return new GamePlatform({ x: c.x, y: c.y, width: track, type: MAP.StaticPlatform });
    }
    case 'collectible':
      return new GameCollectible({ x: c.x, y: c.y, type: meta.glyph ?? 0 });
    case 'den':
      return new GameDragonDen({ x: c.x, y: c.y, direction: meta.direction ?? 'both' });
    default:
      return null;
  }
}

// Inset wall socket(s) (the old chunk pipeline merged these per chunk). Geometry is
// baked at the prop's world position, so the group needs no positioning. Dens draw
// their own frame → no socket.
function buildSocket(prop: any, type: string): THREE.Group | null {
  if (type === 'staticPad' || type === 'movingPad') {
    const g = new THREE.Group();
    const socketMat = MaterialFactory.getMaterial('PlatformSocket', {
      name: 'plt_socket', color: 0x2d2030,
    }, 'plt_socket');
    const lightMat = MaterialFactory.getMaterial('PlatformLight', {
      name: 'plt_socket_light', color: 0xffffff,
    }, 'plt_socket_light');
    const sockets = new THREE.Mesh(prop.getSocketGeometry(), socketMat);
    sockets.castShadow = true;
    const lights = new THREE.Mesh(prop.getSocketLightsGeometry(), lightMat);
    g.add(sockets, lights);
    return g;
  }
  if (type === 'collectible') {
    const mat = MaterialFactory.getMaterial('CollectibleSocket', {
      name: 'cl_socket', color: 0x030508,
    }, 'cl_socket');
    const g = new THREE.Group();
    g.add(new THREE.Mesh(prop.glyph.getSocketGeometry(), mat));
    return g;
  }
  return null;
}

// Spawn the real game prop for a record: build it, add mesh + socket to the group,
// register the body with physics, and (dens) push into activeDens for the dragon.
export function spawnRecord(record: PlacedItem, ctx: SpawnCtx): SpawnedEntry | null {
  const prop = build(record, ctx.hexGrid);
  if (!prop) { return null; }
  const c = ctx.hexGrid.cellCenter(record.anchor.col, record.anchor.row);
  ctx.group.add(prop.mesh ?? prop.group);
  positionProp(prop, c.x, c.y);
  const socket = buildSocket(prop, record.type) ?? undefined;
  if (socket) { ctx.group.add(socket); }
  ctx.physics.add(prop.body);
  if (record.type === 'den') { ctx.activeDens.push(prop); }
  return { prop, socket };
}

// Remove from scene/physics. NEVER dispose shared/cached geometries.
export function despawnEntry(entry: SpawnedEntry, ctx: SpawnCtx) {
  const { prop, socket } = entry;
  ctx.group.remove(prop.mesh ?? prop.group);
  if (socket) { ctx.group.remove(socket); }
  ctx.physics.remove(prop.body);
  const idx = ctx.activeDens.indexOf(prop);
  if (idx !== -1) { ctx.activeDens.splice(idx, 1); }
}

// Per-frame animation (collectible particles, moving-pad oscillation). Driven by
// the game loop with the real (frozen-aware) delta — the carry path matches the
// original chunk pipeline.
export function tickEntry(entry: SpawnedEntry, delta: number) {
  if (typeof entry.prop.update === 'function') { entry.prop.update(delta); }
}
