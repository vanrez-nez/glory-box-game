
import { MAP, DIRECTIONS, GAME } from './const';
import { IMAGE_ASSETS } from './assets';
import { GetTextureRepeat } from './utils';
import GameMapParser from './map-parser';
import GamePlatform from './platform';
import GameSkytube from './skytube';
import { StaticInstance as Skybox } from './skybox';
import MapGlyph from './map-glyph';

const MAP_OFFSET_Y = -10;

export default class GameMap {
  constructor() {
    this.group = new THREE.Object3D();
    this.mapParser = new GameMapParser('#game_map');
    this.platforms = [];
    this.bodies = [];
    this.glyphs = [];
    this.generatePlatform();
    this.addCylinder();
    this.addSkytube();
    this.addFloor();
  }

  generatePlatform() {
    const { mapParser: map } = this;
    for (let y = 0; y < map.height; y++) {
      let platformWidth = 0;

      for (let x = 0; x < map.width; x++) {
        const nextTile = map.getTileAt(x, y, DIRECTIONS.Right);
        const currTile = map.getTileAt(x, y);
        if (currTile === MAP.Empty) {
          platformWidth = 0;
        } else if (currTile === MAP.Glyph) {
          this.addGlyph(x, y);
        } else {
          if (currTile === MAP.StaticPlatform ||
            currTile === MAP.MovingPlatform) {
            platformWidth += 1;
          }
          if (nextTile !== currTile && platformWidth > 0) {
            this.addPlaform(x, y, platformWidth, currTile);
            platformWidth = 0;
          }
        }
      }
    }
  }

  addGlyph(x, y) {
    const { mapParser: map } = this;
    const xTrans = x - map.width / 2;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const glyph = new MapGlyph(xTrans, yTrans);
    this.group.add(glyph.group);
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
    const geo = new THREE.CylinderGeometry(GAME.CilynderRadius, GAME.CilynderRadius,
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

  addPlaform(x, y, width, type) {
    const { bodies, group, platforms, mapParser: map } = this;
    const xTrans = x - width / 2 - map.width / 2 + 1;
    const yTrans = map.height - y + MAP_OFFSET_Y;
    const platform = new GamePlatform({ x: xTrans, y: yTrans, width, type });
    bodies.push(platform.body);
    group.add(platform.mesh);
    group.add(platform.holderSocketMesh);
    platforms.push(platform);
  }

  update(delta, player) {
    const { platforms, glyphs } = this;
    this.skytube.update(delta);
    this.skytube.group.position.y = player.mesh.position.y;
    for (let i = 0; i < platforms.length; i++) {
      platforms[i].update(delta);
    }
    for (let i = 0; i < glyphs.length; i++) {
      glyphs[i].update(delta);
    }
  }
}
