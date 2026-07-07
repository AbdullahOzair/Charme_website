// frontend/src/components/editor/CharmEditor.jsx
import { X, ChevronUp, ChevronLeft, ChevronRight, Lock, Move } from 'lucide-react';
import useConfiguratorStore, { MAX_CHARMS } from '../../stores/configuratorStore';
import useJewelryAssets from '../../hooks/useJewelryAssets';

const defaultVariant = (charm) => {
  const vs = charm.variants ?? [];
  return vs.find((v) => v.is_default) ?? vs[0] ?? null;
};

const safeHex = (h) => (/^#[0-9a-f]{6}$/i.test(h ?? '') ? h : '#cccccc');

const CharmEditor = ({ onClose }) => {
  const selectedCharms     = useConfiguratorStore((s) => s.selectedCharms);
  const selectedBeads      = useConfiguratorStore((s) => s.selectedBeads);
  const addCharm           = useConfiguratorStore((s) => s.addCharm);
  const moveCharm          = useConfiguratorStore((s) => s.moveCharm);
  const removeCharmInstance = useConfiguratorStore((s) => s.removeCharmInstance);

  const { charms, loading } = useJewelryAssets();

  const atMax = selectedCharms.length >= MAX_CHARMS;

  // One ◄/► press moves the charm to the next/previous gap between beads.
  const nudge = (charm, dir) => {
    const n = selectedBeads.length || 1;
    const step = (Math.PI * 2) / n;
    moveCharm(charm.instanceId, (charm.angle ?? 0) + dir * step);
  };

  return (
    <div className="border-t-2 border-neutral-200 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-neutral-700 uppercase tracking-widest">
            Charm Editor
          </h3>
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              atMax ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
            }`}
          >
            {selectedCharms.length}/{MAX_CHARMS}
          </span>
        </div>
        <button
          onClick={onClose}
          className="text-neutral-400 hover:text-neutral-700 transition-colors"
          aria-label="Close charm editor"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      <div className="px-4 py-4 space-y-4">
        {atMax && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Maximum {MAX_CHARMS} charms reached. Remove one to add another.
          </div>
        )}

        {/* Selected charms with position controls */}
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Placed</p>
          {selectedCharms.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No charms added yet.</p>
          ) : (
            <div className="space-y-2">
              {selectedCharms.map((charm) => {
                const thumb = charm.image || charm.thumbnail || charm.preview_image;
                const movable = charm.is_movable !== false;
                return (
                  <div
                    key={charm.instanceId}
                    className="flex items-center gap-3 bg-neutral-50 border border-neutral-200 rounded-xl p-2"
                  >
                    {thumb ? (
                      <img src={thumb} alt={charm.name} className="w-9 h-9 object-contain rounded-md flex-shrink-0" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-neutral-200 flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-neutral-700 leading-tight line-clamp-1 flex items-center gap-1.5">
                        {charm.variantColorHex && (
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black/10 flex-shrink-0"
                            style={{ backgroundColor: safeHex(charm.variantColorHex) }}
                            title={charm.variantColorName ?? ''}
                          />
                        )}
                        {charm.name}
                      </p>
                      <p className="text-[10px] text-neutral-400 flex items-center gap-1">
                        {movable ? <Move className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                        {movable ? 'drag on bracelet or use arrows' : 'fixed position'}
                      </p>
                    </div>

                    {movable && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => nudge(charm, -1)}
                          className="w-7 h-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                          aria-label="Move charm left"
                        >
                          <ChevronLeft className="w-4 h-4 text-neutral-700" />
                        </button>
                        <button
                          onClick={() => nudge(charm, 1)}
                          className="w-7 h-7 rounded-md bg-white border border-neutral-200 flex items-center justify-center hover:bg-neutral-100 transition-colors"
                          aria-label="Move charm right"
                        >
                          <ChevronRight className="w-4 h-4 text-neutral-700" />
                        </button>
                      </div>
                    )}

                    <button
                      onClick={() => removeCharmInstance(charm.instanceId)}
                      className="w-6 h-6 bg-neutral-900 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors flex-shrink-0"
                      aria-label={`Remove ${charm.name}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available charms grid */}
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Available Charms</p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            </div>
          ) : charms.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">No charms available.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {charms.map((charm) => {
                const dv = defaultVariant(charm);
                const thumb = dv?.image || charm.thumbnail || charm.preview_image || charm.image;
                return (
                  <button
                    key={charm.id}
                    onClick={() => addCharm(charm, dv)}
                    disabled={atMax}
                    className={`relative flex flex-col items-center rounded-xl border p-2 text-center transition-all duration-150 disabled:cursor-not-allowed ${
                      atMax
                        ? 'border-neutral-200 bg-white opacity-40'
                        : 'border-neutral-200 bg-white hover:border-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {thumb ? (
                      <img src={thumb} alt={charm.name} className="w-9 h-9 object-contain rounded-md mb-1" />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-neutral-100 mb-1" />
                    )}
                    <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-2">
                      {charm.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">Rs. {charm.price}</p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharmEditor;
