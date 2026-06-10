import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { range, shuffle } from 'lodash';
import { EVENTS, MAP, DIRECTIONS, LEVELS } from '@/game/const';
import GameMapParser from '@/game/map-parser';
import GamePlatform from '@/game/platform';
import GameCollectible from '@/game/collectible';
import GameMapChunk from '@/game/map-chunk';
import { POINT_PROPS } from '@/game/props/prop-registry';

const MAP_OFFSET_Y = -10;
const MAP_CHUNK_SIZE = 128;
const CHUNK_LEVELS = {
  [LEVELS.Easy]:   [0, 4],
  [LEVELS.Medium]: [5, 9],
  [LEVELS.Hard]:   [10, 14],
};

interface MapOptions {
  physics: any;
  mapImageElement: HTMLImageElement | null;
}

const DEFAULT: MapOptions = {
  physics: null,
  mapImageElement: null,
};

export default class GameMap {
  opts: MapOptions;
  events: EventEmitter3;
  group: THREE.Group;
  initialized: boolean;
  prevPicks: number[];
  masterChunks: Record<number, any>;
  mapChunks: GameMapChunk[];
  chunkStates: Record<number, any>;
  randomPicks: Record<number, number[]>;
  mapParser!: GameMapParser;

  constructor(opts: Partial<MapOptions> = {}) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.group = new THREE.Group();
    this.group.name = 'GameMap';
    this.initialized = false;
    this.prevPicks = [];
    this.masterChunks = {};
    this.mapChunks = [];
    this.chunkStates = {};
    this.randomPicks = {};
  }

  async load() {
    const { opts } = this;
    return new Promise<void>((resolve) => {
      this.mapParser = new GameMapParser({
        imageElement: opts.mapImageElement,
        onParse: () => {
          this.initChunks();
          resolve();
        },
      });
    });
  }

  dispose() {
    // Stops any in-flight idle prebuild (the step guards on `initialized`).
    this.initialized = false;
    this.prevPicks = [];
    this.masterChunks = {};
    this.chunkStates = {};
    this.randomPicks = {};
  }

  // Map parsing is done; geometry construction is handled by buildAllMasters()
  // (awaited next, behind the load overlay) instead of synchronously here —
  // building all 16 masters at once (~315 LineTrail compiles + socket merges)
  // was the ~400ms startup freeze.
  initChunks() {
    this.initialized = true;
  }

  // Build one master chunk template (the old per-chunk init loop body).
  buildMasterChunk(idx: number) {
    const start = idx * MAP_CHUNK_SIZE;
    const { platforms, props } = this.getChunkObjects(start, MAP_CHUNK_SIZE);
    const collectibles = props.filter((p: any) => p instanceof GameCollectible);
    const chunk = new GameMapChunk({
      index: idx,
      platforms,
      props,
      sockets: [
        this.mergePlatformSockets(platforms),
        this.mergeCollectibleSockets(collectibles),
      ],
    });
    chunk.saveDefaults();
    chunk.isRoot = true;
    return chunk;
  }

  // Memoized accessor — builds the master on first access.
  getMasterChunk(idx: number) {
    const { masterChunks } = this;
    if (masterChunks[idx] === undefined) {
      masterChunks[idx] = this.buildMasterChunk(idx);
    }
    return masterChunks[idx];
  }

  // Build every master the level system can actually pick (the CHUNK_LEVELS
  // ranges — 4/9/14/15 are never used). Frame-budgeted across animation frames
  // so the page stays responsive (the load overlay keeps animating) instead of
  // one long freeze. Awaited during init so the intro only begins once ALL
  // geometry is constructed, not just once assets are decoded.
  buildAllMasters(): Promise<void> {
    const used = new Set<number>();
    Object.values(CHUNK_LEVELS).forEach(([start, end]: any) => {
      range(start, end).forEach((i: number) => used.add(i));
    });
    const queue = [...used].filter(i => this.masterChunks[i] === undefined);
    const raf = (fn: any) => (typeof requestAnimationFrame === 'function'
      ? requestAnimationFrame(fn) : setTimeout(fn, 16));
    const FRAME_BUDGET = 12; // ms — yield after this so a frame can paint
    return new Promise<void>((resolve) => {
      const step = () => {
        // Disposed mid-build (or finished) — unwind so init() can complete.
        if (!this.initialized || queue.length === 0) { resolve(); return; }
        const startedAt = performance.now();
        do {
          this.getMasterChunk(queue.shift() as number);
        } while (queue.length > 0 && performance.now() - startedAt < FRAME_BUDGET);
        raf(step);
      };
      raf(step);
    });
  }

  getChunkObjects(start: number, size: number) {
    const { mapParser: map } = this;
    const platforms = [];
    const props = [];
    const yStart = start % map.height;
    const yEnd = (start + size) % map.height;
    for (let y = yEnd; y >= yStart; y--) {
      let platformWidth = 0;
      for (let x = 0; x < map.width; x++) {
        const nextTile = map.getTileAt(x, y, DIRECTIONS.Right);
        const currTile = map.getTileAt(x, y);
        if (currTile === MAP.Empty) {
          platformWidth = 0;
        } else if (POINT_PROPS[currTile]) {
          // Single-tile props (collectible, dragon den) come from the registry.
          const prop = this.createPointProp(currTile, {
            x: x - map.width / 2,
            y: yEnd - y,
          });
          props.push(prop);
        } else {
          if (currTile === MAP.StaticPlatform ||
            currTile === MAP.MovingPlatform) {
            platformWidth += 1;
          }
          if (nextTile !== currTile && platformWidth > 0) {
            const p = this.createPlatform({
              x: x - platformWidth / 2 - map.width / 2 + 1,
              y: yEnd - y,
              width: platformWidth,
              type: currTile,
            });
            platforms.push(p);
            platformWidth = 0;
          }
        }
      }
    }
    return { platforms, props };
  }

  createPlatform(opts: any) {
    return new GamePlatform(opts);
  }

  createPointProp(type: number, opts: any) {
    const prop = POINT_PROPS[type].create(opts);
    // Collectibles are map-coupled: the map forwards their pickup/collect events
    // up to game state and SFX. Other props (the den) need no wiring yet.
    if (prop instanceof GameCollectible) {
      prop.body.events.on(EVENTS.CollisionBegan,
        this.onCollectibleCollisionBegan.bind(this, prop));
      prop.events.on(EVENTS.CollectibleCollect,
        this.onCollectibleCollect.bind(this, prop));
    }
    return prop;
  }

  updateChunks(positionY: number) {
    const idx = Math.round(positionY / MAP_CHUNK_SIZE);
    this.allocateChunkInstance(idx);
    this.updateChunkVisibility(idx, positionY);
  }

  allocateChunkInstance(idx: number) {
    const { mapChunks } = this;
    if (mapChunks[idx] === undefined) {
      const level = this.getLevel(idx);
      const pick = this.pickRandomChunk(level);
      const offset = idx * MAP_CHUNK_SIZE + MAP_OFFSET_Y;
      const chunk = this.getMasterChunk(pick).getInstance(offset);
      chunk.events.on(EVENTS.MapChunkLoaded, this.onChunkLoaded.bind(this));
      chunk.events.on(EVENTS.MapChunkUnloaded, this.onChunkUnloaded.bind(this));
      mapChunks[idx] = chunk;
    }
  }

  updateChunkVisibility(idx: number, positionY: number) {
    const { mapChunks } = this;
    for (let i = 0; i < mapChunks.length; i++) {
      const chunk = mapChunks[i];
      const halfChunk = MAP_CHUNK_SIZE / 2;
      const cY = i * MAP_CHUNK_SIZE;
      const active = Math.abs(positionY - cY - halfChunk) < MAP_CHUNK_SIZE;
      if (active) {
        chunk.load();
      } else {
        chunk.unload();
      }
    }
  }

  /*
    Returns a random number from the range of a given level.
    It ensures non repeating consecutive numbers of the last 2 numbers
  */
  pickRandomChunk(level: number) {
    const { randomPicks: rP, prevPicks } = this;
    if (rP[level] === undefined || rP[level].length === 0) {
      const [start, end] = CHUNK_LEVELS[level];
      let arr = shuffle(range(start, end));
      arr = arr.filter(n => prevPicks.indexOf(n) === -1);
      rP[level] = arr;
    }
    const pick = rP[level].pop()!;
    this.prevPicks.unshift(pick);
    if (this.prevPicks.length > 2) {
      this.prevPicks.pop();
    }
    return pick;
  }

  getLevel(idx: number) {
    if (idx < 5) {
      return LEVELS.Easy;
    } else if (idx < 10) {
      return LEVELS.Medium;
    } else {
      return LEVELS.Hard;
    }
  }

  restart() {
    const { mapChunks } = this;
    for (let i = 0; i < mapChunks.length; i++) {
      mapChunks[i].loadDefaults();
    }
  }

  onChunkUnloaded(chunk: any) {
    this.toggleChunk(chunk, false);
  }

  onChunkLoaded(chunk: any) {
    this.toggleChunk(chunk, true);
  }

  toggleChunk(chunk: any, enable: boolean) {
    const { platforms, props, sockets } = chunk.opts;
    const pBodies = platforms.map((p: any) => p.body);
    const propBodies = props.map((p: any) => p.body);
    const pMeshes = platforms.map((p: any) => p.mesh);
    const propMeshes = props.map((p: any) => p.group);
    this.togglePhysicsBodies(pBodies, enable);
    this.togglePhysicsBodies(propBodies, enable);
    this.toggleDisplayObjects(pMeshes, enable);
    this.toggleDisplayObjects(propMeshes, enable);
    this.toggleDisplayObjects(sockets, enable);
  }

  togglePhysicsBodies(bodies: any[], enabled: boolean) {
    const { physics } = this.opts;
    enabled ? physics.add(bodies) : physics.remove(bodies);
  }

  toggleDisplayObjects(objects: THREE.Object3D[], enabled: boolean) {
    const { group } = this;
    for (let i = 0; i < objects.length; i++) {
      enabled ? group.add(objects[i]) : group.remove(objects[i]);
    }
  }

  mergePlatformSockets(platforms: any[]) {
    const group = new THREE.Group();
    const socketGeos = [];
    const lightGeos = [];
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      socketGeos.push(p.getSocketGeometry());
      lightGeos.push(p.getSocketLightsGeometry());
    }
    const buffSockets = socketGeos.length
      ? mergeGeometries(socketGeos) : new THREE.BufferGeometry();
    const buffLights = lightGeos.length
      ? mergeGeometries(lightGeos) : new THREE.BufferGeometry();
    const mat = MaterialFactory.getMaterial('PlatformSocket', {
      name: 'plt_socket',
      color: 0x2d2030,
    }, 'plt_socket');
    const lightsMat =  MaterialFactory.getMaterial('PlatformLight', {
      name: 'plt_socket_light',
      color: 0xffffff,
    }, 'plt_socket_light');
    const lights = new THREE.Mesh(buffLights, lightsMat);
    const sockets = new THREE.Mesh(buffSockets, mat);
    sockets.castShadow = true;
    group.add(sockets, lights);
    return group;
  }

  mergeCollectibleSockets(collectibles: any[]) {
    const socketGeos = [];
    for (let i = 0; i < collectibles.length; i++) {
      const c = collectibles[i];
      socketGeos.push(c.glyph.getSocketGeometry());
    }
    const buffGeo = socketGeos.length
      ? mergeGeometries(socketGeos) : new THREE.BufferGeometry();
    const mat = MaterialFactory.getMaterial('CollectibleSocket', {
      name: 'cl_socket',
      color: 0x030508,
    }, 'cl_socket');
    const mesh = new THREE.Mesh(buffGeo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // Raise event for collectible pickup
  onCollectibleCollisionBegan(collectible: any) {
    this.events.emit(EVENTS.CollectiblePickup, collectible);
  }

  // Forward event
  onCollectibleCollect(collectible: any) {
    this.events.emit(EVENTS.CollectibleCollect, collectible);
  }

  // Per-frame render: chunk load/unload bookkeeping + visual prop / moving-
  // platform animation (moving platforms run here, per-draw, so they stay smooth
  // at the display refresh; the physics carry snapshots their displacement).
  update(delta: number, playerPosition: THREE.Vector3) {
    const { mapChunks, initialized } = this;
    if (!initialized) { return; }
    this.updateChunks(playerPosition.y);
    for (let i = 0; i < mapChunks.length; i++) {
      const chunk = mapChunks[i];
      if (chunk.loaded) {
        const { props, platforms } = chunk.opts;
        for (let j = 0; j < props.length; j++) {
          props[j].update(delta);
        }
        for (let j = 0; j < platforms.length; j++) {
          platforms[j].update(delta);
        }
      }
    }
  }
}
