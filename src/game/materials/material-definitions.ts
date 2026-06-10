import * as THREE from 'three/webgpu';
import { StaticInstance as Skybox } from '@/game/skybox';
import { IMAGE_ASSETS } from '@/game/assets';
import GameMetaMaterial from '@/game/materials/meta-material';
import EnemyRayShader from '@/shaders/enemy-ray';
import ShiningShader from '@/shaders/shining';
import FireballShader from '@/shaders/fireball';
import CheckpointRingFxShader from '@/shaders/checkpoint-ring';
import PickupBurstShader from '@/shaders/pickup-burst';
import NebulaShader from '@/shaders/nebula';

/*
  Material definitions registry.

  Every game material is a `GameMetaMaterial` configured with a per-quality
  profile (`low` / `medium` / `high`). These materials used to be ~19 one-method
  subclasses that did nothing but call `super({ ... })`; they are now plain
  builder functions keyed by name. The factory (`material-factory.ts`) looks up
  the builder, calls it with the call-site `opts`, and wraps the returned profile
  in a single `GameMetaMaterial` instance (tagging it with `materialType = key`
  for the dev tools / mood grouping).

  `GetTexture(...)` returns a deferred (lazy) texture loader — see
  `meta-material.ts`. Textures must only resolve after assets have loaded.
*/

const { GetTexture } = GameMetaMaterial;

// A TSL node-material profile: the shader module returns a ready node material
// (with its `uniforms` dict) — see GameMetaMaterial.createMaterial.
const shader = (mod: { create: () => any }) => (opts: any) => ({
  nodeName: opts.name,
  low: { create: () => mod.create() },
});

// Plain flat-colour MeshBasicMaterial (the most common low-quality profile).
const basicColor = (opts: any) => ({
  nodeName: opts.name,
  low: { type: 'MeshBasicMaterial', args: { color: opts.color } },
});

// Shared low(basic)+medium(standard) metal look used by the dragon head & armor.
const metalArmor = (opts: any) => ({
  nodeName: opts.name,
  low: {
    type: 'MeshBasicMaterial',
    args: { color: opts.color, vertexColors: true },
  },
  medium: {
    type: 'MeshStandardMaterial',
    args: {
      color: 0xffffff,
      flatShading: true,
      envMap: Skybox.textureCube,
      roughness: 0.5,
      metalness: 0.8,
      vertexColors: true,
    },
  },
});

export type MaterialDef = (opts: any) => Record<string, any>;

export const MATERIAL_DEFS: Record<string, MaterialDef> = {
  WorldCylinder: opts => ({
    nodeName: opts.name,
    low: {
      type: 'MeshBasicMaterial',
      args: {
        map: GetTexture(IMAGE_ASSETS.HullBase, opts.xScale, opts.yScale),
        color: 0x1c284d,
        reflectivity: 0.5,
        wireframe: false,
      },
    },
    medium: {
      type: 'MeshPhongMaterial',
      args: {
        envMap: Skybox.textureCube,
        map: GetTexture(IMAGE_ASSETS.HullBase, opts.xScale, opts.yScale),
        emissiveMap: GetTexture(IMAGE_ASSETS.HullEmissive, opts.xScale, opts.yScale),
        emissiveIntensity: 1.4,
        emissive: 0x00ffff,
        color: 0x1c284d,
        reflectivity: 0.5,
        shininess: 5,
        specular: 0xf174d,
      },
    },
    high: {
      type: 'MeshStandardMaterial',
      args: {
        envMap: Skybox.textureCube,
        map: GetTexture(IMAGE_ASSETS.HullBase, opts.xScale, opts.yScale),
        emissiveMap: GetTexture(IMAGE_ASSETS.HullEmissive, opts.xScale, opts.yScale),
        normalMap: GetTexture(IMAGE_ASSETS.HullNormal, opts.xScale, opts.yScale),
        color: 0x2C3D55,
        emissiveIntensity: 0.7,
        emissive: 0x00ffff,
        wireframe: false,
        metalness: 0.6,
        roughness: 0.6,
      },
    },
  }),

  WorldFloor: (opts) => {
    const { scale } = opts;
    return {
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: {
          color: 0x484b57,
          map: GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          wireframe: false,
        },
      },
      medium: {
        type: 'MeshPhongMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          color: 0x1c284d,
          reflectivity: 0.5,
          shininess: 5,
          specular: 0xf174d,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          color: 0x6082b6,
          envMap: Skybox.textureCube,
          map: GetTexture(IMAGE_ASSETS.GroundBase, scale, scale),
          normalMap: GetTexture(IMAGE_ASSETS.GroundNormal, scale, scale),
          roughnessMap: GetTexture(IMAGE_ASSETS.GroundRoughness, scale, scale),
          metalness: 0.69,
          roughness: 0.22,
          envMapIntensity: 0.18,
        },
      },
    };
  },

  WorldSkyCylinder: shader(NebulaShader),
  WorldFxCylinder: shader(PickupBurstShader),
  WorldCheckpointRing: shader(CheckpointRingFxShader),

  PlatformLight: basicColor,

  PlatformSteps: (opts) => {
    const width = opts.width * 0.15;
    return {
      nodeName: opts.name,
      low: {
        type: 'MeshBasicMaterial',
        args: { color: opts.color },
      },
      medium: {
        type: 'MeshLambertMaterial',
        args: {
          envMap: Skybox.textureCube,
          reflectivity: 0.35,
          color: opts.color,
        },
      },
      high: {
        type: 'MeshStandardMaterial',
        args: {
          map: GetTexture(IMAGE_ASSETS.GroundBase, width, 0.5),
          roughnessMap: GetTexture(IMAGE_ASSETS.GroundRoughness, width, 0.5),
          normalMap: GetTexture(IMAGE_ASSETS.GroundNormal, width, 0.5),
          envMap: Skybox.textureCube,
          envMapIntensity: 0.2,
          metalness: 0.5,
          roughness: 0.7,
          flatShading: true,
          color: 0xffffff,
        },
      },
    };
  },

  PlatformSocket: opts => ({
    nodeName: opts.name,
    low: {
      type: 'MeshBasicMaterial',
      args: { vertexColors: true },
    },
    medium: {
      type: 'MeshLambertMaterial',
      args: {
        wireframe: false,
        map: GetTexture(IMAGE_ASSETS.HullBase, 0.1, 0.1),
      },
    },
  }),

  CollectibleSocket: opts => ({
    nodeName: opts.name,
    low: {
      type: 'MeshBasicMaterial',
      args: { color: opts.color },
    },
    medium: {
      type: 'MeshLambertMaterial',
      args: {
        map: GetTexture(IMAGE_ASSETS.GroundBase, 1, 1),
        envMap: Skybox.textureCube,
        reflectivity: 0.35,
        color: opts.color,
      },
    },
  }),

  CollectibleGlyph: (opts) => {
    const { xOffset, yOffset, emissiveColor } = opts;
    const XRepeat = 1 / 9;
    const YRepeat = 1 / 9;
    return {
      nodeName: opts.name,
      low: {
        type: 'MeshLambertMaterial',
        args: {
          envMap: Skybox.textureCube,
          map: GetTexture(IMAGE_ASSETS.HullBase, XRepeat, YRepeat, xOffset, yOffset),
          color: 0x090c11,
          emissiveMap: GetTexture(IMAGE_ASSETS.GlyphsEmissive, XRepeat, YRepeat, xOffset, yOffset),
          emissiveIntensity: 6,
          emissive: emissiveColor,
          reflectivity: 0.5,
        },
      },
    };
  },

  CollectibleItem: basicColor,

  EnemyRay: shader(EnemyRayShader),
  EnemyHead: metalArmor,
  EnemyArmor: metalArmor,

  EnemyEyes: opts => ({
    nodeName: opts.name,
    low: {
      type: 'MeshBasicMaterial',
      args: { color: opts.color, vertexColors: true },
    },
  }),

  GenericColor: opts => ({
    nodeName: opts.name,
    low: {
      type: 'MeshBasicMaterial',
      args: {
        transparent: opts.transparent || false,
        opacity: opts.opacity || 1,
        color: opts.color,
        fog: false,
        depthWrite: opts.depthWrite || true,
        blending: opts.blending || THREE.NormalBlending,
      },
    },
  }),

  PlayerMaterial: basicColor,
  PlayerHitFx: shader(ShiningShader),
  PlayerHudFireball: shader(FireballShader),
};
