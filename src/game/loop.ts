import MainLoop from 'mainloop.js';
import { GameConfigInstance as GameConfig } from '@/game/config';

const DEFAULT = {
  components: null,
};

export default class GameLoop {
  opts!: Record<string, any>;
  deltaLeft!: number;
  paused!: boolean;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.bind();
    this.deltaLeft = 0;
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
    MainLoop.start();
  }

  onUpdate(delta: any) {
    delta /= 1000;
    this.deltaLeft += delta;
    // StaticDesign freezes the world (no physics) but the loop keeps running so
    // render() + orbit controls stay live for inspection.
    if (!GameConfig.StaticDesign) {
      this.opts.components.physics.update(delta);
    }
  }

  onDraw(interpolation: any) {
    const {
      engine, gameInput, enemy, player, map,
      world, playerHud, enemyHud, physics,
    } = this.opts.components;
    const { fpsGraph } = this.opts;
    const { position: bodyPosition } = player.playerBody;
    const { position: meshPosition } = player.mesh;
    let delta = this.deltaLeft;
    this.deltaLeft = 0;
    fpsGraph && fpsGraph.begin();
    if (this.paused || GameConfig.StaticDesign) {
      delta = 0;
    }
    // Position every body's mesh at the interpolated point between the last two
    // fixed physics steps, so the render is smooth at any display refresh rate.
    physics.interpolate(this.paused || GameConfig.StaticDesign ? 1 : interpolation);
    enemy.update(delta, engine.camera, bodyPosition);
    player.update(delta, gameInput.state);
    world.update(delta, meshPosition);
    playerHud.update(delta);
    enemyHud.update(delta);
    map.update(delta, bodyPosition);
    engine.render();
    fpsGraph && fpsGraph.end();
  }

  onEnd(fps: any, panic: any) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
