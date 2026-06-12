import loader from '@/loader';
import { AudioManagerInstance as AudioManager } from '@/game/audio/audio-manager';
import levelData from '@/game/level/level.json';

export default class GameLoader {
  // Eager-load the asset manifest (images + model) and decode audio buffers.
  // Must run BEFORE materials build (they read loaded images synchronously).
  async loadAssets() {
    const res = await fetch('/manifest.json');
    const manifest = await res.json();
    await loader.load(manifest);
    // Audio is loaded by AudioManager (its THREE.AudioLoader decodes into the
    // listener's AudioContext); it resolves URLs from the now-loaded manifest.
    await AudioManager.load();
  }

  // The level map loads independently (it needs the map component, built later).
  // Includes the CPU-heavy geometry construction (buildAllMasters) so this only
  // resolves once the map is fully built — the caller emits GameReady after,
  // keeping the load overlay up through geometry construction, not just decode.
  async loadMap(map: any) {
    await map.load();
    if (map.initialized) {
      await map.buildAllMasters();
    }
    // Spawn the committed level (production renders this; in dev the editor
    // overrides it from localStorage on attach).
    map.loadLevel((levelData as any).records || {});
  }
}
