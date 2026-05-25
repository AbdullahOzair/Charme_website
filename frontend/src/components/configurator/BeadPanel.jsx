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
        <div className="grid grid-cols-3 gap-2">
          {filtered.map((bead) => {
            const count = getCount(bead);
            const canAdd = !atMax || count > 0; // can still remove even at max

            return (
              <div
                key={bead.id}
                className={`relative flex flex-col items-center rounded-lg border p-2 text-center transition-all duration-150 ${
                  count > 0
                    ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                    : 'border-neutral-200 bg-white'
                }`}
              >
                {/* Thumbnail */}
                {bead.thumbnail ? (
                  <img
                    src={bead.thumbnail}
                    alt={bead.name}
                    className="w-10 h-10 object-cover rounded-md mb-1"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-md mb-1 border border-neutral-200"
                    style={{
                      backgroundColor: bead.color?.hex_code ?? '#e5e5e5',
                    }}
                  />
                )}

                <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-2 mb-0.5">
                  {bead.name}
                </p>
                <p className="text-xs text-neutral-500 mb-1">Rs. {bead.price}</p>

                {/* Quantity controls */}
                {count === 0 ? (
                  <button
                    onClick={() => addBead(bead)}
                    disabled={atMax}
                    className="w-full mt-0.5 text-xs py-1 rounded bg-neutral-900 text-white hover:bg-neutral-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + Add
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-1.5 mt-0.5 w-full">
                    <button
                      onClick={() => removeBead(bead)}
                      className="w-6 h-6 rounded bg-neutral-200 text-neutral-800 text-sm font-bold leading-none hover:bg-neutral-300 transition flex items-center justify-center"
                    >
                      −
                    </button>
                    <span className="text-xs font-semibold text-neutral-900 min-w-[1.25rem] text-center">
                      {count}
                    </span>
                    <button
                      onClick={() => addBead(bead)}
                      disabled={atMax}
                      className="w-6 h-6 rounded bg-neutral-900 text-white text-sm font-bold leading-none hover:bg-neutral-700 transition flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BeadPanel;
