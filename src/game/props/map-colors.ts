import { MAP } from '@/game/const';

/*
  Single source of truth for map-image colour → MAP tile type. Kept in its own
  module (only depends on the MAP enum) so the parser worker can import the plain
  serializable table without pulling in prop classes / materials. The prop
  registry (prop-registry.ts) reuses these same types to look up factories.
*/
export const MAP_COLORS: Record<string, number> = {
  '255,0,0': MAP.StaticPlatform,
  '0,0,255': MAP.MovingPlatform,
  '0,255,0': MAP.Glyph,
  '255,255,0': MAP.DragonDen,
};
