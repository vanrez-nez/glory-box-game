<template>
  <div v-if="control.open" class="EditorOverlay" @click.self="close">
    <div class="EditorOverlay-panel">
      <div class="EditorOverlay-title">Insert item</div>
      <div class="EditorOverlay-grid">
        <button
          v-for="t in types"
          :key="t.type"
          class="EditorOverlay-item"
          @click="pick(t.type)"
        >{{ t.label }}</button>
      </div>
      <div class="EditorOverlay-hint">Esc cancels &middot; click a tile to place</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { editorStore, type ItemType } from '@/editor/store';
import { ITEM_TYPES, ITEM_CATALOG } from '@/editor/items';

// `control` (reactive, owned by overlay-mount) is read-only here; `close` is the
// callback that flips it (avoids mutating the prop directly).
const props = defineProps<{ control: { open: boolean }; close: () => void }>();
const types = ITEM_TYPES.map((type) => ({ type, label: ITEM_CATALOG[type].label }));

function pick(type: ItemType) {
  const s = editorStore.getState();
  s.setInsertType(type);
  s.setMode('insert');
  props.close();
}
</script>

<style scoped>
.EditorOverlay {
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  z-index: 9999;
  font-family: system-ui, sans-serif;
}
.EditorOverlay-panel {
  min-width: 300px;
  padding: 22px 26px;
  background: var(--shark, #25272c);
  border: 1px solid #3a3f47;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.55);
  color: var(--white, #fff);
}
.EditorOverlay-title {
  font-size: 12px;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 0.6;
  margin-bottom: 14px;
}
.EditorOverlay-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.EditorOverlay-item {
  padding: 16px 12px;
  background: #1c1f25;
  border: 1px solid #3a3f47;
  border-radius: 6px;
  color: var(--white, #fff);
  font-size: 13px;
  cursor: pointer;
  transition: background 0.12s ease, border-color 0.12s ease;
}
.EditorOverlay-item:hover {
  background: #2c323b;
  border-color: var(--steel-blue, #4682b4);
}
.EditorOverlay-hint {
  margin-top: 16px;
  font-size: 11px;
  opacity: 0.5;
}
</style>
