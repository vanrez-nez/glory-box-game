import MainLoop from 'mainloop.js';

const DEFAULT = {
  components: null,
};

export default class GameLoop {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.bind();
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
  }

  resume() {
    MainLoop.start();
  }

  onUpdate(delta) {
    const {
      engine, gameInput, enemy, player, map,
      world, physics, playerHud, enemyHud,
    } = this.opts.components;
    delta /= 1000;

    const { position: bodyPosition } = player.playerBody;
    const { position: meshPosition } = player.mesh;
    physics.update(delta);
    enemy.update(delta, engine.camera, bodyPosition);
    player.update(delta, gameInput.state);
    world.update(delta, meshPosition);
    playerHud.update(delta);
    enemyHud.update(delta);
    map.update(delta, bodyPosition);
  }

  onDraw() {
    const { stats } = this.opts;
    const { engine } = this.opts.components;
    stats && stats.begin();
    engine.render();
    stats && stats.end();
  }

  onEnd(fps, panic) {
    if (panic) {
      MainLoop.resetFrameDelta();
    }
  }
}
