// frontend/src/stores/configuratorStore.js
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

const useConfiguratorStore = create((set) => ({
  // ── State slices ────────────────────────────────────────────────────────
  category:         null,
  braceletLength:   null,
  selectedBeads:    [],
  selectedChain:    null,
  selectedCharms:   [],
  selectedMaterial: null,
  selectedColor:    null,
  totalPrice:       0,
  savedDesignId:    null,
  isGenerating:     false,
  editingBeadIndex: null,
  isHandViewActive: false,

  // ── Individual setters ──────────────────────────────────────────────────
  setCategory:         (category)         => set({ category }),
  setSelectedBeads:    (selectedBeads)    => set({ selectedBeads }),
  setSelectedChain:    (selectedChain)    => set({ selectedChain }),
  setSelectedCharms:   (selectedCharms)   => set({ selectedCharms }),
  setSelectedMaterial: (selectedMaterial) => set({ selectedMaterial }),
  setSelectedColor:    (selectedColor)    => set({ selectedColor }),
  setTotalPrice:       (totalPrice)       => set({ totalPrice }),
  setIsGenerating:     (isGenerating)     => set({ isGenerating }),
  setEditingBeadIndex: (editingBeadIndex) => set({ editingBeadIndex }),
  toggleHandView: () => set((state) => ({ isHandViewActive: !state.isHandViewActive })),

  // ── Bead editor actions ─────────────────────────────────────────────────
  openBeadEditor: (index) => set({ editingBeadIndex: index }),

  reorderBeads: (fromIndex, toIndex) =>
    set((state) => {
      const beads = [...state.selectedBeads];
      const [moved] = beads.splice(fromIndex, 1);
      beads.splice(toIndex, 0, moved);
      return { selectedBeads: beads };
    }),

  removeBead: (index) =>
    set((state) => ({
      selectedBeads: state.selectedBeads.filter((_, i) => i !== index),
      editingBeadIndex: null,
    })),

  replaceBeadAt: (index, newBead) =>
    set((state) => {
      const beads = [...state.selectedBeads];
      beads[index] = newBead;
      return { selectedBeads: beads, editingBeadIndex: null };
    }),

  removeCharm: (index) =>
    set((state) => ({
      selectedCharms: state.selectedCharms.filter((_, i) => i !== index),
    })),

  // ── Reset ───────────────────────────────────────────────────────────────
  resetDesign: () =>
    set({
      category:         null,
      braceletLength:   null,
      selectedBeads:    [],
      selectedChain:    null,
      selectedCharms:   [],
      selectedMaterial: null,
      selectedColor:    null,
      totalPrice:       0,
      savedDesignId:    null,
      isGenerating:     false,
      editingBeadIndex: null,
      isHandViewActive: false,
    }),
}));

export default useConfiguratorStore;

// ── Individual selectors ──────────────────────────────────────────────────────
// Use these with useConfiguratorStore(selectX) to subscribe to a single slice.
// Because they return the value directly (not a new object/array), Zustand's
// default Object.is comparison works — no shallow needed for primitives.

export const selectBeads    = (s) => s.selectedBeads;
export const selectChain    = (s) => s.selectedChain;
export const selectCharms   = (s) => s.selectedCharms;
export const selectColor    = (s) => s.selectedColor;
export const selectMaterial = (s) => s.selectedMaterial;
export const selectPrice    = (s) => s.totalPrice;
export const selectCategory        = (s) => s.category;
export const selectIsHandViewActive = (s) => s.isHandViewActive;

// ── Compound shallow selector ─────────────────────────────────────────────────
// When a component needs several fields at once, use this to avoid subscribing
// to the entire store.  shallow compares each key individually so the component
// only re-renders when one of these values actually changes.
//
// Usage:
//   const { selectedBeads, selectedChain, totalPrice } = useConfiguratorDesign();

export const useConfiguratorDesign = () =>
  useConfiguratorStore(
    (s) => ({
      selectedBeads:    s.selectedBeads,
      selectedChain:    s.selectedChain,
      selectedCharms:   s.selectedCharms,
      selectedColor:    s.selectedColor,
      selectedMaterial: s.selectedMaterial,
      totalPrice:       s.totalPrice,
      braceletLength:   s.braceletLength,
      category:         s.category,
    }),
    shallow,
  );

// ── Viewer-specific shallow selector ─────────────────────────────────────────
// Subscribes only to the fields BraceletScene / JewelryViewer read.
// Components inside the Canvas can import this instead of the full store.
//
// Usage:
//   const { selectedBeads, editingBeadIndex } = useViewerState();

export const useViewerState = () =>
  useConfiguratorStore(
    (s) => ({
      selectedBeads:    s.selectedBeads,
      selectedChain:    s.selectedChain,
      selectedCharms:   s.selectedCharms,
      selectedColor:    s.selectedColor,
      editingBeadIndex: s.editingBeadIndex,
      openBeadEditor:   s.openBeadEditor,
    }),
    shallow,
  );
