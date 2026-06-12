import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
// The placement RECORD types are game-side (the game spawns from them); the editor
// re-exports them so its modules keep importing from '@/editor/store'.
import { cellKey, type ItemType, type PlacedItem } from '@/game/level/types';

export { cellKey };
export type { ItemType, CellId, PlacedItem, DenDirection } from '@/game/level/types';
export type EditorMode = 'select' | 'insert';

// Validate a record set so two pads can NEVER share a cell. Records are taken in
// order; the first to claim a cell keeps it, any later record that collides (or
// has no footprint) is dropped. Returns the cleaned records + their occupancy.
// Used on every bulk load (import / rehydrate) — interactive placement is already
// guarded by add(). This makes "no overlapping pads" an invariant of the store,
// not just of the placement UI.
function sanitizeRecords(records: Record<string, PlacedItem>): {
  records: Record<string, PlacedItem>;
  occupancy: Record<string, string>;
} {
  const occ: Record<string, string> = {};
  const kept: Record<string, PlacedItem> = {};
  for (const id in records) {
    const rec = records[id];
    const cells = rec?.cells ?? [];
    if (cells.length === 0 || cells.some((key) => occ[key])) {
      // eslint-disable-next-line no-console
      console.warn(`[editor] dropping invalid/overlapping record "${id}"`);
      continue;
    }
    for (const key of cells) { occ[key] = id; }
    kept[id] = rec;
  }
  return { records: kept, occupancy: occ };
}

// ---- store -----------------------------------------------------------------

const STORAGE_KEY = 'glory-box-editor';
const STORE_VERSION = 1;

export interface EditorState {
  records: Record<string, PlacedItem>;
  // "col,row" → record id; kept in lockstep with records (rebuilt on rehydrate).
  occupancy: Record<string, string>;
  mode: EditorMode;
  insertType: ItemType | null;
  selectedId: string | null;
  // Global inner pad padding (CELLS, per side) — saved with the level.
  padding: number;

  // Place a record iff none of its cells are occupied. Returns success.
  add(record: PlacedItem): boolean;
  remove(id: string): void;
  select(id: string | null): void;
  setMode(mode: EditorMode): void;
  setInsertType(type: ItemType | null): void;
  setPadding(padding: number): void;
  updateMeta(id: string, partial: Record<string, any>): void;
  clear(): void;
  exportJSON(): string;
  importJSON(json: string): void;
}

/*
  Editor placement state — a framework-agnostic zustand vanilla store read by the
  TS editor (imperatively via getState) and the Vue overlay (via subscribe). Only
  `records` is persisted to localStorage; `occupancy` is rebuilt on rehydrate and
  transient UI (mode/selection) is not saved. Dev-only (lives in src/editor).
*/
export const editorStore = createStore<EditorState>()(
  persist(
    (set, get) => ({
      records: {},
      occupancy: {},
      mode: 'select',
      insertType: null,
      selectedId: null,
      padding: 0.1,

      add(record) {
        const { occupancy, records } = get();
        for (const key of record.cells) {
          if (occupancy[key]) { return false; }
        }
        const nextOcc = { ...occupancy };
        for (const key of record.cells) { nextOcc[key] = record.id; }
        set({ records: { ...records, [record.id]: record }, occupancy: nextOcc });
        return true;
      },

      remove(id) {
        const { records, occupancy, selectedId } = get();
        const rec = records[id];
        if (!rec) { return; }
        const nextRecords = { ...records };
        delete nextRecords[id];
        const nextOcc = { ...occupancy };
        for (const key of rec.cells) {
          if (nextOcc[key] === id) { delete nextOcc[key]; }
        }
        set({
          records: nextRecords,
          occupancy: nextOcc,
          selectedId: selectedId === id ? null : selectedId,
        });
      },

      select(id) { set({ selectedId: id }); },
      setMode(mode) { set({ mode }); },
      setInsertType(insertType) { set({ insertType }); },

      updateMeta(id, partial) {
        const { records } = get();
        const rec = records[id];
        if (!rec) { return; }
        set({ records: { ...records, [id]: { ...rec, meta: { ...rec.meta, ...partial } } } });
      },

      setPadding(padding) { set({ padding }); },

      clear() { set({ records: {}, occupancy: {}, selectedId: null }); },

      exportJSON() {
        const { records, padding } = get();
        return JSON.stringify({ version: STORE_VERSION, padding, records }, null, 2);
      },

      importJSON(json) {
        try {
          const data = JSON.parse(json);
          const clean = sanitizeRecords((data && data.records) || {});
          const next: Partial<EditorState> = {
            records: clean.records, occupancy: clean.occupancy, selectedId: null,
          };
          if (typeof data.padding === 'number') { next.padding = data.padding; }
          set(next as EditorState);
        } catch {
          // ignore malformed input
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist records + padding; occupancy is derived, UI state is transient.
      partialize: (s) => ({ records: s.records, padding: s.padding }) as EditorState,
      onRehydrateStorage: () => (state) => {
        if (state) {
          const clean = sanitizeRecords(state.records);
          state.records = clean.records;
          state.occupancy = clean.occupancy;
        }
      },
    },
  ),
);
