// frontend/src/components/editor/CharmEditor.jsx
import { X, ChevronUp } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';
import useJewelryAssets from '../../hooks/useJewelryAssets';

const MAX_CHARMS = 5;

const CharmEditor = ({ onClose }) => {
  const selectedCharms  = useConfiguratorStore((s) => s.selectedCharms);
  const setSelectedCharms = useConfiguratorStore((s) => s.setSelectedCharms);
  const removeCharm     = useConfiguratorStore((s) => s.removeCharm);

  const { charms, loading } = useJewelryAssets();

  const atMax   = selectedCharms.length >= MAX_CHARMS;
  const isAdded = (charm) => selectedCharms.some((c) => c.id === charm.id);

  const handleAdd = (charm) => {
    if (!isAdded(charm) && !atMax) {
      setSelectedCharms([...selectedCharms, charm]);
    }
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
              atMax
                ? 'bg-amber-100 text-amber-700'
                : 'bg-neutral-100 text-neutral-600'
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
        {/* Max warning */}
        {atMax && (
          <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Maximum {MAX_CHARMS} charms reached. Remove one to add another.
          </div>
        )}

        {/* Selected charms row */}
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            Selected
          </p>
          {selectedCharms.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No charms added yet.
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {selectedCharms.map((charm, index) => {
                const thumb = charm.thumbnail || charm.preview_image;
                return (
                  <div
                    key={`${charm.id}-${index}`}
                    className="relative flex flex-col items-center gap-1 bg-neutral-50 border border-neutral-200 rounded-xl p-2"
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={charm.name}
                        className="w-10 h-10 object-contain rounded-md"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-md bg-neutral-200" />
                    )}
                    <p className="text-xs text-neutral-700 leading-tight text-center line-clamp-1 max-w-[60px]">
                      {charm.name}
                    </p>
                    {/* Remove button */}
                    <button
                      onClick={() => removeCharm(index)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-neutral-900 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors"
                      aria-label={`Remove ${charm.name}`}
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Available charms grid */}
        <div>
          <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">
            Available Charms
          </p>
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            </div>
          ) : charms.length === 0 ? (
            <p className="text-xs text-neutral-400 italic">
              No charms available.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {charms.map((charm) => {
                const added = isAdded(charm);
                const thumb = charm.thumbnail || charm.preview_image;
                return (
                  <button
                    key={charm.id}
                    onClick={() => handleAdd(charm)}
                    disabled={added || atMax}
                    className={`relative flex flex-col items-center rounded-xl border p-2 text-center transition-all duration-150 disabled:cursor-not-allowed ${
                      added
                        ? 'border-neutral-900 ring-1 ring-neutral-900 bg-neutral-50 opacity-60'
                        : atMax
                        ? 'border-neutral-200 bg-white opacity-40'
                        : 'border-neutral-200 bg-white hover:border-neutral-500 hover:bg-neutral-50'
                    }`}
                  >
                    {thumb ? (
                      <img
                        src={thumb}
                        alt={charm.name}
                        className="w-9 h-9 object-contain rounded-md mb-1"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-neutral-100 mb-1" />
                    )}
                    <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-2">
                      {charm.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Rs. {charm.price}
                    </p>
                    {added && (
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
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
