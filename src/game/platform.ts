import * as THREE from 'three/webgpu';
import gsap from 'gsap';
import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { GameConfigInstance as GameConfig } from '@/game/config';
import { PHYSICS, MAP, EVENTS, GAME } from '@/game/const';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { CartesianToCylinder, SyncArcPadMesh } from '@/game/utils';
import { ArcGeometry } from '@/common/three-utils';
import GamePhysicsBody from '@/game/physics/physics-body';

const DEFAULT = {
  x: 0,
  y: 0,
  width: 1,
  // Track = the SOCKET width (full cell slot), rendered the same for static and
  // moving. Decoupled from the visible/collision pad `width`. Default reproduces
  // the legacy behaviour: moving socket = 3×width, static socket = width.
  trackWidth: null as number | null,
  // Per-side padding (world units) inset between the socket edge and the fill/
  // movement region: the channel the pad/block lives in is trackWidth − 2·padding.
  padding: 0,
  type: MAP.StaticPlatform,
};

const CACHED_GEOMETRIES: Record<string, THREE.BufferGeometry> = {};

export default class GamePlatform {
  opts!: Record<string, any>;
  mesh!: any;
  body!: any;
  oscillator!: any;
  startPosition!: any;
  lightMaterial!: any;
  constructor(opts: any) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.body = this.getBody();
    this.oscillator = Math.random();
    this.body.position.set(this.opts.x, this.opts.y);
    // seed prev so the first physics-step carry delta is 0, not the full position
    this.body.prevPosition.copy(this.body.position);
    this.startPosition = this.body.position.clone();
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  setPosition(position: any) {
    this.body.position.copy(position);
  }

  static GetBoxGeomery(width: any, height: any, depth: any) {
    const hash = `box_${width},${height},${depth}`;
    if (!CACHED_GEOMETRIES[hash]) {
      CACHED_GEOMETRIES[hash] = new THREE.BoxGeometry(width, height, depth);
    }
    return CACHED_GEOMETRIES[hash];
  }

  static GetStepsGeometry(width: any) {
    const hash = `steps_${width}`;
    if (!CACHED_GEOMETRIES[hash]) {
      const geoTop = GamePlatform.GetBoxGeomery(width, 0.5, GAME.PlatformZSize).clone();
      const geoBottom = GamePlatform
        .GetBoxGeomery(width * 0.8, 1, GAME.PlatformZSize * 0.8).clone();
      geoBottom.translate(0, -0.5, 0);
      CACHED_GEOMETRIES[hash] = mergeGeometries([geoTop, geoBottom]);
    }
    return CACHED_GEOMETRIES[hash];
  }

  // Arc "slab" centred on the cylinder's Y axis at theta=0 (+Z), curving like the
  // socket: `width` map-x units become an angular sweep (width·ThetaPerUnit) at
  // radius [rIn,rOut] and `heightY` tall, Y-centred. The pad is moved by rotating
  // this around Y (SyncArcPadMesh), so map-x maps linearly to the visual angle —
  // the whole point of the arc fix. Cached by its params.
  static GetArcSlab(width: any, rIn: any, rOut: any, heightY: any) {
    const hash = `arc_${width}_${rIn}_${rOut}_${heightY}`;
    if (!CACHED_GEOMETRIES[hash]) {
      const ang = GameConfig.ThetaPerUnit * width;
      const geo = ArcGeometry(rIn, rOut, -ang / 2, ang, heightY);
      geo.rotateX(Math.PI / 2);
      geo.rotateY(-Math.PI / 2);     // ring centre → +Z (cylinder theta=0)
      geo.translate(0, heightY / 2, 0); // centre the Y extent on 0
      CACHED_GEOMETRIES[hash] = geo;
    }
    return CACHED_GEOMETRIES[hash];
  }

  getSocketArcGeometry(x: any, y: any, length: any, depth: any, height: any) {
    // Thin radial band (0.15) kept just IN FRONT of the wall. A ~1-unit-thick arc
    // here dipped its inner half behind the wall (radius CylinderRadius), so its
    // side walls crossed r=CylinderRadius and z-fought the wall hex faces — the
    // discontinuous seam, obvious in the head-on edit camera. The depthOffset below
    // anchors the OUTER face `depth` proud; with the band this thin the inner face
    // stays in front of the wall too, so nothing crosses the surface.
    const geo = ArcGeometry(
      GAME.CylinderRadius - 0.075,
      GAME.CylinderRadius + 0.075,
      -length * 0.5,
      length,
      height,
    );
    geo.center();
    const pos = new THREE.Vector3();
    // depending on the arc length the box will have a different depth
    // so we translate the projection accordingly
    const depthOffset = -geo.boundingBox!.max.x + depth;
    CartesianToCylinder(pos, x, y, depthOffset);
    const a = new THREE.Vector2(pos.z, pos.x);
    geo.rotateX(Math.PI / 2);
    geo.rotateY(-Math.PI / 2 + a.angle());
    geo.translate(pos.x, pos.y, pos.z);
    return geo;
  }

  // Track width = the SOCKET width = the full cell slot (meta.width cells). The
  // spawner passes it as opts.trackWidth, identical for static and moving so two
  // pads of the same slot count get the SAME track. (Legacy default kept for any
  // direct construction without a trackWidth.)
  getTrackWidth() {
    const { opts } = this;
    if (opts.trackWidth != null) { return opts.trackWidth; }
    return this.isMovingPlatform() ? opts.width * 3 : opts.width;
  }

  // Socket = the full, stationary track. The static pad fills it (minus padding);
  // the moving block slides WITHIN it, bounded so its edge stops `padding` short
  // of the track end — the same cap a static pad leaves.
  getSocketGeometry() {
    const { opts } = this;
    const length = GameConfig.ThetaPerUnit * this.getTrackWidth();
    const outerGeo = this.getSocketArcGeometry(opts.x, opts.y, length, 0.2, 1.2);
    return outerGeo;
  }

  getSocketLightsGeometry() {
    const { opts } = this;
    const length = GameConfig.ThetaPerUnit * this.getTrackWidth();
    const innerGeo = this.getSocketArcGeometry(opts.x, opts.y, length - 0.02, 0.35, 0.1);
    return innerGeo;
  }

  isMovingPlatform() {
    return this.opts.type === MAP.MovingPlatform;
  }

  getMesh() {
    const { opts } = this;
    const g = new THREE.Group();
    // Pad radial centre (it sits PlatformOffset proud of the wall). Steps = dark
    // body; light = coloured stripe on the OUTER face (toward the camera). Both
    // span the SAME angular width = opts.width·ThetaPerUnit, so the coloured edge
    // lands exactly on the slot bound (no more 0.95 cosmetic inset).
    const r = GAME.CylinderRadius + GAME.PlatformOffset;
    const stepsGeo = GamePlatform.GetArcSlab(opts.width, r - 1.2, r + 0.6, 0.8);
    const lightGeo = GamePlatform.GetArcSlab(opts.width, r + 0.6, r + 1.0, 0.7);
    const stepsMat = MaterialFactory.getMaterial('PlatformSteps', {
      name: 'plt_steps',
      width: opts.width,
      color: 0x0,
    }, opts.width);
    const cacheId = opts.type;
    const lightMat = MaterialFactory.getMaterial('PlatformLight', {
      name: this.isMovingPlatform() ? 'plt_dynamic' : 'plt_static',
      color: this.isMovingPlatform() ? 0xff0000 : 0x00ff00,
    }, cacheId);
    const meshSteps = new THREE.Mesh(stepsGeo, stepsMat);
    const meshLight = new THREE.Mesh(lightGeo, lightMat);
    meshSteps.castShadow = true;
    meshSteps.receiveShadow = true;
    this.lightMaterial = meshLight.material;
    g.add(meshSteps);
    g.add(meshLight);
    return g;
  }

  getBody() {
    const { mesh, opts } = this;
    /*
      Translate map type to physics type (not all map entities
      can be translated to physical types)
    */
    const physicsType = this.isMovingPlatform() ?
      PHYSICS.MovingPlatform : PHYSICS.StaticPlatform;
    mesh.positionOffset = new THREE.Vector2();
    return new GamePhysicsBody({
      type: physicsType,
      mass: 0.01,
      friction: 0.05,
      isStatic: true,
      // Arc pad: the mesh is centred on the cylinder axis and moved by rotating
      // around Y (SyncArcPadMesh), so it curves with the wall and a shifted moving
      // pad keeps its edges at the right map-x angle. Physics stays in map-x.
      onUpdate: SyncArcPadMesh.bind(this, mesh),
      // The body authors scale.x in WORLD units (it divides by worldPerUnit =
      // CylinderRadius·ThetaPerUnit to get the map-x footprint). The arc mesh spans
      // opts.width in MAP-X, so convert: world = opts.width · worldPerUnit. After the
      // body's divide, the collision footprint is exactly opts.width map-x — matching
      // the visible pad — plus a small world forgiveness threshold past each edge.
      scale: new THREE.Vector2(
        opts.width * (GAME.CylinderRadius * GameConfig.ThetaPerUnit)
          + GameConfig.PlatformContactThreshold,
        1,
      ),
      distance: GAME.PlatformOffset,
      collisionTargets: [PHYSICS.Player],
    });
  }

  onCollisionBegan(edges: any) {
    if (edges.top && edges.top.opts.type === PHYSICS.Player) {
      const tl = gsap.timeline();
      const pos = this.mesh.positionOffset;
      tl.to(pos, { duration: 0.12, y: -0.7, ease: 'power2.out' });
      tl.to(pos, { duration: 0.15, y: 0, ease: 'power2.out' });
    }
  }

  // Runs per-draw with the (smooth) render delta so the platform moves smoothly
  // at the display refresh. The physics step snapshots prevPosition so the
  // player-carry measures the platform's displacement since the last step.
  update(delta: any) {
    const { body, startPosition, opts } = this;
    if (this.isMovingPlatform()) {
      this.oscillator += delta;
      // Travel = half the slack between the pad and its channel, so at each extreme
      // the pad edge stops exactly `padding` from the track end (same as a static pad).
      const channel = this.getTrackWidth() - 2 * opts.padding;
      const amplitude = (channel - opts.width) / 2;
      body.position.x = startPosition.x + Math.sin(this.oscillator) * amplitude;
    }
  }

  get visible() {
    return this.mesh.visible === true;
  }
}
