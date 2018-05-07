import { MAP, DIRECTIONS } from './const';

const MAP_PARSE_COLORS = {
  '0,0,0': MAP.Empty,
  '255,0,0': MAP.StaticPlatform,
  '0,0,255': MAP.MovingPlatform,
  '0,255,0': MAP.Glyph,
};

export default class GameMapParser {
  constructor(mapId) {
    this.width = 0;
    this.height = 0;
    this.tiles = [];
    this.mapImageData = this.getImageData(mapId);
    this.parseMap();
  }

  getImageData(id) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = document.querySelector(id);
    const { width: w, height: h } = img;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);
    this.width = w;
    this.height = h;
    return ctx.getImageData(0, 0, w, h).data;
  }

  stepToDirection(x, y, direction) {
    let xTo = x;
    let yTo = y;
    switch (direction) {
      case DIRECTIONS.Up:    yTo -= 1; break;
      case DIRECTIONS.Right: xTo += 1; break;
      case DIRECTIONS.Down:  yTo += 1; break;
      case DIRECTIONS.Left:  xTo -= 1; break;
      default: break;
    }
    return [xTo, yTo];
  }

  getMapPixelRGB(x, y) {
    const { mapImageData: data, width } = this;
    const idx = (x + width * y) * 4;
    return [data[idx + 0], data[idx + 1], data[idx + 2]];
  }

  getIndexFromCoords(x, y) {
    return y * this.width + x;
  }

  getCoordsFromIndex(idx) {
    const x = idx % this.width;
    const y = Math.floor(idx / this.width);
    return [x, y];
  }

  getTileAt(x, y, direction = DIRECTIONS.None) {
    const [xTo, yTo] = this.stepToDirection(x, y, direction);
    if (x <= this.width && y <= this.height) {
      const idx = yTo * this.width + xTo;
      return this.tiles[idx];
    }
    return undefined;
  }

  parseMap() {
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const [r, g, b] = this.getMapPixelRGB(x, y);
        this.tiles.push(MAP_PARSE_COLORS[`${r},${g},${b}`]);
      }
    }
  }
}
