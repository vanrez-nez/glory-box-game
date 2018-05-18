
import { EVENTS, MAP, DIRECTIONS } from './const';
import { MaterialFactoryInstance as MaterialFactory } from './materials/material-factory';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameCollectible from './collectible';

const MAP_OFFSET_Y = -10;

export default class GameMap {
  constructor() {
    this.events = new EventEmitter3();
    this.group = new THREE.Group();
    this.mapParser = new GameMapParser('#game_map');
    this.platforms = [];
    this.bodies = [];
    this.collectibles = [];
    this.generatePlatform();
    this.mergePlatformSockets();
    this.mergeCollectibleSockets();
  }

  generatePlatform() {
    const { mapParser: map } = this;
    for (let y = 0; y < map.height; y++) {
      let platformWidth = 0;

      for (let x = 0; x < map.width; x++) {
        const nextTile = map.getTileAt(x, y, DIRECTIONS.Right);
        const currTile = map.getTileAt(x, y);
        if (currTile === MAP.Empty) {
          platformWidth = 0;
        } else if (currTile === MAP.Glyph) {
          this.addCollectible(x, y);
        } else {
          if (currTile === MAP.StaticPlatform ||
            currTile === MAP.MovingPlatform) {
            platformWidth += 1;
          }
          if (nextTile !== currTile && platformWidth > 0) {
            this.addPlaform(x, y, platformWidth, currTile);
            platformWidth = 0;
          }
        }
      }
    }
  }

  addCollectible(x, y) {
    const { mapParser: map } = this;
    const xTrans = x - map.width / 2;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const collectible = new GameCollectible(xTrans, yTrans);
    collectible.body.events.on(EVENTS.CollisionBegan,
      this.onCollectibleCollisionBegan.bind(this, collectible));
    this.bodies.push(collectible.body);
    this.collectibles.push(collectible);
    this.group.add(collectible.group);
  }

  mergePlatformSockets() {
    const { platforms } = this;
    const geo = new THREE.Geometry();
    for (let i = 0; i < platforms.length; i++) {
      const p = platforms[i];
      geo.merge(p.getSocketGeometry());
    }
    const mat = MaterialFactory.getMaterial('PlatformSocket', { color: 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    this.group.add(mesh);
  }

  mergeCollectibleSockets() {
    const { collectibles } = this;
    const geo = new THREE.Geometry();
    for (let i = 0; i < collectibles.length; i++) {
      const c = collectibles[i];
      geo.merge(c.glyph.getSocketGeometry());
    }
    const mat = MaterialFactory.getMaterial('CollectibleSocket', { color: 0xffffff });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  onCollectibleCollisionBegan(collectible) {
    this.events.emit(EVENTS.CollectiblePickup, collectible);
  }

  addPlaform(x, y, width, type) {
    const { bodies, group, platforms, mapParser: map } = this;
    const xTrans = x - width / 2 - map.width / 2 + 1;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const platform = new GamePlatform({ x: xTrans, y: yTrans, width, type });
    bodies.push(platform.body);
    group.add(platform.mesh);
    platforms.push(platform);
  }

  update(delta) {
    const { platforms, collectibles } = this;

    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].visible) {
        platforms[i].update(delta);
      }
    }
    for (let i = 0; i < collectibles.length; i++) {
      if (collectibles[i].visible) {
        collectibles[i].update(delta);
      }
    }
  }
}
