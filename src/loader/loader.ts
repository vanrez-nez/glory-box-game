import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

export type AssetType = 'audio' | 'image' | 'model'
export type AssetSource = string | readonly string[]

export type ManifestEntry<TType extends string = string> = {
  id: string
  lazy?: boolean
  src: AssetSource
  type: TType
}

export type ManifestInput =
  | ManifestEntry
  | readonly ManifestEntry[]
  | {
    assets: readonly ManifestEntry[]
  }

export type LoaderCallback<T> = (error: Error | null, data?: T) => void

export type BatchStats = {
  failed: number
  loaded: number
  pending: number
  total: number
}

export type LifetimeStats = {
  failed: number
  loaded: number
}

export type LoaderEventData<T = unknown> = BatchStats & {
  data?: T
  entry?: ManifestEntry | null
  error?: Error
  lifetime?: LifetimeStats
}

export type LoaderEvent = 'complete' | 'error' | 'progress' | 'start'
export type LoaderListener<T = unknown> = (data: LoaderEventData<T>) => void

export type LoaderExtension<T = unknown> = {
  load: (src: AssetSource, entry: ManifestEntry | null) => Promise<T> | T
}

export type LoaderExtensionConstructor<T = unknown> = {
  install?: (loaderInstance: Loader) => void
  new (loaderInstance: Loader): LoaderExtension<T>
}

type InFlightRecord<T = unknown> = {
  entry: ManifestEntry | null
  promise: Promise<T>
  src: AssetSource
  stale?: boolean
}

type ManifestResponse = {
  assets?: unknown
}

const DEFAULT_MANIFEST_URL = '/manifest.json'

export class LoaderAssetError extends Error {
  entry: ManifestEntry | null
  event?: unknown
  id?: string
  phase: string
  src?: AssetSource

  constructor(message: string, options: {
    entry?: ManifestEntry | null
    event?: unknown
    id?: string
    phase: string
    src?: AssetSource
  }) {
    super(message)
    this.name = 'LoaderAssetError'
    this.entry = options.entry ?? null
    this.event = options.event
    this.id = options.id
    this.phase = options.phase
    this.src = options.src
  }
}

export class Loader {
  #batchStats: BatchStats = { total: 0, loaded: 0, failed: 0, pending: 0 }
  #cache = new Map<string, unknown>()
  #extensions = new Map<string, LoaderExtensionConstructor>()
  #inFlight = new Map<string, InFlightRecord>()
  #lifetimeStats: LifetimeStats = { loaded: 0, failed: 0 }
  #listeners: Record<LoaderEvent, LoaderListener[]> = {
    complete: [],
    error: [],
    progress: [],
    start: [],
  }
  #manifest = new Map<string, ManifestEntry>()
  #manifestLoadPromise: Promise<void> | null = null

  register<T>(type: string, ExtensionClass: LoaderExtensionConstructor<T>): void {
    this.#extensions.set(type, ExtensionClass as LoaderExtensionConstructor)

    if (typeof ExtensionClass.install === 'function') {
      ExtensionClass.install(this)
    }
  }

  setManifest(entries: readonly ManifestEntry[]): void {
    for (const entry of entries) {
      if (!entry.id) {
        continue
      }

      const existingEntry = this.#manifest.get(entry.id)

      if (existingEntry) {
        throw new Error(
          `Duplicate manifest id: "${entry.id}". Previously registered with src: ${this.#key(existingEntry.src)}`,
        )
      }

      this.#manifest.set(entry.id, entry)

      const existing = this.#inFlight.get(entry.id)
      if (existing && this.#key(existing.src) !== this.#key(entry.src)) {
        existing.stale = true
      }

      const srcKey = this.#key(entry.src)
      const existingBySrc = this.#inFlight.get(srcKey)
      if (existingBySrc && this.#key(existingBySrc.src) === this.#key(entry.src)) {
        this.#inFlight.set(entry.id, existingBySrc)
      }
    }
  }

  async load(manifest: ManifestInput): Promise<void> {
    const list = this.#normalizeManifestInput(manifest)
    this.setManifest(list)

    const tasks = list
      .filter((entry) => !entry.lazy)
      .map((entry) => this.#loadOne(entry))

    this.#batchStats = {
      failed: 0,
      loaded: 0,
      pending: tasks.length,
      total: tasks.length,
    }

    this.#emit('start', { ...this.#batchStats })
    await Promise.allSettled(tasks)
    this.#emit('complete', { ...this.#batchStats })
  }

  async loadAsset<T = unknown>(
    type: string,
    srcOrId: string,
    callback?: LoaderCallback<T>,
  ): Promise<T> {
    try {
      const data = await this.#loadAsset<T>(type, srcOrId)
      callback?.(null, data)
      return data
    } catch (error) {
      const normalizedError = this.#normalizeError(error)
      callback?.(normalizedError)
      throw normalizedError
    }
  }

  loadImage(srcOrId: string, callback?: LoaderCallback<HTMLImageElement>): Promise<HTMLImageElement> {
    return this.loadAsset('image', srcOrId, callback)
  }

  loadAudio(srcOrId: string, callback?: LoaderCallback<HTMLAudioElement>): Promise<HTMLAudioElement> {
    return this.loadAsset('audio', srcOrId, callback)
  }

  loadModel(srcOrId: string, callback?: LoaderCallback<GLTF>): Promise<GLTF> {
    return this.loadAsset('model', srcOrId, callback)
  }

  onProgress(fn: LoaderListener): () => void {
    return this.#subscribe('progress', fn)
  }

  onError(fn: LoaderListener): () => void {
    return this.#subscribe('error', fn)
  }

  onStart(fn: LoaderListener): () => void {
    return this.#subscribe('start', fn)
  }

  onComplete(fn: LoaderListener): () => void {
    return this.#subscribe('complete', fn)
  }

  /** Synchronously read an already-loaded asset from cache (by id or src key). */
  get<T = unknown>(idOrSrc: string): T | undefined {
    return this.#cache.get(idOrSrc) as T | undefined
  }

  /** Whether an asset has finished loading (by id or src key). */
  has(idOrSrc: string): boolean {
    return this.#cache.has(idOrSrc)
  }

  /** Look up a manifest entry (e.g. to resolve an id to its src URL). */
  getEntry(id: string): ManifestEntry | undefined {
    return this.#manifest.get(id)
  }

  async #loadAsset<T>(type: string, srcOrId: string): Promise<T> {
    const entry = await this.#resolveEntry(srcOrId)

    if (!entry && !this.#looksLikeUrl(srcOrId)) {
      const manifestEmpty = this.#manifest.size === 0
      const error = new LoaderAssetError(
        manifestEmpty
          ? `No manifest loaded. Cannot resolve id: "${srcOrId}"`
          : `Manifest loaded but id not found: "${srcOrId}". Available ids: ${[...this.#manifest.keys()].join(', ')}`,
        {
          id: srcOrId,
          phase: manifestEmpty ? 'no-manifest' : 'id-not-found',
        },
      )

      this.#recordFailure(error, null)
      throw error
    }

    const src = entry ? entry.src : srcOrId
    const assetType = entry ? entry.type : type
    const key = entry ? entry.id : this.#key(src)
    const srcKey = this.#key(src)

    const cached = this.#readCached<T>(key, srcKey)
    if (cached.found) {
      return cached.data
    }

    const existing = this.#readInFlight<T>(key, srcKey, src)
    if (existing) {
      return existing
    }

    const promise = this.#doLoad<T>(assetType, src, entry)
      .then((data) => {
        this.#cache.set(key, data)
        if (srcKey !== key) {
          this.#cache.set(srcKey, data)
        }

        this.#inFlight.delete(key)
        if (srcKey !== key) {
          this.#inFlight.delete(srcKey)
        }

        this.#lifetimeStats.loaded += 1
        if (entry) {
          this.#batchStats.loaded += 1
          this.#batchStats.pending -= 1
        }

        this.#emit('progress', {
          ...this.#batchStats,
          data,
          entry,
          lifetime: { ...this.#lifetimeStats },
        })

        return data
      })
      .catch((error: unknown) => {
        const normalizedError = this.#normalizeError(error)
        this.#inFlight.delete(key)
        if (srcKey !== key) {
          this.#inFlight.delete(srcKey)
        }

        this.#recordFailure(normalizedError, entry)
        throw normalizedError
      })

    const record: InFlightRecord<T> = { promise, src, entry }
    this.#inFlight.set(key, record)
    if (srcKey !== key) {
      this.#inFlight.set(srcKey, record)
    }

    return promise
  }

  async #resolveEntry(srcOrId: string): Promise<ManifestEntry | null> {
    let entry = this.#manifest.get(srcOrId) ?? null

    if (!entry && !this.#looksLikeUrl(srcOrId)) {
      await this.#loadDefaultManifest()
      entry = this.#manifest.get(srcOrId) ?? null
    }

    return entry
  }

  async #loadDefaultManifest(): Promise<void> {
    if (this.#manifest.size > 0) {
      return
    }

    this.#manifestLoadPromise ??= this.#fetchDefaultManifest()
    await this.#manifestLoadPromise
  }

  async #fetchDefaultManifest(): Promise<void> {
    let response: Response

    try {
      response = await fetch(DEFAULT_MANIFEST_URL)
    } catch (event) {
      throw new LoaderAssetError(`Failed to load manifest: ${DEFAULT_MANIFEST_URL}`, {
        event,
        phase: 'manifest-network-error',
        src: DEFAULT_MANIFEST_URL,
      })
    }

    if (!response.ok) {
      throw new LoaderAssetError(
        `Failed to load manifest: ${response.status} ${response.statusText}`,
        {
          phase: 'manifest-network-error',
          src: DEFAULT_MANIFEST_URL,
        },
      )
    }

    const data = await response.json() as ManifestResponse
    if (!Array.isArray(data.assets)) {
      throw new LoaderAssetError('Manifest must contain an assets array.', {
        phase: 'manifest-parse-error',
        src: DEFAULT_MANIFEST_URL,
      })
    }

    this.setManifest(data.assets.map((entry) => this.#normalizeManifestEntry(entry)))
  }

  #normalizeManifestInput(input: ManifestInput): ManifestEntry[] {
    if (Array.isArray(input)) {
      return input.map((entry) => this.#normalizeManifestEntry(entry))
    }

    if ('assets' in input) {
      return input.assets.map((entry) => this.#normalizeManifestEntry(entry))
    }

    return [this.#normalizeManifestEntry(input)]
  }

  #normalizeManifestEntry(entry: unknown): ManifestEntry {
    if (!this.#isManifestEntry(entry)) {
      throw new LoaderAssetError('Invalid manifest entry.', {
        phase: 'manifest-parse-error',
      })
    }

    return entry
  }

  #isManifestEntry(entry: unknown): entry is ManifestEntry {
    if (!entry || typeof entry !== 'object') {
      return false
    }

    const candidate = entry as Partial<ManifestEntry>

    return (
      typeof candidate.id === 'string'
      && typeof candidate.type === 'string'
      && (
        typeof candidate.src === 'string'
        || (
          Array.isArray(candidate.src)
          && candidate.src.every((source) => typeof source === 'string')
        )
      )
    )
  }

  #readCached<T>(key: string, srcKey: string): { data: T, found: true } | { found: false } {
    if (this.#cache.has(key)) {
      return { data: this.#cache.get(key) as T, found: true }
    }

    if (srcKey !== key && this.#cache.has(srcKey)) {
      const data = this.#cache.get(srcKey) as T
      this.#cache.set(key, data)
      return { data, found: true }
    }

    return { found: false }
  }

  #readInFlight<T>(key: string, srcKey: string, src: AssetSource): Promise<T> | null {
    const existing = this.#inFlight.get(key)
    if (existing && !existing.stale && this.#key(existing.src) === this.#key(src)) {
      return existing.promise as Promise<T>
    }

    const existingBySrc = this.#inFlight.get(srcKey)
    if (existingBySrc && !existingBySrc.stale && this.#key(existingBySrc.src) === this.#key(src)) {
      this.#inFlight.set(key, existingBySrc)
      return existingBySrc.promise as Promise<T>
    }

    return null
  }

  async #doLoad<T>(type: string, src: AssetSource, entry: ManifestEntry | null): Promise<T> {
    const ExtensionClass = this.#extensions.get(type)
    if (!ExtensionClass) {
      throw new LoaderAssetError(`No loader registered for type: ${type}`, {
        entry,
        phase: 'missing-extension',
        src,
      })
    }

    const instance = new ExtensionClass(this)
    return await instance.load(src, entry) as T
  }

  async #loadOne(entry: ManifestEntry): Promise<unknown> {
    return await this.loadAsset(entry.type, entry.id || this.#key(entry.src))
  }

  #recordFailure(error: Error, entry: ManifestEntry | null): void {
    this.#lifetimeStats.failed += 1
    if (entry) {
      this.#batchStats.failed += 1
      this.#batchStats.pending -= 1
    }

    const data = {
      ...this.#batchStats,
      entry,
      error,
      lifetime: { ...this.#lifetimeStats },
    }

    this.#emit('error', data)
    this.#emit('progress', data)
  }

  #subscribe(event: LoaderEvent, fn: LoaderListener): () => void {
    this.#listeners[event].push(fn)

    return () => {
      const listeners = this.#listeners[event]
      const index = listeners.indexOf(fn)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  #emit(event: LoaderEvent, data: LoaderEventData): void {
    for (const fn of this.#listeners[event]) {
      try {
        fn(data)
      } catch (error) {
        console.error(error)
      }
    }
  }

  #normalizeError(error: unknown): Error {
    return error instanceof Error
      ? error
      : new Error(String(error))
  }

  #key(src: AssetSource): string {
    return typeof src === 'string' ? src : JSON.stringify(src)
  }

  #looksLikeUrl(value: string): boolean {
    if (/^(https?:)?\/\//.test(value)) return true
    if (/\.[a-zA-Z0-9]{1,5}$/.test(value)) return true
    if (value.startsWith('/')) return true
    if (value.startsWith('./') || value.startsWith('../')) return true
    return false
  }

  static #instance: Loader | null = null

  static getInstance(): Loader {
    Loader.#instance ??= new Loader()
    return Loader.#instance
  }

  static loadImage(srcOrId: string, callback?: LoaderCallback<HTMLImageElement>): Promise<HTMLImageElement> {
    return Loader.getInstance().loadImage(srcOrId, callback)
  }

  static loadAudio(srcOrId: string, callback?: LoaderCallback<HTMLAudioElement>): Promise<HTMLAudioElement> {
    return Loader.getInstance().loadAudio(srcOrId, callback)
  }

  static loadModel(srcOrId: string, callback?: LoaderCallback<GLTF>): Promise<GLTF> {
    return Loader.getInstance().loadModel(srcOrId, callback)
  }

  static load(manifest: ManifestInput): Promise<void> {
    return Loader.getInstance().load(manifest)
  }

  static register<T>(type: string, ExtensionClass: LoaderExtensionConstructor<T>): void {
    Loader.getInstance().register(type, ExtensionClass)
  }

  static onProgress(fn: LoaderListener): () => void {
    return Loader.getInstance().onProgress(fn)
  }

  static onError(fn: LoaderListener): () => void {
    return Loader.getInstance().onError(fn)
  }

  static onStart(fn: LoaderListener): () => void {
    return Loader.getInstance().onStart(fn)
  }

  static onComplete(fn: LoaderListener): () => void {
    return Loader.getInstance().onComplete(fn)
  }
}

export const loader = Loader.getInstance()
