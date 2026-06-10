import { MAP } from '@/game/const';
import GameCollectible from '@/game/collectible';
import GameDragonDen from '@/game/props/dragon-den';
import { CylinderProp } from '@/game/props/cylinder-prop';

/*
  Registry of map-derived "point" props (one tile = one prop), keyed by MAP tile
  type. Adding a new point prop is one entry here + its class — the map pipeline
  (map.ts) creates whatever the registry returns, and the chunk machinery handles
  it generically via the CylinderProp contract.

  Platforms are NOT point props (they span a run of tiles with width
  accumulation) and stay on their own path in map.ts. Colour→type lives in
  map-colors.ts (shared with the parser worker); this maps type→factory.
*/
export interface PointPropDef {
  create(opts: any): CylinderProp;
}

export const POINT_PROPS: Record<number, PointPropDef> = {
  [MAP.Glyph]: { create: opts => new GameCollectible(opts) },
  [MAP.DragonDen]: { create: opts => new GameDragonDen(opts) },
};
