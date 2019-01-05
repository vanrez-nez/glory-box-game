import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GameConfigInstance as GameConfig } from '@/game/config';
import Stats from 'stats.js';
import GameLoop from '@/game/loop';
import { GAME, EVENTS } from '@/game/const';
import Engine from '@/game/engine';
import GameLoader from '@/game/loader';
import GameState from '@/game/state';
import GameTools from '@/game/tools';
import GameInput from '@/game/input';
import GamePhysics from '@/game/physics/physics';
import GamePlayer from '@/game/player/player';
import GameWorld from '@/game/world';
import GameMap from '@/game/map';
import GameSfxManager from '@/game/sfx-manager';
import GameMoodManager from '@/game/mood-manager';
import GameEnemy from '@/game/enemy/enemy';
import GamePlayerHud from '@/game/player/player-hud';
import GameEnemyHud from '@/game/enemy/enemy-hud';

const DEFAULT = {
  canvasElement: null,
  mapElement: null,
  store: null,
  quality: null,
};

export default class Game {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.events = new EventEmitter3();
    this.started = false;
    this.init();
  }

  async init() {
    /*
      Initializes config based on selected quality,
      GameConfig is shared as a singleton through all the modules
    */
    GameConfig.set(this.opts.quality, false);
    this.initComponents();
    this.updateSize();
    this.attachEvents();
    await this.initLoad();
    this.addTools();
    this.addStats();
    this.initLoop();
    this.events.emit(EVENTS.GameReady);
  }

  initLoop() {
    const { components, stats } = this;
    this.loop = new GameLoop({
      stats,
      components,
    });
  }

  async initLoad() {
    const { map } = this.components;
    this.gameLoader = new GameLoader({ map });
    await this.gameLoader.load();
  }

  attachEvents() {
    const { gameState, gameInput } = this.components;
    gameInput.events.on(EVENTS.GamePause, this.pause.bind(this));
    gameState.events.on(EVENTS.GameResume, this.resume.bind(this));
    gameState.events.on(EVENTS.PlayerDeath, this.onPlayerDeath.bind(this));
    window.addEventListener('resize', this.updateSize.bind(this));
  }

  getPhysicsBounds() {
    return new THREE.Box2(
      new THREE.Vector2(GAME.BoundsLeft, GAME.BoundsTop),
      new THREE.Vector2(GAME.BoundsRight, GAME.BoundsBottom),
    );
  }

  initComponents() {
    const { store } = this.opts;
    const { opts } = this;
    const gameInput = new GameInput();
    const player = new GamePlayer({});
    const enemy = new GameEnemy({});
    const world = new GameWorld({});
    const physics = new GamePhysics({ bounds: this.getPhysicsBounds() });
    const engine = new Engine({ canvas: opts.canvasElement });
    const map = new GameMap({ physics, mapImageElement: opts.mapElement });
    const playerHud = new GamePlayerHud({ camera: engine.camera });
    const enemyHud = new GameEnemyHud({ camera: engine.camera });
    const moodManager = new GameMoodManager({ engine, map, world });
    const gameState = new GameState({ store, map, enemy });
    const sfxManager = new GameSfxManager({ playerHud, gameState,
      engine, player, world });

    physics.add(player.bodies);
    physics.add(enemy.bodies);

    // Add all scene objects
    engine.scene.add(player.group);
    engine.scene.add(enemy.group);
    engine.scene.add(map.group);
    engine.scene.add(world.group);
    player.mesh.add(AudioManager.listener);
    engine.cameraTarget = player.mesh.position;

    this.components = { moodManager, sfxManager,
      gameInput, engine, physics, player, map,
      playerHud, enemyHud, gameState, world,
      enemy,
    };
  }

  start() {
    this.restart();
    this.resume();
  }

  restart() {
    const {
      gameState,
      engine,
      map,
      enemy,
      player,
      sfxManager,
      moodManager,
    } = this.components;
    gameState.restart();
    engine.resetCamera();
    map.restart();
    enemy.restart();
    player.restore();
    sfxManager.restart();
    moodManager.resetToDefault();
    AudioManager.playMix('game_theme');
  }

  resume() {
    const { gameState } = this.components;
    gameState.paused = false;
    this.loop.resume();
  }

  pause() {
    const { gameState } = this.components;
    gameState.paused = true;
    this.loop.pause();
  }

  dispose() {
    const { components } = this;
    this.loop.unbind();
    MaterialFactory.clear();
    components.engine.dispose();
    debugger;
  }

  onPlayerDeath() {
    const { sfxManager } = this.components;
    sfxManager.destroyPlayer();
    AudioManager.stopMix('game_theme');
    AudioManager.playTrack('drama_end');
    setTimeout(() => {
      this.restart();
    }, 3000);
  }

  addStats() {
    if (GameConfig.EnableStats) {
      this.stats = new Stats();
      document.body.appendChild(this.stats.domElement);
    }
  }

  addTools() {
    const { physics, engine, player, world } = this.components;
    if (GameConfig.EnableTools) {
      const tools = new GameTools();
      tools.addScreen('physics', physics);
      tools.addScreen('engine', engine);
      tools.addScreen('player', player);
      tools.addScreen('world', world);
      tools.addScreen('materials');
    }
  }

  updateSize() {
    const { engine } = this.components;
    const { innerWidth: w, innerHeight: h } = window;
    engine.resize(w, h);
  }
}
