import MainLoop from 'mainloop.js';

const DEFAULT = {
  components: null,
};

export default class GameLoop {
  constructor(opts) {
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
    // MainLoop.stop();
    this.paused = true;
  }

  resume() {
    MainLoop.start();
  }

  onUpdate(delta) {
    delta /= 1000;
    this.deltaLeft += delta;
    this.opts.components.physics.update(delta);
  }

  onDraw() {
    const {
      engine, gameInput, enemy, player, map,
      world, playerHud, enemyHud,
    } = this.opts.components;
    const { stats } = this.opts;
    const { position: bodyPosition } = player.playerBody;
    const { position: meshPosition } = player.mesh;
    let delta = this.deltaLeft;
    this.deltaLeft = 0;
    stats && stats.begin();
    if (this.paused) {
      delta = 0;
    }
    enemy.update(delta, engine.camera, bodyPosition);
    player.update(delta, gameInput.state);
    world.update(delta, meshPosition);
    playerHud.update(delta);
    enemyHud.update(delta);
    map.update(delta, bodyPosition);
    engine.render();
    stats && stats.end();
  }

  onEnd(fps, panic) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
