
import { PHYSICS, MAP, EVENTS, GAME } from './const';
import GamePhysicsBody from './physics-body';
import GameSkybox from './skybox';
import { TranslateTo3d } from './utils';

const DEFAULT = {
  x: 0,
  y: 0,
  width: 1,
  type: MAP.StaticPlatform,
};

const SKYBOX = new GameSkybox();

export default class GamePlatform {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.holderSocketMesh = this.getHolderSocketMesh();
    // this.tubesMesh = this.getTubesMesh();
    this.body = this.getBody();
    this.oscillator = Math.random();
    this.body.position.set(this.opts.x, this.opts.y);
    this.startPosition = this.body.position.clone();
    this.body.events.on(EVENTS.CollisionBegan, this.onCollisionBegan.bind(this));
  }

  isMovingPlatform() {
    return this.opts.type === MAP.MovingPlatform;
  }

  getMesh() {
    const { opts } = this;
    const geo = new THREE.BoxBufferGeometry(opts.width, 1, GAME.PlatformZSize);
    const mat = new THREE.MeshStandardMaterial({
      color: opts.type === MAP.StaticPlatform ? 0x313E50 : 0x00ff00,
      transparent: true,
      envMap: SKYBOX.textureCube,
      metalness: 0.4,
      roughness: 0.5,
      flatShading: true,
      emissive: 0xff00ff,
      emissiveIntensity: 0,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    // mesh.receiveShadow = true;
    return mesh;
  }

  getBspCylinder() {
    const { opts } = this;
    const r = GAME.CilynderRadius + 0.5;
    const geo = new THREE.CylinderGeometry(r, r, 10, 64, 1);
    const mesh = new THREE.Mesh(geo);
    mesh.position.y = opts.y;
    return new ThreeBSP(mesh);
  }

  getBspProjectedBox(width, height, depth, dist) {
    const { opts } = this;
    const geo = new THREE.BoxGeometry(width, height, depth);
    const mesh = new THREE.Mesh(geo);
    TranslateTo3d(mesh.position, opts.x, opts.y, GAME.PlatformDistance);
    mesh.position.x *= dist;
    mesh.position.z *= dist;
    mesh.lookAt(0, opts.y, 0);
    return new ThreeBSP(mesh);
  }

  getHolderSocketMesh() {
    const { opts } = this;
    const BspCylinder = this.getBspCylinder();
    const w = this.isMovingPlatform() ? opts.width * 3 : opts.width;
    const BspProjectedBox = this.getBspProjectedBox(
      w, 1.4, 5, 0.98, 0, 0);
    const innerW = w * 0.8;
    const BspInnerProjectedBox = this.getBspProjectedBox(innerW, 0.7, 7, 0.985, 0, 0);
    const s1 = BspProjectedBox.intersect(BspCylinder);
    const s2 = s1.subtract(BspInnerProjectedBox);
    const mesh = s2.toMesh(new THREE.MeshLambertMaterial({
      color: 0x272932,
      flatShading: true,
      wireframe: false,
    }));
    mesh.geometry.computeVertexNormals();
    return mesh;
  }

  getBody() {
    const { mesh, opts } = this;
    /*
      Translate map type to physics type (not all map entities
      can be translated to physical types)
    */
    const physicsType = this.isMovingPlatform() ?
      PHYSICS.MovingPlatform : PHYSICS.StaticPlatform;
    return new GamePhysicsBody({
      type: physicsType,
      mesh,
      mass: 0.01,
      friction: 0.05,
      isStatic: true,
      scale: new THREE.Vector2(opts.width, 1),
      distance: GAME.PlatformDistance,
    });
  }

  onCollisionBegan(edges) {
    if (edges.top && edges.top.opts.type === PHYSICS.Player) {
      const tl = new TimelineMax();
      const pos = this.body.meshPositionOffset;
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
}
