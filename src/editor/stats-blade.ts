/* eslint-disable */
// Vendored Tweakpane blade plugin: a classic stats.js-style FPS/MS/MB panel.
// Canvas behavior intentionally follows the classic MIT-licensed mrdoob/stats.js panel model.
import {
  BladeApi,
  BladeController,
  type BladePlugin,
  ClassName,
  createPlugin,
  parseRecord,
  type TpPluginBundle,
  type View,
} from '@tweakpane/core'

type StatsBladeParams = {
  label?: string
  view: 'stats'
}

type MemoryInfo = {
  jsHeapSizeLimit: number
  totalJSHeapSize: number
  usedJSHeapSize: number
}

type PerformanceWithMemory = Performance & {
  memory?: MemoryInfo
}

type StatsPanelConfig = {
  backgroundColor: string
  foregroundColor: string
  mutedColor: string
  name: string
}

type StatsPanelTheme = {
  backgroundColor: string
  foregroundColor: string
  mutedColor: string
}

export type StatsPaneApi = {
  begin: () => void
  end: () => number
  showPanel: (index: number) => void
  update: () => number
  setRenderer: (name: string) => void
}

const STATS_PLUGIN_ID = 'candilero-stats'
const STATS_VIEW = 'stats'
const MIN_CANVAS_WIDTH = 80
const GRAPH_HEIGHT = 30
const MB_BYTES = 1048576
const FPS_PANEL = 0
const MS_PANEL = 1
const MB_PANEL = 2
const PANEL_CONFIGS: readonly StatsPanelConfig[] = [
  {
    name: 'FPS',
    foregroundColor: 'rgba(187, 188, 196, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    mutedColor: 'rgba(187, 188, 196, 0.1)',
  },
  {
    name: 'MS',
    foregroundColor: 'rgba(187, 188, 196, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    mutedColor: 'rgba(187, 188, 196, 0.1)',
  },
  {
    name: 'MB',
    foregroundColor: 'rgba(187, 188, 196, 0.7)',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    mutedColor: 'rgba(187, 188, 196, 0.1)',
  },
]

const cn = ClassName('stats')

class StatsPaneView implements View {
  readonly element: HTMLElement
  private readonly labelElement: HTMLDivElement
  private readonly labelTextElement: HTMLSpanElement
  private readonly rendererElement: HTMLSpanElement
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private readonly resizeObserver: ResizeObserver
  private readonly panels: StatsCanvasPanel[] = []
  private canvasWidth = MIN_CANVAS_WIDTH
  private beginTime = performance.now()
  private frames = 0
  private lastTime = this.beginTime
  private activePanelIndex = FPS_PANEL

  constructor(document: Document, label: string | undefined) {
    this.element = document.createElement('div')
    this.element.classList.add(cn())
    this.element.title = label ?? 'Stats'

    this.labelElement = document.createElement('div')
    this.labelElement.classList.add(cn('label'))
    // FPS/MS/MB text on the left, renderer backend pinned to the right.
    this.labelTextElement = document.createElement('span')
    this.labelTextElement.classList.add(cn('labelText'))
    this.labelTextElement.textContent = 'FPS'
    this.labelElement.appendChild(this.labelTextElement)
    this.rendererElement = document.createElement('span')
    this.rendererElement.classList.add(cn('renderer'))
    this.labelElement.appendChild(this.rendererElement)
    this.element.appendChild(this.labelElement)

    this.canvas = document.createElement('canvas')
    this.canvas.classList.add(cn('canvas'))
    this.canvas.width = MIN_CANVAS_WIDTH
    this.canvas.height = GRAPH_HEIGHT
    this.canvas.style.height = `${GRAPH_HEIGHT}px`
    this.canvas.style.width = '100%'
    this.element.appendChild(this.canvas)

    const context = this.canvas.getContext('2d')

    if (!context) {
      throw new Error('Stats pane requires a 2D canvas context.')
    }

    this.context = context
    this.resizeDisplayCanvas(this.canvasWidth)
    this.createPanels()
    this.showPanel(FPS_PANEL)
    this.element.addEventListener('click', this.handleClick)
    this.resizeObserver = new ResizeObserver(this.handleResize)
    this.resizeObserver.observe(this.element)
    window.requestAnimationFrame(() => {
      this.resizeToElement()
    })
  }

  begin(): void {
    this.beginTime = performance.now()
  }

  end(): number {
    this.frames += 1

    const time = performance.now()
    this.panels[MS_PANEL]?.update(time - this.beginTime, 200)

    if (time >= this.lastTime + 1000) {
      this.panels[FPS_PANEL]?.update((this.frames * 1000) / (time - this.lastTime), 100)
      this.lastTime = time
      this.frames = 0

      const memory = (performance as PerformanceWithMemory).memory

      if (memory) {
        this.panels[MB_PANEL]?.update(memory.usedJSHeapSize / MB_BYTES, memory.jsHeapSizeLimit / MB_BYTES)
      }
    }

    this.drawActivePanel()

    return time
  }

  showPanel(index: number): void {
    if (this.panels.length === 0) {
      return
    }

    this.activePanelIndex = modulo(index, this.panels.length)
    this.drawActivePanel()
  }

  update(): number {
    this.beginTime = this.end()

    return this.beginTime
  }

  dispose(): void {
    this.element.removeEventListener('click', this.handleClick)
    this.resizeObserver.disconnect()
  }

  private createPanels(): void {
    const panelCount = (performance as PerformanceWithMemory).memory ? 3 : 2
    const theme = getStatsPanelTheme(this.element)

    for (let index = 0; index < panelCount; index += 1) {
      const config = PANEL_CONFIGS[index]

      if (config) {
        this.panels.push(new StatsCanvasPanel({
          ...config,
          ...theme,
        }, this.canvasWidth))
      }
    }
  }

  private drawActivePanel(): void {
    const panel = this.panels[this.activePanelIndex]

    if (panel) {
      // Only touch the DOM when the label actually changes. Writing textContent
      // unconditionally replaces the text node every frame — a childList mutation
      // that wakes any MutationObserver on the page (e.g. password-manager autofill
      // content scripts) into re-scanning the whole dev pane each frame.
      const label = panel.getLabel()
      if (this.labelTextElement.textContent !== label) {
        this.labelTextElement.textContent = label
      }
      panel.drawTo(this.context)
    }
  }

  setRenderer(name: string): void {
    this.rendererElement.textContent = name
  }

  private resizeToElement(): void {
    const width = Math.max(
      Math.floor(this.element.clientWidth),
      MIN_CANVAS_WIDTH,
    )

    if (width === this.canvasWidth) {
      return
    }

    const theme = getStatsPanelTheme(this.element)
    this.canvasWidth = width
    this.resizeDisplayCanvas(width)

    for (const panel of this.panels) {
      panel.resize(width, theme)
    }

    this.drawActivePanel()
  }

  private readonly handleClick = (): void => {
    this.showPanel(this.activePanelIndex + 1)
  }

  private readonly handleResize = (): void => {
    this.resizeToElement()
  }

  private resizeDisplayCanvas(width: number): void {
    const pixelRatio = getCanvasPixelRatio()

    this.canvas.width = width * pixelRatio
    this.canvas.height = GRAPH_HEIGHT * pixelRatio
    this.context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  }
}

class StatsCanvasPanel {
  private readonly canvas: HTMLCanvasElement
  private readonly context: CanvasRenderingContext2D
  private readonly config: StatsPanelConfig
  private width: number
  private min = Infinity
  private max = 0
  private label: string

  constructor(config: StatsPanelConfig, width: number) {
    this.config = config
    this.width = width
    this.label = config.name
    this.canvas = document.createElement('canvas')

    const context = this.canvas.getContext('2d')

    if (!context) {
      throw new Error('Stats panel requires a 2D canvas context.')
    }

    this.context = context
    this.resize(width, config)
  }

  resize(width: number, theme: StatsPanelTheme): void {
    const pixelRatio = getCanvasPixelRatio()

    this.width = width
    this.config.backgroundColor = theme.backgroundColor
    this.config.foregroundColor = theme.foregroundColor
    this.config.mutedColor = theme.mutedColor
    this.canvas.width = width * pixelRatio
    this.canvas.height = GRAPH_HEIGHT * pixelRatio
    this.context.setTransform(1, 0, 0, 1, 0, 0)
    this.context.scale(pixelRatio, pixelRatio)
    this.context.fillStyle = this.config.backgroundColor
    this.context.fillRect(0, 0, width, GRAPH_HEIGHT)
    this.context.fillStyle = this.config.foregroundColor
    this.context.fillRect(0, 0, width, GRAPH_HEIGHT)
    this.context.fillStyle = this.config.backgroundColor
    this.context.fillRect(0, 0, width, GRAPH_HEIGHT)
  }

  update(value: number, maxValue: number): void {
    this.min = Math.min(this.min, value)
    this.max = Math.max(this.max, value)

    this.label = `${Math.round(value)} ${this.config.name} (${Math.round(this.min)}-${Math.round(this.max)})`
    const graphValue = Math.min(GRAPH_HEIGHT, GRAPH_HEIGHT - (value / maxValue) * GRAPH_HEIGHT)

    this.context.drawImage(
      this.canvas,
      1,
      0,
      this.width - 1,
      GRAPH_HEIGHT,
      0,
      0,
      this.width - 1,
      GRAPH_HEIGHT,
    )
    this.context.fillStyle = this.config.foregroundColor
    this.context.fillRect(this.width - 1, 0, 1, GRAPH_HEIGHT)
    this.context.fillStyle = this.config.backgroundColor
    this.context.fillRect(this.width - 1, 0, 1, graphValue)
  }

  drawTo(context: CanvasRenderingContext2D): void {
    context.fillStyle = this.config.backgroundColor
    context.fillRect(0, 0, this.width, GRAPH_HEIGHT)
    context.drawImage(this.canvas, 0, 0, this.width, GRAPH_HEIGHT)
  }

  getLabel(): string {
    return this.label
  }
}

class StatsPaneController extends BladeController<StatsPaneView> {
  constructor(args: {
    blade: ConstructorParameters<typeof BladeController>[0]['blade']
    document: Document
    label?: string
    viewProps: ConstructorParameters<typeof BladeController>[0]['viewProps']
  }) {
    const view = new StatsPaneView(args.document, args.label)

    super({
      blade: args.blade,
      view,
      viewProps: args.viewProps,
    })

    args.viewProps.handleDispose(() => {
      view.dispose()
    })
  }
}

export class StatsBladeApi extends BladeApi<StatsPaneController> implements StatsPaneApi {
  begin(): void {
    this.controller.view.begin()
  }

  end(): number {
    return this.controller.view.end()
  }

  showPanel(index: number): void {
    this.controller.view.showPanel(index)
  }

  update(): number {
    return this.controller.view.update()
  }

  setRenderer(name: string): void {
    this.controller.view.setRenderer(name)
  }
}

const StatsBladePlugin: BladePlugin<StatsBladeParams> = createPlugin({
  id: STATS_VIEW,
  type: 'blade',
  accept(params) {
    const result = parseRecord<StatsBladeParams>(params, (parser) => ({
      label: parser.optional.string,
      view: parser.required.constant(STATS_VIEW),
    }))

    return result ? { params: result } : null
  },
  controller(args) {
    return new StatsPaneController({
      blade: args.blade,
      document: args.document,
      label: args.params.label,
      viewProps: args.viewProps,
    })
  },
  api(args) {
    if (args.controller instanceof StatsPaneController) {
      return new StatsBladeApi(args.controller)
    }

    return null
  },
})

export const StatsPanePluginBundle: TpPluginBundle = {
  id: STATS_PLUGIN_ID,
  plugin: StatsBladePlugin,
  css: `
    .${cn()} {
      box-sizing: border-box;
      display: block;
      padding: var(--cnt-vp) var(--cnt-hp);
      user-select: none;
      width: 100%;
    }

    .${cn('label')} {
      box-sizing: border-box;
      color: var(--mo-fg);
      display: flex;
      font-size: 11px;
      gap: 8px;
      height: var(--cnt-usz);
      justify-content: space-between;
      line-height: var(--cnt-usz);
      margin-bottom: var(--cnt-usp);
      overflow: hidden;
      padding-left: var(--bld-hp);
      padding-right: var(--bld-hp);
      white-space: nowrap;
    }

    .${cn('labelText')} {
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .${cn('renderer')} {
      flex: none;
      opacity: 0.7;
    }

    .${cn('canvas')} {
      background-color: var(--mo-bg);
      border-radius: var(--bld-br);
      box-sizing: border-box;
      cursor: pointer;
      display: block;
      image-rendering: pixelated;
      width: 100%;
    }
  `,
}

function modulo(value: number, divisor: number): number {
  return ((value % divisor) + divisor) % divisor
}

function getCanvasPixelRatio(): number {
  return Math.max(Math.round(window.devicePixelRatio || 1), 1)
}

function getStatsPanelTheme(element: HTMLElement): StatsPanelTheme {
  const style = window.getComputedStyle(element)

  return {
    backgroundColor: getCssVariable(style, '--mo-bg', 'rgba(0, 0, 0, 0.2)'),
    foregroundColor: getCssVariable(style, '--mo-fg', 'rgba(187, 188, 196, 0.7)'),
    mutedColor: getCssVariable(style, '--grv-fg', 'rgba(187, 188, 196, 0.1)'),
  }
}

function getCssVariable(
  style: CSSStyleDeclaration,
  name: string,
  fallback: string,
): string {
  const value = style.getPropertyValue(name).trim()

  return value.length > 0 ? value : fallback
}
