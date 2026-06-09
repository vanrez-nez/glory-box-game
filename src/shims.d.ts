// Ambient declarations for untyped dependencies and shader-string imports.
// NOTE: keep this file a *script* (no top-level import/export) so these
// `declare module` blocks are global ambient declarations.

declare module 'three.meshline' {
  export class MeshLine {
    geometry: import('three').BufferGeometry;
    setGeometry(geometry: import('three').BufferGeometry, widthCallback?: (p: number) => number): void;
    advance(position: { x: number; y: number; z: number }): void;
    [key: string]: any;
  }
  export class MeshLineMaterial {
    constructor(parameters?: Record<string, unknown>);
    [key: string]: any;
  }
  export function MeshLineRaycast(...args: unknown[]): void;
}

declare module 'mainloop.js' {
  interface MainLoop {
    setUpdate(fn: (delta: number) => void): MainLoop;
    setDraw(fn: (interpolation: number) => void): MainLoop;
    setEnd(fn: (fps: number, panic: boolean) => void): MainLoop;
    start(): MainLoop;
    stop(): MainLoop;
    resetFrameDelta(): number;
  }
  const mainLoop: MainLoop;
  export default mainLoop;
}

declare module 'threads' {
  interface Thread {
    send(data: unknown): { on(event: string, cb: (data: any) => void): Thread };
  }
  const threads: {
    spawn(fn: (input: any, done: (result: any) => void) => void): Thread;
  };
  export default threads;
}

declare module 'screenfull' {
  const screenfull: {
    enabled: boolean;
    isFullscreen: boolean;
    request(el?: Element): Promise<void>;
    exit(): Promise<void>;
    on(event: string, cb: () => void): void;
    off(event: string, cb: () => void): void;
  };
  export default screenfull;
}

declare module '*.glsl' { const value: string; export default value; }
declare module '*.vert' { const value: string; export default value; }
declare module '*.frag' { const value: string; export default value; }
declare module '*.vs' { const value: string; export default value; }
declare module '*.fs' { const value: string; export default value; }

declare module '*.glb' { const value: string; export default value; }
