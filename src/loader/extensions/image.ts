import { loader, LoaderAssetError, type AssetSource, type ManifestEntry } from '../loader'

export class ImageLoader {
  static type = 'image'

  async load(src: AssetSource, entry: ManifestEntry | null): Promise<HTMLImageElement> {
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

    throw new AggregateError(errors, `All image sources failed for entry ${entry?.id ?? '?'}`)
  }

  #loadOne(src: string, entry: ManifestEntry | null): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const image = new Image()

      image.onload = () => {
        resolve(image)
      }
      image.onerror = (event) => {
        reject(new LoaderAssetError(`Failed to load image: ${src}`, {
          entry,
          event,
          phase: 'network-error',
          src,
        }))
      }
      image.onabort = () => {
        reject(new LoaderAssetError(`Aborted loading image: ${src}`, {
          entry,
          phase: 'network-error',
          src,
        }))
      }
      image.src = src
    })
  }
}

loader.register(ImageLoader.type, ImageLoader)
