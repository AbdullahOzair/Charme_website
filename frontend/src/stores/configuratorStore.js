// frontend/src/stores/configuratorStore.js
import { create } from 'zustand';
import { shallow } from 'zustand/shallow';

// Max charms a customer can place on one bracelet.
export const MAX_CHARMS = 8;

// Unique id for a placed charm instance (duplicates of the same charm allowed).
const newInstanceId = () =>
  (globalThis.crypto?.randomUUID?.() ?? `charm_${Date.now()}_${Math.random().toString(36).slice(2)}`);

// Default angle (radians) for the Nth charm — evenly spread around the bracelet.
const defaultCharmAngle = (index) => (index / MAX_CHARMS) * Math.PI * 2;

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
  viewerBackground: '#0d0d1a',
  draggingCharmId:  null,
  charmRingColor:   'gold',   // 'gold' | 'silver' — hoop/jump-ring metal for all charms

  // ── Individual setters ──────────────────────────────────────────────────
  setCharmRingColor: (charmRingColor) => set({ charmRingColor }),
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
  setViewerBackground: (viewerBackground) => set({ viewerBackground }),

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

  // ── Charm placement ───────────────────────────────────────────────────────
  // Charms are stored as placed instances: { ...charm, instanceId, angle }.
  // Duplicates of the same charm are allowed (each is its own instance).
  addCharm: (charm, variant = null) =>
    set((state) => {
      if (state.selectedCharms.length >= MAX_CHARMS) return state;
      const instance = {
        ...charm,
        // Chosen color variant (if any) drives the image the viewer renders.
        image: variant?.image ?? charm.image,
        variantId: variant?.id ?? null,
        variantColorName: variant?.color_name ?? null,
        variantColorHex: variant?.color_hex ?? null,
        instanceId: newInstanceId(),
        angle: defaultCharmAngle(state.selectedCharms.length),
      };
      return { selectedCharms: [...state.selectedCharms, instance] };
    }),

  moveCharm: (instanceId, angle) =>
    set((state) => ({
      selectedCharms: state.selectedCharms.map((c) =>
        c.instanceId === instanceId && c.is_movable !== false ? { ...c, angle } : c,
      ),
    })),

  removeCharmInstance: (instanceId) =>
    set((state) => ({
      selectedCharms: state.selectedCharms.filter((c) => c.instanceId !== instanceId),
    })),

  // Refresh placed charms' shared config (size, ring, type, join point, variant
  // image) from the latest catalog so admin edits show up without re-adding.
  // Keeps each instance's placement (instanceId, angle) and chosen variant.
  syncPlacedCharms: (catalog) =>
    set((state) => {
      if (!state.selectedCharms.length || !catalog?.length) return state;
      const byId = new Map(catalog.map((c) => [c.id, c]));
      let changed = false;
      const next = state.selectedCharms.map((inst) => {
        const fresh = byId.get(inst.id);
        if (!fresh) return inst;
        const updated = {
          ...inst,
          name: fresh.name,
          price: fresh.price,
          size_mm: fresh.size_mm,
          charm_type: fresh.charm_type,
          is_movable: fresh.is_movable,
          jump_ring_color: fresh.jump_ring_color,
          anchor_x: fresh.anchor_x,
          anchor_y: fresh.anchor_y,
          variants: fresh.variants,
        };
        if (inst.variantId) {
          const v = (fresh.variants ?? []).find((x) => x.id === inst.variantId);
          if (v) {
            updated.image = v.image;
            updated.variantColorHex = v.color_hex;
            updated.variantColorName = v.color_name;
          }
        } else {
          updated.image = fresh.image;
        }
        if (
          updated.size_mm !== inst.size_mm ||
          updated.jump_ring_color !== inst.jump_ring_color ||
          updated.charm_type !== inst.charm_type ||
          updated.is_movable !== inst.is_movable ||
          updated.anchor_x !== inst.anchor_x ||
          updated.anchor_y !== inst.anchor_y ||
          updated.image !== inst.image
        ) {
          changed = true;
        }
        return updated;
      });
      return changed ? { selectedCharms: next } : state;
    }),

  setDraggingCharmId: (draggingCharmId) => set({ draggingCharmId }),

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
      viewerBackground: '#0d0d1a',
      draggingCharmId:  null,
      charmRingColor:   'gold',
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
