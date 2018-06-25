
/*
  TODO:
    - Feat: Player falling on sides should generate friction and be able to jump
    - Feat: Shake effect
    - Feat: Desintegration and reintegration of player
    - Feat: Player lobby with random freebies and initial impulse
    - Feat: Audio Effects on Jump
    - Feat: Initial audio atmosphere for lobby and transition to full audio when player starts
    - Feat: Player rotation when walking and jumping
    - Feat: Game Menu with (start, audio, quality selector, logo and instructions)
    - Feat: Game HUD
    - Feat: Danger pressure from bottom
    - Feat: Background geometry on center
    - Feat: Background geometry on sides
    - Feat: Teasing audio effects
    - Feat: Leveling
    - Feat: Obstacles ()
    - Feat: Powerups (impulsers, shields)
    - Feat: Illumination and vignette effect
*/
import { CONFIG, GAME } from './game/const';
import Engine from './game/engine';
import GameState from './game/state';
import GameTools from './game/tools';
import GameInput from './game/input';
import GamePhysics from './game/physics';
import GamePlayer from './game/player';
import GameWorld from './game/world';
import GameMap from './game/map';
import GameSfxManager from './game/sfx-manager';
import GameMoodManager from './game/mood-manager';
import GameEnemy from './game/enemy';
import GamePlayerHud from './game/player-hud';
import GameEnemyHud from './game/enemy-hud';
// import GameAudioManager from './game/audio-manager';

class Game {
  constructor() {
    this.started = false;
    this.init();
    this.updateSize();
    this.attachEvents();
    this.loader = THREE.DefaultLoadingManager;
    this.loader.onProgress = (url, itemsLoaded, itemsTotal) => {
      if (itemsLoaded === itemsTotal) {
        this.start();
      }
    };
  }

  init() {
    this.gameInput = new GameInput();
    this.engine = new Engine({
      canvas: document.body.querySelector('#js-canvas'),
    });
    //this.audioManager = new GameAudioManager({});
    this.physics = new GamePhysics({
      bounds: new THREE.Box2(
        new THREE.Vector2(GAME.BoundsLeft, GAME.BoundsTop),
        new THREE.Vector2(GAME.BoundsRight, GAME.BoundsBottom)),
    });

    this.player = new GamePlayer({
    });
    this.map = new GameMap({
      physics: this.physics,
    });
    this.enemy = new GameEnemy({});
    this.world = new GameWorld();
    this.moodManager = new GameMoodManager({
      engine: this.engine,
      map: this.map,
      world: this.world,
    });
    this.playerHud = new GamePlayerHud({
      camera: this.engine.camera,
    });

    this.enemyHud = new GameEnemyHud({
      camera: this.engine.camera,
    });

    this.gameState = new GameState({
      map: this.map,
      enemy: this.enemy,
      player: this.player,
    });

    this.sfxManager = new GameSfxManager({
      gameState: this.gameState,
      engine: this.engine,
      player: this.player,
      map: this.map,
      enemy: this.enemy,
      world: this.world,
      playerHud: this.playerHud,
    });

    this.physics.add(this.player.bodies);
    this.physics.add(this.enemy.bodies);

    // Add all scene objects
    this.engine.scene.add(this.player.group);
    this.engine.scene.add(this.enemy.group);
    this.engine.scene.add(this.map.group);
    this.engine.scene.add(this.world.group);
    this.engine.cameraTarget = this.player.mesh.position;
  }

  start() {
    if (!this.started) {
      this.started = true;
      setTimeout(() => {
        CONFIG.EnableTools && this.addTools();
        CONFIG.EnableStats && this.addStats();
        this.moodManager.resetToDefault();
      }, 1000);
      MainLoop.start();
    }
  }

  addStats() {
    this.stats = new Stats();
    document.body.appendChild(this.stats.domElement);
  }

  addTools() {
    const tools = new GameTools();
    tools.addScreen('physics', this.physics);
    tools.addScreen('engine', this.engine);
    tools.addScreen('player', this.player);
    tools.addScreen('world', this.world);
    tools.addScreen('materials');
  }

  attachEvents() {
    MainLoop.setUpdate(this.onUpdate.bind(this));
    MainLoop.setDraw(this.onDraw.bind(this));
    MainLoop.setEnd(this.onEnd.bind(this));
    window.addEventListener('resize', this.updateSize.bind(this));
  }

  updateSize() {
    const { innerWidth: w, innerHeight: h } = window;
    this.engine.resize(w, h);
  }

  onUpdate(delta) {
    const { engine, gameInput, enemy, player, map,
      world, physics, playerHud, enemyHud } = this;
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
    const { stats, engine } = this;
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

window.game = new Game();
