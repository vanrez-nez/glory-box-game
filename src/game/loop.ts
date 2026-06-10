import MainLoop from 'mainloop.js';
import { GameConfigInstance as GameConfig } from '@/game/config';

const DEFAULT = {
  components: null,
};

// Clamp the per-frame render delta so a stall (tab blur, GC) doesn't teleport
// visuals on the next frame.
const MAX_FRAME_DELTA = 0.1;

export default class GameLoop {
  opts!: Record<string, any>;
  paused!: boolean;
  lastDrawMs!: number;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.bind();
    this.lastDrawMs = 0;
  }

  bind() {
    MainLoop.setUpdate(this.onUpdate.bind(this));
    MainLoop.setDraw(this.onDraw.bind(this));
    MainLoop.setEnd(this.onEnd.bind(this));
  }

  unbind() {
    const NOOP = () => {};
    this.pause();
    MainLoop.setUpdate(NOOP);
    MainLoop.setDraw(NOOP);
    MainLoop.setEnd(NOOP);
  }

  pause() {
    MainLoop.stop();
    this.paused = true;
  }

  resume() {
    this.paused = false;
    this.lastDrawMs = 0; // first frame after resume gets dt=0 (no jump)
    MainLoop.start();
  }

  // Fixed-step SIMULATION (always dt = 1/60). Input, forces and moving-platform
  // motion run here — at the physics rate, independent of display refresh — then
  // the physics step. Order matters: platforms move before the carry samples them.
  onUpdate(stepMs: any) {
    if (GameConfig.StaticDesign) {
      return;
    }
    const dt = stepMs / 1000;
    const { player, map, physics, gameInput } = this.opts.components;
    player.simUpdate(dt, gameInput.state);
    map.simUpdate(dt);
    physics.update(dt);
  }

  // Per-frame RENDER. Bodies are interpolated between the last two physics steps;
  // everything else animates on the REAL frame delta so motion is smooth at the
  // native refresh rate instead of quantized to the 60Hz physics step.
  onDraw(interpolation: any) {
    const {
      engine, enemy, player, map,
      world, playerHud, enemyHud, physics,
    } = this.opts.components;
    const { fpsGraph } = this.opts;
    const { position: bodyPosition } = player.playerBody;
    const { position: meshPosition } = player.mesh;
    const frozen = this.paused || GameConfig.StaticDesign;

    const now = performance.now();
    let delta = this.lastDrawMs ? (now - this.lastDrawMs) / 1000 : 0;
    this.lastDrawMs = now;
    delta = frozen ? 0 : Math.min(delta, MAX_FRAME_DELTA);

    fpsGraph && fpsGraph.begin();
    physics.interpolate(frozen ? 1 : interpolation);
    enemy.update(delta, engine.camera, bodyPosition);
    player.update(delta);
    world.update(delta, meshPosition);
    playerHud.update(delta);
    enemyHud.update(delta);
    map.update(delta, bodyPosition);
    engine.render(delta);
    fpsGraph && fpsGraph.end();
  }

  onEnd(fps: any, panic: any) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
