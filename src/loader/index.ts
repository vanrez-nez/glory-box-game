import { Loader, loader } from './loader'
import './extensions/index'

export { Loader, loader }
export type {
  AssetSource,
  AssetType,
  LoaderCallback,
  LoaderEventData,
  LoaderListener,
  ManifestEntry,
  ManifestInput,
} from './loader'
export default loader
