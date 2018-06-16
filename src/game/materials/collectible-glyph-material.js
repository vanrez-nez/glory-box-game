import { IMAGE_ASSETS } from '../assets';
import GameMetaMaterial from './meta-material';
import { StaticInstance as Skybox } from '../skybox';

const XRepeat = 1 / 9;
const YRepeat = 1 / 9;
export default class CollectibleGlyphMaterial extends GameMetaMaterial {
  constructor(opts) {
    const { xOffset, yOffset, emissiveColor } = opts;
    super({
      nodeName: opts.name,
      low: {
        type: 'MeshLambertMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GameMetaMaterial.GetTexture(IMAGE_ASSETS.HullBase,
            XRepeat, YRepeat, xOffset, yOffset),
          color: 0x090c11,
          emissiveMap: GameMetaMaterial.GetTexture(IMAGE_ASSETS.GlyphsEmissive,
            XRepeat, YRepeat, xOffset, yOffset),
          emissiveIntensity: 6,
          emissive: emissiveColor,
          reflectivity: 0.5,
        },
      },
    });
  }
}
