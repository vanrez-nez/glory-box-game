import HullEmissive from '@/assets/images/macro_hull_emissive.jpg';
import HullNormal from '@/assets/images/macro_hull_normal.jpg';
import HullBase from '@/assets/images/macro_hull_basecolor.jpg';
import HullRoughness from '@/assets/images/macro_hull_roughness.jpg';
import SkyboxPX from '@/assets/images/universe_cube_0_cubef_cubert.jpg';
import GroundBase from '@/assets/images/ground_basecolor.jpg';
import GroundNormal from '@/assets/images/ground_normal.jpg';
import GroundRoughness from '@/assets/images/ground_roughness.jpg';
import GlyphsEmissive from '@/assets/images/glyphs_emissive.jpg';
import PerlinNoise from '@/assets/images/noise.jpg';
import Dragon from '@/assets/models/dragon.glb';
import FxSprite from '@/assets/audio/sprite.wav';
import MainBackgroundWebm from '@/assets/audio/main_bg.webm';
import MainBackgroundMp3 from '@/assets/audio/main_bg.mp3';
import RingEmissive from '@/assets/images/ring_emissive.png';

export const IMAGE_ASSETS = {
  HullEmissive,
  HullNormal,
  HullBase,
  HullRoughness,
  GroundBase,
  GroundNormal,
  GroundRoughness,
  GlyphsEmissive,
  PerlinNoise,
  SkyboxPX,
  SkyboxNX: SkyboxPX,
  SkyboxPY: SkyboxPX,
  SkyboxNY: SkyboxPX,
  SkyboxPZ: SkyboxPX,
  SkyboxNZ: SkyboxPX,
  RingEmissive,
};

export const MODEL_ASSETS = {
  Dragon,
};

export const AUDIO_ASSETS = {
  MainBackgroundWebm,
  MainBackgroundMp3,
  FxSprite,
};
