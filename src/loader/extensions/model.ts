import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { loader, LoaderAssetError, type AssetSource, type ManifestEntry } from '../loader'

export class ModelLoader {
  static type = 'model'

  async load(src: AssetSource, entry: ManifestEntry | null): Promise<GLTF> {
    const sources = Array.isArray(src) ? src : [src]
    const errors: Error[] = []

    for (const source of sources) {
      try {
        return await this.#loadOne(source, entry)
      } catch (error) {
        errors.push(error instanceof Error ? error : new Error(String(error)))
      }
    }

    if (errors.length === 1) {
      throw errors[0]
    }

    throw new AggregateError(errors, `All model sources failed for entry ${entry?.id ?? '?'}`)
  }

  #loadOne(src: string, entry: ManifestEntry | null): Promise<GLTF> {
    const dracoLoader = new DRACOLoader()
    const gltfLoader = new GLTFLoader()

    dracoLoader.setDecoderPath('/draco/')
    dracoLoader.setDecoderConfig({ type: 'wasm' })
    gltfLoader.setDRACOLoader(dracoLoader)

    return new Promise((resolve, reject) => {
      gltfLoader.load(
        src,
        (gltf) => {
          dracoLoader.dispose()
          resolve(gltf)
        },
        undefined,
        (event) => {
          dracoLoader.dispose()
          reject(new LoaderAssetError(`Failed to load model: ${src}`, {
            entry,
            event,
            phase: 'network-error',
            src,
          }))
        },
      )
    })
  }
}

loader.register(ModelLoader.type, ModelLoader)
