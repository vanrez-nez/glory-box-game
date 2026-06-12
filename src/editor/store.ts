import { createStore } from 'zustand/vanilla';
import { persist, createJSONStorage } from 'zustand/middleware';
// The placement RECORD types are game-side (the game spawns from them); the editor
// re-exports them so its modules keep importing from '@/editor/store'.
import { cellKey, type ItemType, type PlacedItem } from '@/game/level/types';

export { cellKey };
export type { ItemType, CellId, PlacedItem, DenDirection } from '@/game/level/types';
export type EditorMode = 'select' | 'insert';

function buildOccupancy(records: Record<string, PlacedItem>) {
  const occ: Record<string, string> = {};
  for (const id in records) {
    for (const key of records[id].cells) { occ[key] = id; }
  }
  return occ;
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

  // Place a record iff none of its cells are occupied. Returns success.
  add(record: PlacedItem): boolean;
  remove(id: string): void;
  select(id: string | null): void;
  setMode(mode: EditorMode): void;
  setInsertType(type: ItemType | null): void;
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

      clear() { set({ records: {}, occupancy: {}, selectedId: null }); },

      exportJSON() {
        return JSON.stringify({ version: STORE_VERSION, records: get().records }, null, 2);
      },

      importJSON(json) {
        try {
          const data = JSON.parse(json);
          const records = (data && data.records) || {};
          set({ records, occupancy: buildOccupancy(records), selectedId: null });
        } catch {
          // ignore malformed input
        }
      },
    }),
    {
      name: STORAGE_KEY,
      version: STORE_VERSION,
      storage: createJSONStorage(() => localStorage),
      // Persist only the records; occupancy is derived, UI state is transient.
      partialize: (s) => ({ records: s.records }) as EditorState,
      onRehydrateStorage: () => (state) => {
        if (state) { state.occupancy = buildOccupancy(state.records); }
      },
    },
  ),
);
