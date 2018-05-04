
import { MAP, DIRECTIONS, GAME } from './const';
import { IMAGE_ASSETS } from './assets';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameSkybox from './skybox';
import GameSkytube from './skytube';

const MAP_OFFSET_Y = -10;

export default class GameMap {
  constructor() {
    this.group = new THREE.Object3D();
    this.mapParser = new GameMapParser('#game_map');
    this.platforms = [];
    this.bodies = [];
    this.generatePlatformBodies();
    this.addSkybox();
    this.addCylinder();
    this.addSkytube();
    this.addFloor();
  }

  generatePlatformBodies() {
    const { mapParser: map } = this;
    for (let y = 0; y < map.height; y++) {
      let platformWidth = 0;

      for (let x = 0; x < map.width; x++) {
        const nextTile = map.getTileAt(x, y, DIRECTIONS.Right);
        const currTile = map.getTileAt(x, y);
        if (currTile === MAP.Empty) {
          platformWidth = 0;
        } else {
          if (currTile === MAP.StaticPlatform ||
            currTile === MAP.MovingPlatform) {
            platformWidth += 1;
          }

          if (nextTile !== currTile && platformWidth > 0) {
            this.addPlaform(
              x - platformWidth / 2 - map.width / 2 + 1,
              map.height - y + MAP_OFFSET_Y,
              platformWidth,
              currTile,
            );
            platformWidth = 0;
          }
        }
      }
    }
  }

  addSkytube() {
    this.skytube = new GameSkytube();
    this.group.add(this.skytube.mesh);
  }

  addSkybox() {
    const height = 550;
    this.skybox = new GameSkybox();
    this.group.add(this.skybox.mesh);
    // const emissiveTex = new THREE.TextureLoader().load('https://s3-us-west-2.amazonaws.com/s.cdpn.io/204379/macro_hull_emissive.jpg');
    const tex = new THREE.TextureLoader().load(IMAGE_ASSETS.UniverseAmbient);
    const geo = new THREE.CylinderGeometry(100, 100, height, 16, 1, true);
    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      // emissiveMap: emissiveTex,
      //emissive: 0xff00ff,
      //emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.6,
      side: THREE.BackSide,
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.skyCylinder = mesh;
     this.group.add(mesh);
  }

  addFloor() {
    const geo = new THREE.CircleGeometry(100, 10);
    const mat = new THREE.MeshStandardMaterial({
      envMap: this.skybox.textureCube,
      color: 0x313E50,
      metalness: 0.4,
      roughness: 1,
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.y = GAME.BoundsBottom;
    this.group.add(mesh);
  }

  getTexture(url) {
    const tex = new THREE.TextureLoader().load(url);
    tex.wrapS = THREE.MirroredRepeatWrapping;
    tex.wrapT = THREE.MirroredRepeatWrapping;
    tex.repeat.set(8, 16);
    return tex;
  }

  addCylinder() {
    const height = 550;
    const texBase = this.getTexture(IMAGE_ASSETS.HullBase);
    const texEmissive = this.getTexture(IMAGE_ASSETS.HullEmmisive);
    const texNormal = this.getTexture(IMAGE_ASSETS.HullNormal);
    const texRough = this.getTexture(IMAGE_ASSETS.HullRoughness);
    const texHeight = this.getTexture(IMAGE_ASSETS.HullHeight);
    const geo = new THREE.CylinderGeometry(GAME.CilynderRadius, GAME.CilynderRadius,
      height, 64, 1, true);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2C3D55,
      envMap: this.skybox.textureCube,
      map: texBase,
      emissiveMap: texEmissive,
      normalMap: texNormal,
      normalScale: new THREE.Vector2(0.2, 0.2),
      displacementMap: texHeight,
      displacementScale: 0.2,
      roughnessMap: texRough,
      emissiveIntensity: 1,
      emissive: 0x00ffff,
      wireframe: false,
      metalness: 0,
      roughness: 1,
    });
    this.cylinder = new THREE.Mesh(geo, mat);
    this.cylinder.receiveShadow = true;
    this.cylinder.position.y = height * 0.4;
    this.cylinder.rotation.y = Math.PI / 2;
    this.group.add(this.cylinder);
  }

  addPlaform(x, y, width, type) {
    const { bodies, group, platforms } = this;
    const platform = new GamePlatform({ x, y, width, type });
    bodies.push(platform.body);
    group.add(platform.mesh);
    group.add(platform.holderSocketMesh);
    platforms.push(platform);
  }

  update(delta) {
    const { platforms } = this;
    this.skytube.update(delta);
    this.skyCylinder.rotation.y += delta * 0.06;
    for (let i = 0; i < platforms.length; i++) {
      const platform = platforms[i];
      platform.update(delta);
    }
  }
}
