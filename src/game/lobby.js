import { StaticInstance as Skybox } from '@/game/skybox';
import { GAME } from '@/game/const';
import { IMAGE_ASSETS } from '@/game/assets';
import { CartesianToCylinder, GetTextureRepeat } from '@/game/utils';

const GlyphsOffsetX = -21.3;
const GlyphsOffsetY = -1;

const Glyphs = [
  { id: '#svg-glyph-g', color: 0x7633ff, x: 0 },
  { id: '#svg-glyph-l', color: 0xa133ff, x: 4 },
  { id: '#svg-glyph-o', color: 0x2fe9ff, x: 6 },
  { id: '#svg-glyph-r', color: 0xff33b5, x: 10 },
  { id: '#svg-glyph-y', color: 0x2fffc7, x: 14 },
  { id: '#svg-glyph-b', color: 0x0030ff, x: 24 },
  { id: '#svg-glyph-o', color: 0xff4f4f, x: 28 },
  { id: '#svg-glyph-x', color: 0x00f0ff, x: 32 },
];

export default class GameLobby {
  constructor() {
    this.group = new THREE.Object3D();
    this.addLogoMesh();
    this.addGlobalLight();
  }

  addLogoMesh() {
    const extrudeSettings = {
      depth: 0.4,
      bevelEnabled: false,
    };
    const loader = new THREE.SVGLoader();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x2C3D55,
      // emissive: 0x00deff,
      // emissiveIntensity: 0.025,
      map: GetTextureRepeat(IMAGE_ASSETS.HullBase, 1 / 150, 1 / 150),
      normalMap: GetTextureRepeat(IMAGE_ASSETS.HullNormal, 1 / 150, 1 / 150),
      envMap: Skybox.textureCube,
      metalness: 0.7,
      roughness: 0.4,
    });
    Glyphs.forEach((glyph) => {
      const content = document.querySelector(glyph.id).outerHTML;
      const paths = loader.parse(content);
      paths.forEach((path) => {
        const shapes = path.toShapes(true);
        shapes.forEach((shape) => {
          const geo = new THREE.ExtrudeBufferGeometry(shape, extrudeSettings);
          const mesh = new THREE.Mesh(geo, mat);
          mesh.scale.set(-0.1, -0.1, 1);
          CartesianToCylinder(mesh.position, glyph.x + GlyphsOffsetX, GlyphsOffsetY,
            GAME.PlatformOffset - 1);
          mesh.lookAt(0, mesh.position.y, 0);
          mesh.positionCulled = true;
          mesh.castShadow = true;
          mesh.geometry.computeVertexNormals();
          const light = new THREE.PointLight(glyph.color, 24, 8);
          light.position.copy(mesh.position);
          light.position.y -= 5;
          light.position.z *= 0.94;
          this.group.add(light);
          this.group.add(mesh);
        });
      });
    });
  }

  addGlobalLight() {
    const rectLight = new THREE.RectAreaLight(0x00eaff, 8, 20, 10);
    CartesianToCylinder(rectLight.position, 0, 2, GAME.CylinderRadius - 10);
    // this.group.add(rectLight);
    // const rectLightHelper = new THREE.RectAreaLightHelper( rectLight );
    // this.group.add(rectLightHelper);
  }

  update() {}
}
