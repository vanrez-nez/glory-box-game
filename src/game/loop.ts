import MainLoop from 'mainloop.js';

const DEFAULT = {
  components: null,
};

// Seconds per fixed physics step (mainloop's default simulation timestep).
const FIXED_DELTA = (1000 / 60) / 1000;
// Clamp the per-frame render delta so a stall (tab blur, GC) doesn't teleport
// visuals on the next frame.
const MAX_FRAME_DELTA = 0.1;

export default class GameLoop {
  opts!: Record<string, any>;
  paused!: boolean;
  // Physics steps run since the last draw, and the previous draw's interpolation
  // phase — together they reconstruct the real frame delta from mainloop's own
  // (rAF-timestamp) clock, the SAME clock the body interpolation uses.
  stepCount!: number;
  lastInterpolation!: number;
  // Generic "freeze the simulation" flag (the editor sets it for edit mode):
  // physics steps are skipped and visuals hold, but rendering continues.
  frozen = false;
  // Optional per-frame hooks (the editor uses them for its per-frame work + FPS
  // bracketing). The game core never sets these.
  onFrameStart?: () => void;
  onFrameEnd?: () => void;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.bind();
    this.stepCount = 0;
    this.lastInterpolation = 0;
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
    this.stepCount = 0;
    this.lastInterpolation = 0;
    MainLoop.start();
  }

  // Fixed-step SIMULATION (always dt = 1/60). Input/forces run here — at the
  // physics rate, independent of display refresh — then the physics step. Skipped
  // while frozen (edit mode) so the world holds still.
  onUpdate(stepMs: any) {
    if (this.frozen) {
      return;
    }
    const dt = stepMs / 1000;
    const { player, physics, gameInput } = this.opts.components;
    player.simUpdate(dt, gameInput.state);
    physics.update(dt);
    this.stepCount += 1;
  }

  // Per-frame RENDER. Bodies are interpolated between the last two physics steps;
  // everything else animates on a frame delta reconstructed from mainloop's own
  // timeline — (steps this frame + change in interpolation phase) * fixed step —
  // so visuals stay locked to the same clock as the interpolation (no relative
  // jitter, and no performance.now() callback noise).
  onDraw(interpolation: any) {
    this.onFrameStart?.();
    const {
      engine, enemy, player, map,
      world, playerHud, enemyHud, physics,
    } = this.opts.components;
    const { position: bodyPosition } = player.playerBody;
    const { position: meshPosition } = player.mesh;
    const frozen = this.paused || this.frozen;

    let delta = (this.stepCount + interpolation - this.lastInterpolation) * FIXED_DELTA;
    this.stepCount = 0;
    this.lastInterpolation = interpolation;
    delta = frozen ? 0 : Math.min(Math.max(delta, 0), MAX_FRAME_DELTA);

    physics.interpolate(frozen ? 1 : interpolation);
    enemy.update(delta, engine.camera, bodyPosition, map);
    player.update(delta);
    world.update(delta, meshPosition);
    playerHud.update(delta);
    enemyHud.update(delta);
    map.update(delta, bodyPosition);
    engine.render(delta);
    this.onFrameEnd?.();
  }

  onEnd(fps: any, panic: any) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
