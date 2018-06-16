
import { EVENTS, MAP, DIRECTIONS, LEVELS } from './const';
import { ShuffleArray, ArrayRange } from './utils';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameCollectible from './collectible';
import GameMapChunk from './map-chunk';

const MAP_OFFSET_Y = -10;
const MAP_CHUNK_SIZE = 128;
const CHUNK_LEVELS = {
  [LEVELS.Easy]:   [0, 2],
  [LEVELS.Medium]: [5, 9],
  [LEVELS.Hard]:   [10, 14],
};

const DEFAULT = {
  physics: null,
};

export default class GameMap {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.group = new THREE.Group();
    this.group.name = 'GameMap';
    this.mapParser = new GameMapParser({
      mapId: '#game_map',
      onParse: this.initChunks.bind(this),
    });
    this.initialized = false;
    this.prevIndex = -1;
    this.prevPicks = [];
    this.masterChunks = {};
    this.mapChunks = [];
    this.chunkStates = {};
    this.randomPicks = {};
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
      chunk.saveStartPositions();
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
          // this.addCollectible(x, y);
        } else {
          if (currTile === MAP.StaticPlatform ||
            currTile === MAP.MovingPlatform) {
            platformWidth += 1;
          }
          if (nextTile !== currTile && platformWidth > 0) {
            const xTrans = x - platformWidth / 2 - map.width / 2 + 1;
            const yTrans = yEnd - y;
            const p = this.createPlaform(xTrans, yTrans, platformWidth, currTile);
            platforms.push(p);
            platformWidth = 0;
          }
        }
      }
    }
    return { platforms, collectibles };
  }

  updateChunks(positionY) {
    const idx = Math.round(positionY / MAP_CHUNK_SIZE);
    this.allocateChunkInstance(idx);
    this.updateChunkVisibility(idx);
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

  updateChunkVisibility(idx) {
    const { mapChunks } = this;
    const requiresUpdate = idx !== this.prevIndex;
    this.prevIndex = idx;
    if (requiresUpdate) {
      for (let i = 0; i < mapChunks.length; i++) {
        const chunk = mapChunks[i];
        if (chunk !== undefined) {
          const active = Math.abs(i - idx) <= 1;
          if (active) {
            chunk.load();
          } else {
            chunk.unload();
          }
        }
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
      let range = ArrayRange(start, end);
      range = range.filter(n => prevPicks.indexOf(n) === -1);
      ShuffleArray(range);
      rP[level] = range;
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

  onChunkUnloaded(chunk) {
    console.log('CHUNK UNLOADED:', chunk.opts.index);
    this.toggleChunk(chunk, false);
  }

  onChunkLoaded(chunk) {
    this.toggleChunk(chunk, true);
    console.log('CHUNK LOADED:', chunk.opts.index);
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

  addCollectible(x, y) {
    const { mapParser: map } = this;
    const xTrans = x - map.width / 2;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const collectible = new GameCollectible(xTrans, yTrans);
    collectible.body.events.on(EVENTS.CollisionBegan,
      this.onCollectibleCollisionBegan.bind(this, collectible));
    collectible.events.on(EVENTS.CollectibleCollect,
      this.onCollectibleCollect.bind(this, collectible));
    this.bodies.push(collectible.body);
    this.collectibles.push(collectible);
    this.group.add(collectible.group);
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
    });
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
    });
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

  createPlaform(x, y, width, type) {
    const platform = new GamePlatform({ x, y, width, type });
    return platform;
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
