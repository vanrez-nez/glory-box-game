import EventEmitter3 from 'eventemitter3';
import * as THREE from 'three/webgpu';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import { GameConfigInstance as GameConfig } from '@/game/config';
import GameLoop from '@/game/loop';
import { GAME, EVENTS } from '@/game/const';
import Engine from '@/game/engine';
import GameLoader from '@/game/loader';
import GameState from '@/game/state';
import GameTools from '@/game/tools';
import GameInput from '@/game/input';
import GamePhysics from '@/game/physics/physics';
import GamePlayer from '@/game/player/player';
import GameWorld from '@/game/world/world';
import GameMap from '@/game/map';
import GameSfxManager from '@/game/sfx-manager';
import GameMoodManager from '@/game/mood-manager';
import GameEnemy from '@/game/enemy/enemy';
import { StaticInstance as Skybox } from '@/game/skybox';
import GamePlayerHud from '@/game/player/player-hud';
import GameEnemyHud from '@/game/enemy/enemy-hud';

export interface GameOptions {
  canvasElement: HTMLCanvasElement | null;
  mapElement: HTMLImageElement | null;
  store: any;
  quality: string | null;
}

export interface GameComponents {
  moodManager: GameMoodManager;
  sfxManager: GameSfxManager;
  gameInput: GameInput;
  engine: Engine;
  physics: GamePhysics;
  player: GamePlayer;
  map: GameMap;
  playerHud: GamePlayerHud;
  enemyHud: GameEnemyHud;
  gameState: GameState;
  world: GameWorld;
  enemy: GameEnemy;
}

const DEFAULT: GameOptions = {
  canvasElement: null,
  mapElement: null,
  store: null,
  quality: null,
};

export default class Game {
  opts: GameOptions;
  events: EventEmitter3;
  started: boolean;
  components!: GameComponents;
  loop!: GameLoop;
  gameLoader!: GameLoader;
  tools?: GameTools;

  constructor(opts: Partial<GameOptions> = {}) {
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
    GameConfig.set(this.opts.quality, true);
    // Load all assets (manifest images/model + audio buffers) BEFORE building
    // components — materials read their textures synchronously from the loader.
    this.gameLoader = new GameLoader();
    await this.gameLoader.loadAssets();
    this.initComponents();
    // WebGPURenderer must finish async backend init before the first render;
    // the loop is only started later (start()), but await here so resize and
    // any pre-loop setup run against a ready renderer.
    await this.components.engine.init();
    // The live skybox backdrop needs the initialized WebGPU renderer. Add it and
    // let the engine recentre it on the camera each frame. (Material reflections
    // use the cube-image env captured at build time — see skybox.ts.)
    const { engine } = this.components;
    const skyboxMesh = Skybox.createMesh(engine.renderer) as unknown as THREE.Object3D;
    engine.scene.add(skyboxMesh);
    // The renderer runs with sortObjects=false, so renderOrder is ignored and draw
    // order follows scene-children order. The skybox (depthTest off) must draw
    // first or it paints over the world — move it to the front of the children.
    const children = engine.scene.children;
    children.splice(children.indexOf(skyboxMesh), 1);
    children.unshift(skyboxMesh);
    engine.skybox = skyboxMesh;
    this.updateSize();
    this.attachEvents();
    await this.gameLoader.loadMap(this.components.map);
    this.addDevTools();
    this.initLoop();
    this.events.emit(EVENTS.GameReady);
  }

  initLoop() {
    const { components, tools } = this;
    this.loop = new GameLoop({
      fpsGraph: tools?.fpsGraph,
      components,
    });
  }

  attachEvents() {
    const { gameState, gameInput } = this.components;
    gameInput.events.on(EVENTS.GamePause, this.pause.bind(this));
    gameState.events.on(EVENTS.GameResume, this.resume.bind(this));
    gameState.events.on(EVENTS.PlayerDeath, this.onPlayerDeath.bind(this));
    window.addEventListener('resize', this.updateSize.bind(this));
    window.addEventListener('keydown', this.onEditModeKey.bind(this));
  }

  // Cmd/Ctrl+E toggles edit mode (developer mode's free camera + frozen world).
  onEditModeKey(e: KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      const on = !GameConfig.StaticDesign;
      GameConfig.setStaticDesign(on);
      this.components.engine.setEditMode(on);
    }
  }

  getPhysicsBounds() {
    // Full-circle: x spans one map width and wraps (no left/right walls). Legacy
    // 180-degree mode keeps the fixed BoundsLeft/Right walls.
    const halfW = GameConfig.MapWidth / 2;
    const left = GameConfig.WrapAround ? -halfW : GAME.BoundsLeft;
    const right = GameConfig.WrapAround ? halfW : GAME.BoundsRight;
    return new THREE.Box2(
      new THREE.Vector2(left, GAME.BoundsTop),
      new THREE.Vector2(right, GAME.BoundsBottom),
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
    const playerHud = new GamePlayerHud({ camera: engine.camera, scene: engine.scene });
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
    components.gameState.dispose();
    MaterialFactory.clear();
    components.engine.dispose();
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

  addDevTools() {
    if (!GameConfig.EnableTools && !GameConfig.EnableStats) {
      return;
    }
    const { physics, engine, player, world } = this.components;
    this.tools = new GameTools();
    if (GameConfig.EnableStats) {
      this.tools.addFpsGraph();
    }
    if (GameConfig.EnableTools) {
      this.tools.addScreen('physics', physics);
      this.tools.addScreen('engine', engine);
      this.tools.addScreen('player', player);
      this.tools.addScreen('world', world);
      this.tools.addScreen('materials');
      this.tools.persist(GameConfig.qualityNode);
    }
  }

  updateSize() {
    const { engine } = this.components;
    const { innerWidth: w, innerHeight: h } = window;
    engine.resize(w, h);
  }
}
