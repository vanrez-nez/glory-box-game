
import { PHYSICS, MAP, EVENTS, GAME } from './const';
import { IMAGE_ASSETS } from './assets';
import { TranslateTo3d, GetTextureRepeat } from './utils';
import GamePhysicsBody from './physics-body';
import { StaticInstance as Skybox } from './skybox';

const DEFAULT = {
  x: 0,
  y: 0,
  width: 1,
  type: MAP.StaticPlatform,
};

export const LightMatStatic = new THREE.MeshLambertMaterial({
  color: 0xff00ff,
  emissive: 0xffffff,
  emissiveIntensity: 1,
});

export const LightMatMoving = new THREE.MeshLambertMaterial({
  color: 0xff00ff,
  emissive: 0xffffff,
  emissiveIntensity: 1,
});

export const GenericMat = new THREE.MeshStandardMaterial({
  envMap: Skybox.textureCube,
  envMapIntensity: 0.2,
  metalness: 0.5,
  roughness: 0.7,
  flatShading: true,
  color: 0xffffff,
});

export const SocketMat = new THREE.MeshLambertMaterial({
  envMap: Skybox.textureCube,
  color: 0x05070a,
  emissiveIntensity: 0.5,
  emissive: 0x05070a,
  reflectivity: 0.35,
});

export default class GamePlatform {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.mesh = this.getMesh();
    this.mesh.positionCulled = true;
    this.holderSocketMesh = this.getHolderSocketMesh();
    this.holderSocketMesh.positionCulled = true;
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
    const g = new THREE.Object3D();
    const texBase = GetTextureRepeat(IMAGE_ASSETS.ImpFloorBase, opts.width * 0.15, 0.5);
    const texRough = GetTextureRepeat(IMAGE_ASSETS.ImpFloorRoughness, opts.width * 0.15, 0.5);
    const texNormal = GetTextureRepeat(IMAGE_ASSETS.ImpFloorNormal, opts.width * 0.15, 0.5);
    const matSolid = GenericMat;
    matSolid.map = texBase;
    matSolid.normalMap = texNormal;
    matSolid.roughnessMap = texRough;
    const matLight = this.isMovingPlatform() ? LightMatMoving : LightMatStatic;
    const geo = new THREE.BoxBufferGeometry(opts.width, 0.7, GAME.PlatformZSize);
    const meshUp = new THREE.Mesh(geo, matSolid);
    const meshMiddle = new THREE.Mesh(geo, matLight);
    const meshDown = new THREE.Mesh(geo, matSolid);
    meshUp.position.y = 0.4;
    meshUp.scale.set(1, 0.5, 1);
    meshUp.castShadow = true;
    meshMiddle.position.y = 0;
    meshMiddle.scale.set(0.95, 0.4, 0.95);
    meshDown.position.y = -0.2;
    meshDown.scale.set(0.8, 0.8, 0.7);
    this.lightMaterial = matLight;
    g.add(meshUp);
    g.add(meshMiddle);
    g.add(meshDown);
    return g;
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
    const mesh = s2.toMesh(SocketMat);
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

  get visible() {
    return this.mesh.visible === true;
  }
}
