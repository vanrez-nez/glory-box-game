import { loader, LoaderAssetError, type AssetSource, type ManifestEntry } from '../loader'

export class AudioLoader {
  static type = 'audio'

  async load(src: AssetSource, entry: ManifestEntry | null): Promise<HTMLAudioElement> {
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

    throw new AggregateError(errors, `All audio sources failed for entry ${entry?.id ?? '?'}`)
  }

  async #loadOne(src: string, entry: ManifestEntry | null): Promise<HTMLAudioElement> {
    let response: Response

    try {
      response = await fetch(src)
    } catch (event) {
      throw new LoaderAssetError(`Failed to load audio: ${src}`, {
        entry,
        event,
        phase: 'network-error',
        src,
      })
    }

    if (!response.ok) {
      throw new LoaderAssetError(`Failed to load audio: ${response.status} ${response.statusText}`, {
        entry,
        phase: 'network-error',
        src,
      })
    }

    const blob = await response.blob()
    const audio = new Audio(URL.createObjectURL(blob))

    audio.preload = 'auto'
    audio.dataset.src = src
    return audio
  }
}

loader.register(AudioLoader.type, AudioLoader)
