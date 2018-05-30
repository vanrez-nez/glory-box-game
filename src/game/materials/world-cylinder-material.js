import { IMAGE_ASSETS } from '../assets';
import { GetTextureRepeatDefer } from '../utils';
import { StaticInstance as Skybox } from '../skybox';
import GameMetaMaterial from './meta-material';

export default class WorldCylinderMaterial extends GameMetaMaterial {
  constructor(opts) {
    const { xScale, yScale } = opts;
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          map: GetTextureRepeatDefer(IMAGE_ASSETS.HullBase, xScale, yScale),
          color: 0x1c284d,
          reflectivity: 0.5,
          wireframe: false,
        },
      },
      medium: {
        type: 'MeshPhongMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GetTextureRepeatDefer(IMAGE_ASSETS.HullBase, xScale, yScale),
          emissiveMap: GetTextureRepeatDefer(IMAGE_ASSETS.HullEmissive, xScale, yScale),
          emissiveIntensity: 1.4,
          emissive: 0x00ffff,
          color: 0x1c284d,
          reflectivity: 0.5,
          shininess: 5,
          refraction: 0.8,
          specular: 0xf174d,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GetTextureRepeatDefer(IMAGE_ASSETS.HullBase, xScale, yScale),
          emissiveMap: GetTextureRepeatDefer(IMAGE_ASSETS.HullEmissive, xScale, yScale),
          normalMap: GetTextureRepeatDefer(IMAGE_ASSETS.HullNormal, xScale, yScale),
          color: 0x2C3D55,
          emissiveIntensity: 0.7,
          emissive: 0x00ffff,
          wireframe: false,
          metalness: 0.6,
          roughness: 0.6,
        },
      },
    });
  }
}
