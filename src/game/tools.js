
export default class GameTools {
  constructor() {
    this.gui = new dat.GUI({
      load: JSON,
    });
  }

  addScreen(obj, screen) {
    switch (screen) {
      case 'player':
        this.buildPlayerScreen(obj);
        break;
      case 'physics':
        this.buildPhysicsScreen(obj);
        break;
      default:
        break;
    }
  }

  buildPhysicsScreen(obj) {
    const { gui } = this;
    const f1 = gui.addFolder('World');

    gui.remember(obj.opts.gravity);
    f1.add(obj.opts.gravity, 'x', -0.5, 0.5).name('Gravity X');
    f1.add(obj.opts.gravity, 'y', -0.5, 0.5).name('Gravity Y');
  }

  buildPlayerScreen(obj) {
    const { gui } = this;
    const f1 = gui.addFolder('Player');

    gui.remember(obj.body.opts);
    f1.add(obj.body.opts, 'mass', 0.01, 1).name('Mass');
    f1.add(obj.body.opts, 'friction', 0.01, 1).name('Friction');

    gui.remember(obj.body.opts.maxVelocity);
    f1.add(obj.body.opts.maxVelocity, 'x', 0.1, 2).name('Max Velocity X');
    f1.add(obj.body.opts.maxVelocity, 'y', 0.1, 2).name('Max Velocity Y');

    gui.remember(obj.opts);
    f1.add(obj.opts, 'walkForce', 0.01, 2).name('Walk Force');
    f1.add(obj.opts, 'jumpForce', 0.01, 2).name('Jump Force');
    // const f2 = gui.addFolder('');
  }
}
