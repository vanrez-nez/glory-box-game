import { StaticInstance as Skybox } from '@/game/skybox';
import { IMAGE_ASSETS } from '@/game/assets';
import GameMetaMaterial from '@/game/materials/meta-material';

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
