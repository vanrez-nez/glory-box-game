import thread from 'threads';
import { MAP, DIRECTIONS } from './const';

const DEFAULT = {
  mapId: '',
  onParse: () => {},
};

const MAP_PARSE_COLORS = {
  '255,0,0': MAP.StaticPlatform,
  '0,0,255': MAP.MovingPlatform,
  '0,255,0': MAP.Glyph,
};

export default class GameMapParser {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.width = 0;
    this.height = 0;
    this.tiles = [];
    this.mapImageData = this.getImageData(opts.mapId);
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
    const t = thread.spawn((input, done) => {
      const result = [];
      const { mapData: data, width, height, Colors, EmptyType } = input;
      function getMapPixelRGB(x, y) {
        const idx = (x + width * y) * 4;
        return [data[idx + 0], data[idx + 1], data[idx + 2]];
      }
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const color = getMapPixelRGB(x, y);
          const key = `${color[0]},${color[1]},${color[2]}`;
          const type = Colors[key] || EmptyType;
          result.push(type);
        }
      }
      done({ tiles: result });
    });
    t.send({
      mapData: this.mapImageData,
      width: this.width,
      height: this.height,
      Colors: MAP_PARSE_COLORS,
      EmptyType: MAP.Empty,
    }).on('message', (output) => {
      this.tiles = output.tiles;
      this.opts.onParse();
    });
  }
}
