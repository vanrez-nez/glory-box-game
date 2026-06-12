import type Game from '@/game/main';
import { GAME } from '@/game/const';
import { CylinderFromCartesian } from '@/game/utils';
import { KEYBOARD } from '@/common/input-manager';
import GameTools from '@/editor/tools';
import HexGridOverlay from '@/editor/hex-grid-overlay';
import TileEditor from '@/editor/tile-editor';
import Placement from '@/editor/placement';
import { mountOverlay } from '@/editor/overlay-mount';
import { editorStore, type CellId } from '@/editor/store';

// Edit camera: scroll orbits/pans. radians per horizontal wheel unit, world-units
// per vertical wheel unit. EDIT_RADIUS = distance out from the wall.
const EDIT_AZIMUTH_SPEED = 0.0016;
const EDIT_HEIGHT_SPEED = 0.06;
const EDIT_RADIUS = GAME.CameraDistance;
// Edit-fly speed: x = map-units around the cylinder, y = world-units elevation/sec.
const EDIT_FLY_SPEED = 36;
const MAX_FRAME_DELTA = 0.1;
// Right-drag free-look: radians per pixel; pitch clamped to avoid flipping over.
const LOOK_SENSITIVITY = 0.005;
const MAX_PITCH = 1.45;

export interface EditorHandle {
  dispose(): void;
}

const keyToCell = (key: string): CellId => {
  const [col, row] = key.split(',').map(Number);
  return { col, row };
};

/*
  Dev-only editor. Attaches to a running Game via the game's generic extension API
  (engine.cameraController slot + loop.frozen/onFrameStart/onFrameEnd hooks) — the
  game never imports this module statically; main.ts pulls it in behind
  `import.meta.env.DEV` so Rollup drops it from production. Owns: the tweakpane dev
  tools, hex-grid overlay, tile picking, free-fly camera + fly, the Cmd/Ctrl+E
  toggle, AND the placement/save system (zustand store + prop spawner + overlay).
*/
export function attachEditor(game: Game): EditorHandle {
  const c = game.components;
  const { engine, world, player, physics, gameInput, enemy, map } = c;
  const { loop } = game;

  // Edit-mode state (replaces the old GameConfig.StaticDesign flag).
  let active = false;
  const isActive = () => active;
  // Edit camera orbit state (scroll) + free-look offsets (right-drag).
  let azimuth = 0;
  let height = 0;
  let lookYaw = 0;
  let lookPitch = 0;
  let lastFrameMs = 0;

  // Hex-grid overlay + tile picking, both gated on `active`.
  const overlay = new HexGridOverlay(world.hexGrid, world.group, isActive);
  const tileEditor = new TileEditor({
    camera: engine.camera,
    canvas: engine.renderer.domElement,
    hexGrid: world.hexGrid,
    parent: world.group,
    isActive,
  });

  // Placement: store-backed records + footprint preview. The GAME map spawns/ticks
  // the real props (placement only mutates records + calls map.add/remove/update).
  const placement = new Placement({ hexGrid: world.hexGrid, parent: world.group, map });
  const overlayUI = mountOverlay();
  // Dev hand-off: if localStorage has a working copy, it overrides the bundled
  // level the loader spawned; otherwise adopt the bundled level into the store.
  if (Object.keys(editorStore.getState().records).length) {
    map.loadLevel(editorStore.getState().records);
  } else {
    editorStore.getState().importJSON(JSON.stringify({ records: map.getRecords() }));
  }

  // --- level export / import / clear (store is the editing copy; map respawns) ---
  const downloadLevel = () => {
    const blob = new Blob([editorStore.getState().exportJSON()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'level.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  const importLevel = (json: string) => {
    editorStore.getState().importJSON(json);
    map.loadLevel(editorStore.getState().records);
    refreshFromStore();
  };
  const clearLevel = () => {
    editorStore.getState().clear();
    map.loadLevel({});
    refreshFromStore();
  };
  // Hex-grid scale changed → rebuild the overlay and re-derive every placed
  // component from its (cell-based) record at the new cell size: the world resizes.
  const onColumnsChanged = () => {
    overlay.rebuild();
    map.reloadLevel(editorStore.getState().records);
    refreshFromStore();
  };

  // Tweakpane dev tools (FPS graph + tuning screens + the editor placement UI).
  const tools = new GameTools();
  tools.addFpsGraph();
  tools.fpsGraph?.setRenderer(engine.getBackendName());
  tools.addScreen('engine', engine);
  tools.addScreen('physics', physics);
  tools.addScreen('player', player);
  tools.addScreen('dragon', enemy.dragon);
  tools.addScreen('world', world);
  tools.addScreen('editor', {
    mainCylinder: world.mainCylinder,
    hexGrid: world.hexGrid,
    overlay,
    placement,
    actions: { downloadLevel, importLevel, clearLevel, onColumnsChanged },
  });
  tools.buildMaterials();
  tools.persist();

  // Reflect the store into the scene + tweakpane: selection highlight, the editable
  // insert metadata, and per-item folder visibility.
  function refreshFromStore() {
    const s = editorStore.getState();
    const rec = s.selectedId ? s.records[s.selectedId] : null;
    tileEditor.setSelectionCells(rec ? rec.cells.map(keyToCell) : []);
    placement.syncSelectedMeta();
    tools.updateEditorFolders(s);
    (tools.pane as any)?.refresh?.();
  }
  const unsubStore = editorStore.subscribe(refreshFromStore);
  refreshFromStore();

  // Free-fly edit camera (installed on engine.cameraController while active).
  const cameraController = (_delta: number) => {
    const r = GAME.CylinderRadius + EDIT_RADIUS;
    const px = Math.sin(azimuth) * r;
    const pz = Math.cos(azimuth) * r;
    engine.camera.position.set(px, height, pz);
    const yaw = azimuth + Math.PI + lookYaw; // +PI = toward the axis at offset 0
    const cp = Math.cos(lookPitch);
    engine.camera.lookAt(
      px + Math.sin(yaw) * cp,
      height + Math.sin(lookPitch),
      pz + Math.cos(yaw) * cp,
    );
  };

  // Edit-fly: arrow keys move the (frozen) player body directly in cylinder axes.
  const editFly = (dt: number) => {
    const kb = gameInput.inputManager.state.keyboard;
    const ax = (kb[KEYBOARD.ArrowRight] ? 1 : 0) - (kb[KEYBOARD.ArrowLeft] ? 1 : 0);
    const ay = (kb[KEYBOARD.ArrowUp] ? 1 : 0) - (kb[KEYBOARD.ArrowDown] ? 1 : 0);
    player.playerBody.position.x += ax * EDIT_FLY_SPEED * dt;
    player.playerBody.position.y += ay * EDIT_FLY_SPEED * dt;
  };

  // Per-frame editor work via the loop hooks. onFrameStart runs before
  // physics.interpolate so edit-fly's body move is reflected the same frame.
  loop.onFrameStart = () => {
    tools.fpsGraph?.begin();
    const now = performance.now();
    const dt = lastFrameMs ? Math.min((now - lastFrameMs) / 1000, MAX_FRAME_DELTA) : 0;
    lastFrameMs = now;
    if (active) { editFly(dt); }
    overlay.update(height);
    tileEditor.update();
    placement.updatePreview(active ? tileEditor.getHoverCell() : null);
    // Note: placed props are ticked by the GAME (map.update), not here.
  };
  loop.onFrameEnd = () => {
    tools.fpsGraph?.end();
  };

  const setActive = (on: boolean) => {
    active = on;
    loop.frozen = on;
    if (on) {
      const [, theta] = CylinderFromCartesian(engine.cameraTarget);
      azimuth = theta;
      height = engine.cameraTarget.y + 6;
      lookYaw = 0;
      lookPitch = 0;
      engine.cameraController = cameraController;
    } else {
      engine.cameraController = undefined;
    }
  };

  const exitInsert = () => {
    const s = editorStore.getState();
    s.setMode('select');
    s.setInsertType(null);
    overlayUI.close();
  };

  // Window keydown in CAPTURE phase so we can suppress the game's Escape→pause
  // while in edit mode (the input manager listens on document in the bubble phase).
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'e') {
      e.preventDefault();
      setActive(!active);
      return;
    }
    if (!active) { return; }
    const s = editorStore.getState();
    if (e.key === 'i' || e.key === 'I') {
      e.preventDefault();
      overlayUI.open();
    } else if (e.key === 'Escape') {
      // Don't let the game pause while editing; cancel insert if inserting.
      e.preventDefault();
      e.stopPropagation();
      if (s.mode === 'insert') { exitInsert(); }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (s.mode === 'select') { e.preventDefault(); placement.deleteSelected(); }
    }
  };
  window.addEventListener('keydown', onKeyDown, { capture: true });

  // Left-click: place (insert) or select (select), at a frame-accurate pick.
  const onClick = (e: MouseEvent) => {
    if (!active || e.button !== 0) { return; }
    const cell = tileEditor.pick();
    if (editorStore.getState().mode === 'insert') { placement.placeAt(cell); }
    else { placement.pickSelect(cell); }
  };

  // Scroll orbits (trackpad horizontal / Shift+wheel) + pans (vertical) — active only.
  const onWheel = (e: WheelEvent) => {
    if (!active) { return; }
    e.preventDefault();
    const horizontal = e.deltaX || (e.shiftKey ? e.deltaY : 0);
    const vertical = e.shiftKey ? 0 : e.deltaY;
    azimuth -= horizontal * EDIT_AZIMUTH_SPEED;
    height -= vertical * EDIT_HEIGHT_SPEED;
  };
  const canvas = engine.renderer.domElement;
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('click', onClick);

  // Right-click drag = free-look (yaw + pitch). Context menu suppressed while active.
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  const onContextMenu = (e: MouseEvent) => {
    if (active) { e.preventDefault(); }
  };
  const onMouseDown = (e: MouseEvent) => {
    if (!active || e.button !== 2) { return; }
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onMouseMove = (e: MouseEvent) => {
    if (!dragging) { return; }
    lookYaw -= (e.clientX - lastX) * LOOK_SENSITIVITY;
    lookPitch -= (e.clientY - lastY) * LOOK_SENSITIVITY;
    lookPitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, lookPitch));
    lastX = e.clientX;
    lastY = e.clientY;
  };
  const onMouseUp = () => { dragging = false; };
  canvas.addEventListener('contextmenu', onContextMenu);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseup', onMouseUp);

  return {
    dispose() {
      window.removeEventListener('keydown', onKeyDown, { capture: true } as any);
      canvas.removeEventListener('wheel', onWheel);
      canvas.removeEventListener('click', onClick);
      canvas.removeEventListener('contextmenu', onContextMenu);
      canvas.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      unsubStore();
      loop.onFrameStart = undefined;
      loop.onFrameEnd = undefined;
      loop.frozen = false;
      engine.cameraController = undefined;
      // The placed level is game-owned (map) — leave it; only tear down editor UI.
      placement.dispose();
      overlayUI.dispose();
      tileEditor.dispose();
      overlay.dispose();
      (tools.pane as any)?.dispose?.();
    },
  };
}
