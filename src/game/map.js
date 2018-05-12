
import { MAP, DIRECTIONS } from './const';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameCollectible from './collectible';

const MAP_OFFSET_Y = -10;

export default class GameMap {
  constructor() {
    this.group = new THREE.Group();
    this.mapParser = new GameMapParser('#game_map');
    this.platforms = [];
    this.bodies = [];
    this.collectibles = [];
    this.generatePlatform();
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
    this.collectibles.push(collectible);
    this.group.add(collectible.group);
  }

  addPlaform(x, y, width, type) {
    const { bodies, group, platforms, mapParser: map } = this;
    const xTrans = x - width / 2 - map.width / 2 + 1;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const platform = new GamePlatform({ x: xTrans, y: yTrans, width, type });
    bodies.push(platform.body);
    group.add(platform.mesh);
    group.add(platform.holderSocketMesh);
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
