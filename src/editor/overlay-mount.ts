import { createApp, reactive, type App } from 'vue';
import EditorOverlay from '@/editor/editor-overlay.vue';

export interface OverlayHandle {
  open(): void;
  close(): void;
  isOpen(): boolean;
  dispose(): void;
}

/*
  Mounts the dev-only insert-picker overlay as its OWN tiny Vue app on a throwaway
  body node (independent of the main app). `control` is a reactive flag the editor
  toggles; the overlay component mutates it on pick/close. Lives in the editor
  chunk (imported only from index.ts) → tree-shaken from production.
*/
export function mountOverlay(): OverlayHandle {
  const control = reactive({ open: false });
  const node = document.createElement('div');
  node.className = 'EditorOverlayRoot';
  document.body.appendChild(node);
  const close = () => { control.open = false; };
  const app: App = createApp(EditorOverlay, { control, close });
  app.mount(node);
  return {
    open() { control.open = true; },
    close() { control.open = false; },
    isOpen() { return control.open; },
    dispose() {
      app.unmount();
      node.remove();
    },
  };
}
