import threads from 'threads';
import { MAP, DIRECTIONS } from '@/game/const';
import { MAP_COLORS } from '@/game/props/map-colors';

const DEFAULT = {
  imageElement: null,
  onParse: () => {},
};

export default class GameMapParser {
  opts!: Record<string, any>;
  width!: number;
  height!: number;
  tiles!: any[];
  mapImageData!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.width = 0;
    this.height = 0;
    this.tiles = [];
    this.mapImageData = null;
    this.init();
  }

  async init() {
    await this.waitForImage();
    this.readImageData();
    this.parseMap();
  }

  waitForImage() {
    const { imageElement: img } = this.opts;
    return new Promise<void>((resolve) => {
      if (img.complete || img.naturalWidth !== 0) {
        resolve();
      } else {
        img.addEventListener('load', resolve);
      }
    });
  }

  readImageData() {
    const { imageElement: img } = this.opts;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const { width: w, height: h } = img;
    canvas.width = w;
    canvas.height = h;
    ctx.drawImage(img, 0, 0);
    this.width = w;
    this.height = h;
    this.mapImageData = ctx.getImageData(0, 0, w, h).data;
  }

  stepToDirection(x: any, y: any, direction: any) {
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

  getIndexFromCoords(x: any, y: any) {
    return y * this.width + x;
  }

  getCoordsFromIndex(idx: any) {
    const x = idx % this.width;
    const y = Math.floor(idx / this.width);
    return [x, y];
  }

  getTileAt(x: any, y: any, direction = DIRECTIONS.None) {
    const [xTo, yTo] = this.stepToDirection(x, y, direction);
    if (x <= this.width && y <= this.height) {
      const idx = yTo * this.width + xTo;
      return this.tiles[idx];
    }
    return undefined;
  }

  parseMap() {
    const t = threads.spawn((input: any, done: any) => {
      const result = [];
      const { mapData: data, width, height, Colors, EmptyType } = input;
      function getMapPixelRGB(x: any, y: any) {
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
      Colors: MAP_COLORS,
      EmptyType: MAP.Empty,
    }).on('message', (output: any) => {
      this.tiles = output.tiles;
      this.opts.onParse();
      // One-shot parse — terminate the worker so it doesn't linger idle (the
      // browser otherwise keeps waking it, showing up as thread-pool noise).
      // `kill()` exists at runtime (Worker.prototype.kill) but isn't in the types.
      (t as any).kill();
    });
  }
}
