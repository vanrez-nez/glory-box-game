
import { range, shuffle } from 'lodash';
import { EVENTS, MAP, DIRECTIONS, LEVELS } from './const';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameCollectible from './collectible';
import GameMapChunk from './map-chunk';

const MAP_OFFSET_Y = -10;
const MAP_CHUNK_SIZE = 128;
const CHUNK_LEVELS = {
  [LEVELS.Easy]:   [0, 4],
  [LEVELS.Medium]: [5, 9],
  [LEVELS.Hard]:   [10, 14],
};

const DEFAULT = {
  physics: null,
  mapImageElement: null,
};

export default class GameMap {
  constructor(opts) {
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
    return new Promise((resolve) => {
      this.mapParser = new GameMapParser({
        imageElement: opts.mapImageElement,
        onParse: () => {
          this.initChunks();
          resolve();
        },
      });
    });
  }

  initChunks() {
    const { masterChunks, mapParser: map } = this;
    const count = Math.floor(map.height / MAP_CHUNK_SIZE);
    for (let idx = 0; idx < count; idx++) {
      const start = idx * MAP_CHUNK_SIZE;
      const size = MAP_CHUNK_SIZE;
      const { platforms, collectibles } = this.getChunkObjects(start, size);
      const chunk = new GameMapChunk({
        index: idx,
        platforms,
        collectibles,
        sockets: [
          this.mergePlatformSockets(platforms),
          this.mergeCollectibleSockets(collectibles),
        ],
      });
      chunk.saveDefaults();
      chunk.isRoot = true;
      masterChunks[idx] = chunk;
    }
    this.initialized = true;
  }

  getChunkObjects(start, size) {
    const { mapParser: map } = this;
    const platforms = [];
    const collectibles = [];
    const yStart = start % map.height;
    const yEnd = (start + size) % map.height;
    for (let y = yEnd; y >= yStart; y--) {
      let platformWidth = 0;
      for (let x = 0; x < map.width; x++) {
        const nextTile = map.getTileAt(x, y, DIRECTIONS.Right);
        const currTile = map.getTileAt(x, y);
        if (currTile === MAP.Empty) {
          platformWidth = 0;
        } else if (currTile === MAP.Glyph) {
          const c = this.createCollectible({
            x: x - map.width / 2,
            y: yEnd - y,
          });
          collectibles.push(c);
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
    return { platforms, collectibles };
  }

  createPlatform(opts) {
    return new GamePlatform(opts);
  }

  createCollectible(opts) {
    const collectible = new GameCollectible(opts);
    collectible.body.events.on(EVENTS.CollisionBegan,
      this.onCollectibleCollisionBegan.bind(this, collectible));
    collectible.events.on(EVENTS.CollectibleCollect,
      this.onCollectibleCollect.bind(this, collectible));
    return collectible;
  }

  updateChunks(positionY) {
    const idx = Math.round(positionY / MAP_CHUNK_SIZE);
    this.allocateChunkInstance(idx);
    this.updateChunkVisibility(idx, positionY);
  }

  allocateChunkInstance(idx) {
    const { mapChunks, masterChunks } = this;
    if (mapChunks[idx] === undefined) {
      const level = this.getLevel(idx);
      const pick = this.pickRandomChunk(level);
      const offset = idx * MAP_CHUNK_SIZE + MAP_OFFSET_Y;
      const chunk = masterChunks[pick].getInstance(offset);
      chunk.events.on(EVENTS.MapChunkLoaded, this.onChunkLoaded.bind(this));
      chunk.events.on(EVENTS.MapChunkUnloaded, this.onChunkUnloaded.bind(this));
      mapChunks[idx] = chunk;
    }
  }

  updateChunkVisibility(idx, positionY) {
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
  pickRandomChunk(level) {
    const { randomPicks: rP, prevPicks } = this;
    if (rP[level] === undefined || rP[level].length === 0) {
      const [start, end] = CHUNK_LEVELS[level];
      let arr = shuffle(range(start, end));
      arr = arr.filter(n => prevPicks.indexOf(n) === -1);
      rP[level] = arr;
    }
    const pick = rP[level].pop();
    this.prevPicks.unshift(pick);
    if (this.prevPicks.length > 2) {
      this.prevPicks.pop();
    }
    return pick;
  }

  getLevel(idx) {
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

  onChunkUnloaded(chunk) {
    this.toggleChunk(chunk, false);
  }

  onChunkLoaded(chunk) {
    this.toggleChunk(chunk, true);
  }

  toggleChunk(chunk, enable) {
    const { platforms, collectibles, sockets } = chunk.opts;
    const pBodies = platforms.map(p => p.body);
    const cBodies = collectibles.map(c => c.body);
    const pMeshes = platforms.map(p => p.mesh);
    const cMeshes = collectibles.map(c => c.group);
    this.togglePhysicsBodies(pBodies, enable);
    this.togglePhysicsBodies(cBodies, enable);
    this.toggleDisplayObjects(pMeshes, enable);
    this.toggleDisplayObjects(cMeshes, enable);
    this.toggleDisplayObjects(sockets, enable);
  }

  togglePhysicsBodies(bodies, enabled) {
    const { physics } = this.opts;
    enabled ? physics.add(bodies) : physics.remove(bodies);
  }

  toggleDisplayObjects(objects, enabled) {
    const { group } = this;
    for (let i = 0; i < objects.length; i++) {
      enabled ? group.add(objects[i]) : group.remove(objects[i]);
    }
  }

  mergePlatformSockets(platforms) {
    const geo = new THREE.Geometry();
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      geo.merge(p.getSocketGeometry());
    }
    const buffGeo = new THREE.BufferGeometry().fromGeometry(geo);
    const mat = MaterialFactory.getMaterial('PlatformSocket', {
      name: 'plt_socket',
      color: 0x030508,
    }, 'plt_socket');
    const mesh = new THREE.Mesh(buffGeo, mat);
    return mesh;
  }

  mergeCollectibleSockets(collectibles) {
    const geo = new THREE.Geometry();
    for (let i = 0; i < collectibles.length; i++) {
      const c = collectibles[i];
      geo.merge(c.glyph.getSocketGeometry());
    }
    const buffGeo = new THREE.BufferGeometry().fromGeometry(geo);
    const mat = MaterialFactory.getMaterial('CollectibleSocket', {
      name: 'cl_socket',
      color: 0x030508,
    }, 'cl_socket');
    const mesh = new THREE.Mesh(buffGeo, mat);
    mesh.castShadow = true;
    return mesh;
  }

  // Raise event for collectible pickup
  onCollectibleCollisionBegan(collectible) {
    this.events.emit(EVENTS.CollectiblePickup, collectible);
  }

  // Forward event
  onCollectibleCollect(collectible) {
    this.events.emit(EVENTS.CollectibleCollect, collectible);
  }

  update(delta, playerPosition) {
    const { mapChunks } = this;
    if (this.initialized) {
      this.updateChunks(playerPosition.y);
      for (let i = 0; i < this.mapChunks.length; i++) {
        const chunk = mapChunks[i];
        if (chunk.loaded) {
          const { collectibles, platforms } = chunk.opts;
          for (let j = 0; j < collectibles.length; j++) {
            collectibles[j].update(delta);
          }
          for (let j = 0; j < platforms.length; j++) {
            platforms[j].update(delta);
          }
        }
      }
    }
  }
}
