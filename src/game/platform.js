import { MaterialFactoryInstance as MaterialFactory } from '@/game/materials/material-factory';
import { PHYSICS, MAP, EVENTS, GAME } from '@/game/const';
import { CartesianToCylinder, SyncBodyPhysicsMesh } from '@/game/utils';
import { ArcGeometry } from '@/common/three-utils';
import GamePhysicsBody from '@/game/physics/physics-body';

const DEFAULT = {
  x: 0,
  y: 0,
  width: 1,
  type: MAP.StaticPlatform,
};

const CACHED_GEOMETRIES = {};

export default class GamePlatform {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.body = this.getBody();
    this.oscillator = Math.random();
    this.body.position.set(this.opts.x, this.opts.y);
    this.startPosition = this.body.position.clone();
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  setPosition(position) {
    this.body.position.copy(position);
  }

  static GetBoxGeomery(width, height, depth) {
    const hash = `box_${width},${height},${depth}`;
    if (!CACHED_GEOMETRIES[hash]) {
      CACHED_GEOMETRIES[hash] = new THREE.BoxGeometry(width, height, depth);
    }
    return CACHED_GEOMETRIES[hash];
  }

  static GetStepsGeometry(width) {
    const hash = `steps_${width}`;
    if (!CACHED_GEOMETRIES[hash]) {
      const geoTop = GamePlatform.GetBoxGeomery(width, 0.5, GAME.PlatformZSize);
      const geoBottom = GamePlatform.GetBoxGeomery(width * 0.8, 1, GAME.PlatformZSize * 0.8);
      geoBottom.translate(0, -0.5, 0);
      geoTop.merge(geoBottom);
      CACHED_GEOMETRIES[hash] = geoTop;
    }
    return CACHED_GEOMETRIES[hash];
  }

  getSocketArcGeometry(x, y, length, depth, height) {
    const geo = ArcGeometry(
      GAME.CylinderRadius - 0.5,
      GAME.CylinderRadius + 0.5,
      -length * 0.5,
      length,
      height,
    );
    geo.center();
    const pos = new THREE.Vector3();
    // depending on the arc length the box will have a different depth
    // so we translate the projection accordingly
    const depthOffset = -geo.boundingBox.max.x + depth;
    CartesianToCylinder(pos, x, y, depthOffset);
    const a = new THREE.Vector2(pos.z, pos.x);
    geo.rotateX(Math.PI / 2);
    geo.rotateY(-Math.PI / 2 + a.angle());
    geo.translate(pos.x, pos.y, pos.z);
    return geo;
  }

  getSocketGeometry() {
    const { opts } = this;
    const width = this.isMovingPlatform() ? opts.width * 3 : opts.width;
    const length = (Math.PI / 128) * width;
    const outerGeo = this.getSocketArcGeometry(opts.x, opts.y, length, 0.2, 1.2);
    return outerGeo;
  }

  getSocketLightsGeometry() {
    const { opts } = this;
    const width = this.isMovingPlatform() ? opts.width * 3 : opts.width;
    const length = (Math.PI / 128) * width;
    const innerGeo = this.getSocketArcGeometry(opts.x, opts.y, length - 0.02, 0.35, 0.1);
    return innerGeo;
  }

  isMovingPlatform() {
    return this.opts.type === MAP.MovingPlatform;
  }

  getMesh() {
    const { opts } = this;
    const g = new THREE.Group();
    const lightGeo = GamePlatform.GetBoxGeomery(opts.width, 0.7, GAME.PlatformZSize);
    const stepsGeo = GamePlatform.GetStepsGeometry(opts.width, 1, GAME.PlaformZSize);
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
    meshSteps.position.y = 0.2;
    meshSteps.castShadow = true;
    meshSteps.receiveShadow = true;
    meshLight.position.y = -0.2;
    meshLight.scale.set(0.95, 0.4, 0.95);
    meshSteps.matrixAutoUpdate = false;
    meshSteps.updateMatrix();
    meshLight.matrixAutoUpdate = false;
    meshLight.updateMatrix();
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
      onUpdate: SyncBodyPhysicsMesh.bind(this, mesh),
      scale: new THREE.Vector2(opts.width, 1),
      distance: GAME.PlatformOffset,
      collisionTargets: [PHYSICS.Player],
      syncLoockAt: false,
    });
  }

  onCollisionBegan(edges) {
    if (edges.top && edges.top.opts.type === PHYSICS.Player) {
      const tl = new TimelineMax();
      const pos = this.mesh.positionOffset;
      tl.to(pos, 0.12, { y: -0.7, ease: Power2.easeOut });
      tl.to(pos, 0.15, { y: 0, ease: Power2.easeOut });
    }
  }

  update(delta) {
    const { body, startPosition, opts } = this;
    if (this.isMovingPlatform()) {
      this.oscillator += delta;
      body.prevPosition.x = body.position.x;
      body.position.x = startPosition.x + Math.sin(this.oscillator) * opts.width;
    }
  }

  get visible() {
    return this.mesh.visible === true;
  }
}
