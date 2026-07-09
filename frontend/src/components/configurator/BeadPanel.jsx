// frontend/src/components/configurator/BeadPanel.jsx
import { useState } from 'react';
import useConfiguratorStore from '../../stores/configuratorStore';

// Must match the formula in LengthSelector.jsx
const DEFAULT_LENGTH = 18;
const maxBeadsForLength = (length) => Math.round(length + 2);

const BeadPanel = ({ beads, materials, colors }) => {
  const selectedBeads  = useConfiguratorStore((s) => s.selectedBeads);
  const braceletLength = useConfiguratorStore((s) => s.braceletLength);
  const [filterMaterial, setFilterMaterial] = useState('');
  const [filterColor, setFilterColor] = useState('');

  const maxBeads = maxBeadsForLength(braceletLength ?? DEFAULT_LENGTH);

  const filtered = beads.filter((b) => {
    const matId = String(b.material?.id ?? b.material ?? '');
    const colId = String(b.color?.id ?? b.color ?? '');
    const matchMaterial = !filterMaterial || matId === filterMaterial;
    const matchColor = !filterColor || colId === filterColor;
    return matchMaterial && matchColor;
  });

  const getCount = (bead) => selectedBeads.filter((b) => b.id === bead.id).length;

  const addBead = (bead) => {
    if (selectedBeads.length < maxBeads) {
      useConfiguratorStore.setState({ selectedBeads: [...selectedBeads, bead] });
    }
  };

  const removeBead = (bead) => {
    const next = [...selectedBeads];
    const idx = next.map((b) => b.id).lastIndexOf(bead.id);
    if (idx !== -1) {
      next.splice(idx, 1);
      useConfiguratorStore.setState({ selectedBeads: next });
    }
  };

  const atMax = selectedBeads.length >= maxBeads;

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-2 mb-3">
        <select
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
          className="flex-1 text-xs border border-neutral-200 rounded-md px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-neutral-500"
        >
          <option value="">All Materials</option>
          {materials.map((m) => (
            <option key={m.id} value={String(m.id)}>{m.name}</option>
          ))}
        </select>
        <select
          value={filterColor}
          onChange={(e) => setFilterColor(e.target.value)}
          className="flex-1 text-xs border border-neutral-200 rounded-md px-2 py-1.5 bg-white text-neutral-700 focus:outline-none focus:border-neutral-500"
        >
          <option value="">All Colors</option>
          {colors.map((c) => (
            <option key={c.id} value={String(c.id)}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Count badge */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">{filtered.length} beads</span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            atMax ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {selectedBeads.length}/{maxBeads} selected
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-4 text-center">
          No beads match the current filters.
        </p>
      ) : (
        <div className="config-scroll grid grid-cols-3 gap-2 max-h-[46vh] overflow-y-auto pr-1">
          {filtered.map((bead) => {
            const count = getCount(bead);

            return (
              <div
                key={bead.id}
                className={`group relative flex flex-col rounded-lg border p-2 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  count > 0
                    ? 'border-[#B76E79] ring-2 ring-[#B76E79] bg-[#FBF3F4]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Image area — the visual anchor of the card */}
                {(bead.image || bead.thumbnail) ? (
                  <img
                    src={bead.image || bead.thumbnail}
                    alt={bead.name}
                    className="w-full aspect-square object-contain rounded-md mb-1.5 bg-white border border-neutral-100"
                  />
                ) : (
                  <div
                    className="w-full aspect-square rounded-md mb-1.5 border border-neutral-100"
                    style={{ backgroundColor: bead.color?.hex_code ?? '#e5e5e5' }}
                  />
                )}

                <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-2">
                  {bead.name}
                </p>
                <p className="text-[11px] text-neutral-500 mb-1.5">Rs. {bead.price}</p>

                <div className="mt-auto">
                  {count === 0 ? (
                    <button
                      onClick={() => addBead(bead)}
                      disabled={atMax}
                      className="w-full py-1.5 text-xs font-semibold rounded-md bg-neutral-900 text-white hover:bg-neutral-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-1 w-full">
                      <button
                        onClick={() => removeBead(bead)}
                        aria-label={`Remove ${bead.name}`}
                        className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-800 text-base font-bold leading-none hover:bg-neutral-200 transition flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold text-neutral-900 min-w-[1.25rem] text-center">
                        {count}
                      </span>
                      <button
                        onClick={() => addBead(bead)}
                        disabled={atMax}
                        aria-label={`Add ${bead.name}`}
                        className="w-8 h-8 rounded-md bg-neutral-900 text-white text-base font-bold leading-none hover:bg-neutral-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BeadPanel;
