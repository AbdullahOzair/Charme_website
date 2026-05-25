// frontend/src/components/editor/BraceletReorder.jsx
import { useRef } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';

const MAX_BEADS = 20;

const BraceletReorder = ({ onOpenBeadPanel }) => {
  const selectedBeads = useConfiguratorStore((s) => s.selectedBeads);
  const reorderBeads  = useConfiguratorStore((s) => s.reorderBeads);
  const dragFrom      = useRef(null);
  const dragOver      = useRef(null);

  const handleDragStart = (e, index) => {
    dragFrom.current = index;
    e.dataTransfer.effectAllowed = 'move';
    // Tiny delay so drag image renders before ghost is captured
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('opacity-50');
    dragFrom.current = null;
    dragOver.current = null;
  };

  const handleDragEnter = (index) => {
    dragOver.current = index;
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (dragFrom.current !== null && dragFrom.current !== toIndex) {
      reorderBeads(dragFrom.current, toIndex);
    }
    dragFrom.current = null;
    dragOver.current = null;
  };

  return (
    <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-2.5">
      {/* Row header */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-neutral-700 uppercase tracking-widest">
          Bead Order
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            selectedBeads.length >= MAX_BEADS
              ? 'bg-amber-100 text-amber-700'
              : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {selectedBeads.length}/{MAX_BEADS}
        </span>
        <span className="text-xs text-neutral-400 hidden sm:inline">
          — drag to reorder
        </span>
      </div>

      {/* Horizontal scroll row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {selectedBeads.length === 0 ? (
          <p className="text-xs text-neutral-400 italic py-1 pr-2">
            No beads selected yet.
          </p>
        ) : (
          selectedBeads.map((bead, index) => (
            <div
              key={`${bead.id}-${index}`}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragEnd={handleDragEnd}
              onDragEnter={() => handleDragEnter(index)}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, index)}
              className="flex-shrink-0 flex items-center gap-1.5 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1.5 cursor-grab active:cursor-grabbing select-none hover:border-neutral-400 transition-colors"
            >
              <GripVertical className="w-3 h-3 text-neutral-300 flex-shrink-0" />
              {bead.thumbnail ? (
                <img
                  src={bead.thumbnail}
                  alt={bead.name}
                  draggable={false}
                  className="w-7 h-7 object-cover rounded-md flex-shrink-0"
                />
              ) : (
                <div className="w-7 h-7 rounded-md bg-neutral-200 flex-shrink-0" />
              )}
              <span className="text-xs text-neutral-500 w-4 text-center font-medium tabular-nums leading-none">
                {index + 1}
              </span>
            </div>
          ))
        )}

        {/* Add bead button */}
        {selectedBeads.length < MAX_BEADS && (
          <button
            onClick={onOpenBeadPanel}
            title="Add bead"
            className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-lg border-2 border-dashed border-neutral-300 text-neutral-400 hover:border-neutral-600 hover:text-neutral-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default BraceletReorder;
