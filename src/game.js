
/*
  TODO:
    - Feat: Player falling on sides should generate friction and be able to jump
    - Feat: Desintegration and reintegration of player
    - Feat: Player lobby with random freebies and initial impulse
    - Feat: Initial audio atmosphere for lobby and transition to full audio when player starts
    - Feat: Player rotation when walking and jumping
    - Feat: Game Menu with (start, audio, quality selector, logo and instructions)
    - Feat: Game HUD
    - Feat: Background geometry on center
    - Feat: Background geometry on sides
    - Feat: Leveling
    - Feat: Obstacles ()
    - Feat: Illumination and vignette effect
*/
import Stats from 'stats.js';
import MainLoop from 'mainloop.js';
import { CONFIG, GAME, EVENTS } from './game/const';
import Engine from './game/engine';
import GameState from './game/state';
import GameTools from './game/tools';
import GameInput from './game/input';
import GamePhysics from './game/physics/physics';
import GamePlayer from './game/player/player';
import GameWorld from './game/world';
import GameMap from './game/map';
import GameSfxManager from './game/sfx-manager';
import GameMoodManager from './game/mood-manager';
import GameEnemy from './game/enemy/enemy';
import GamePlayerHud from './game/player/player-hud';
import GameEnemyHud from './game/enemy/enemy-hud';
import { AudioManagerInstance as AudioManager } from './game/audio/audio-manager';

const DEFAULT = {
  canvasElement: null,
  mapElement: null,
};

export default class Game {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.started = false;
    this.init();
    this.updateSize();
    this.attachEvents();
    Promise.all([
      this.loadAssets(),
      this.loadMap(),
    ]).then(this.start.bind(this));
  }

  async loadAssets() {
    return new Promise((resolve) => {
      this.loader = THREE.DefaultLoadingManager;
      this.loader.onProgress = (url, itemsLoaded, itemsTotal) => {
        if (itemsLoaded === itemsTotal) {
          resolve();
        }
      };
    });
  }

  async loadMap() {
    const { map } = this;
    await map.load();
  }

  init() {
    const { opts } = this;
    THREE.Cache.enabled = true;
    this.gameInput = new GameInput();
    this.engine = new Engine({
      canvas: opts.canvasElement,
    });
    this.physics = new GamePhysics({
      bounds: new THREE.Box2(
        new THREE.Vector2(GAME.BoundsLeft, GAME.BoundsTop),
        new THREE.Vector2(GAME.BoundsRight, GAME.BoundsBottom),
      ),
    });
    this.player = new GamePlayer({
    });
    this.map = new GameMap({
      physics: this.physics,
      mapImageElement: opts.mapElement,
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
    this.player.mesh.add(AudioManager.listener);
    this.engine.cameraTarget = this.player.mesh.position;
  }

  pause() {
    if (this.started) {
      MainLoop.stop();
    }
  }

  resume() {
    MainLoop.start();
  }

  start() {
    if (!this.started) {
      this.started = true;
      CONFIG.EnableTools && this.addTools();
      CONFIG.EnableStats && this.addStats();
      this.moodManager.resetToDefault();
      MainLoop.start();
      this.restart();
    }
  }

  restart() {
    const {
      gameState, engine, map,
      enemy, player, sfxManager,
    } = this;
    gameState.restart();
    engine.resetCamera();
    map.restart();
    enemy.restart();
    player.restore();
    sfxManager.restart();
    AudioManager.playMix('game_theme');
  }

  onPlayerDeath() {
    this.sfxManager.destroyPlayer();
    AudioManager.stopMix('game_theme');
    AudioManager.playTrack('drama_end');
    setTimeout(() => {
      this.restart();
    }, 3000);
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
    const { gameState } = this;
    gameState.events.on(EVENTS.PlayerDeath, this.onPlayerDeath.bind(this));
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
    const {
      engine, gameInput, enemy, player, map,
      world, physics, playerHud, enemyHud,
    } = this;
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
