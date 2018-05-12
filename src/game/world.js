import { GAME } from './const';
import { IMAGE_ASSETS } from './assets';
import { GetTextureRepeat } from './utils';
import GameSkytube from './skytube';
import GameLobby from './lobby';
import { StaticInstance as Skybox } from './skybox';

export default class GameWorld {
  constructor() {
    this.group = new THREE.Group();
    this.addFloor();
    this.addLobby();
    this.addCylinder();
    this.addCylinderBase();
    this.addSkytube();
  }

  addLobby() {
    this.lobby = new GameLobby();
    this.group.add(this.lobby.group);
  }

  addSkytube() {
    this.skytube = new GameSkytube();
    this.group.add(this.skytube.group);
  }

  addFloor() {
    const texBase = GetTextureRepeat(IMAGE_ASSETS.ImpFloorBase, 40, 40);
    const texNormal = GetTextureRepeat(IMAGE_ASSETS.ImpFloorNormal, 40, 40);
    const texRough = GetTextureRepeat(IMAGE_ASSETS.ImpFloorRoughness, 40, 40);
    const geo = new THREE.CircleGeometry(80, 30);
    const mat = new THREE.MeshStandardMaterial({
      envMap: Skybox.textureCube,
      envMapIntensity: 0.1,
      map: texBase,
      normalMap: texNormal,
      roughnessMap: texRough,
      color: 0xffffff,
      metalness: 0,
      roughness: 0.5,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.floor = mesh;
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = GAME.BoundsBottom;
    mesh.positionCulled = true;
    this.group.add(mesh);
  }

  addCylinder() {
    const height = 550;
    const ratio = height / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const texBase = GetTextureRepeat(IMAGE_ASSETS.HullBase, xScale, yScale);
    const texEmissive = GetTextureRepeat(IMAGE_ASSETS.HullEmissive, xScale, yScale);
    const texNormal = GetTextureRepeat(IMAGE_ASSETS.HullNormal, xScale, yScale);
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius, GAME.CilynderRadius,
      height, 64, 1, true);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2C3D55,
      envMap: Skybox.textureCube,
      map: texBase,
      emissiveMap: texEmissive,
      normalMap: texNormal,
      emissiveIntensity: 0.7,
      emissive: 0x00ffff,
      wireframe: false,
      metalness: 0.6,
      roughness: 0.6,
    });
    this.cylinder = new THREE.Mesh(geo, mat);
    this.cylinder.receiveShadow = true;
    this.cylinder.position.y = height * 0.4;
    this.cylinder.rotation.y = Math.PI / 8;
    this.group.add(this.cylinder);
  }

  addCylinderBase() {
    const height = 2.5;
    const ratio = height / (GAME.CilynderRadius * Math.PI * 2);
    const xScale = 7;
    const yScale = 7 * ratio;
    const geo = new THREE.CylinderBufferGeometry(GAME.CilynderRadius + 0.5,
      GAME.CilynderRadius + 1.8, height, 64, 1);
    const texBase = GetTextureRepeat(IMAGE_ASSETS.HullBase, xScale, yScale);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2C3D55,
      envMap: Skybox.textureCube,
      map: texBase,
      metalness: 0.8,
      roughness: 0.6,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.y = GAME.BoundsBottom + height / 2;
    this.group.add(mesh);
  }

  update(delta, playerPosition) {
    this.skytube.update(delta);
    this.skytube.group.position.y = playerPosition.y;
  }
}