// frontend/src/components/editor/BeadEditor.jsx
import { useState } from 'react';
import { X, Trash2 } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';
import useJewelryAssets from '../../hooks/useJewelryAssets';

const BeadEditor = () => {
  const editingBeadIndex  = useConfiguratorStore((s) => s.editingBeadIndex);
  const selectedBeads     = useConfiguratorStore((s) => s.selectedBeads);
  const replaceBeadAt     = useConfiguratorStore((s) => s.replaceBeadAt);
  const removeBead        = useConfiguratorStore((s) => s.removeBead);
  const setEditingBeadIndex = useConfiguratorStore((s) => s.setEditingBeadIndex);

  const { beads, loading } = useJewelryAssets();
  const [pendingBead, setPendingBead] = useState(null);

  if (editingBeadIndex === null) return null;

  const currentBead = selectedBeads[editingBeadIndex] ?? null;

  const handleClose = () => {
    setEditingBeadIndex(null);
    setPendingBead(null);
  };

  const handleConfirmSwap = () => {
    if (pendingBead) {
      replaceBeadAt(editingBeadIndex, pendingBead);
      setPendingBead(null);
    } else {
      handleClose();
    }
  };

  const handleRemove = () => {
    removeBead(editingBeadIndex);
    setPendingBead(null);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 16777272 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[82vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">
            Edit Bead {editingBeadIndex + 1} of {selectedBeads.length}
          </h2>
          <button
            onClick={handleClose}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current bead */}
        {currentBead && (
          <div className="px-5 py-3 bg-neutral-50 border-b border-neutral-100 flex-shrink-0">
            <p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Current</p>
            <div className="flex items-center gap-3">
              {currentBead.thumbnail ? (
                <img
                  src={currentBead.thumbnail}
                  alt={currentBead.name}
                  className="w-12 h-12 object-cover rounded-lg border border-neutral-200"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-neutral-200 border border-neutral-200" />
              )}
              <div>
                <p className="text-sm font-medium text-neutral-900">{currentBead.name}</p>
                <p className="text-xs text-neutral-500 mt-0.5">Rs. {currentBead.price}</p>
                {currentBead.material?.name && (
                  <p className="text-xs text-neutral-400">{currentBead.material.name}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selection hint */}
        <div className="px-5 pt-3 pb-1 flex-shrink-0">
          <p className="text-xs text-neutral-500 uppercase tracking-wider">
            {pendingBead
              ? `Swap with: ${pendingBead.name}`
              : 'Choose a replacement bead'}
          </p>
        </div>

        {/* Available beads grid */}
        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 pt-2">
              {beads.map((bead) => {
                const isChosen  = pendingBead?.id === bead.id;
                const isCurrent = currentBead?.id === bead.id;
                return (
                  <button
                    key={bead.id}
                    onClick={() => setPendingBead(isCurrent || isChosen ? null : bead)}
                    className={`relative flex flex-col items-center rounded-xl border p-2 text-center transition-all duration-150 ${
                      isChosen
                        ? 'border-neutral-900 ring-2 ring-neutral-900 bg-neutral-50'
                        : isCurrent
                        ? 'border-neutral-400 bg-neutral-100'
                        : 'border-neutral-200 bg-white hover:border-neutral-400 hover:bg-neutral-50'
                    }`}
                  >
                    {bead.thumbnail ? (
                      <img
                        src={bead.thumbnail}
                        alt={bead.name}
                        className="w-9 h-9 object-cover rounded-md mb-1"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-md bg-neutral-100 mb-1" />
                    )}
                    <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-1 w-full">
                      {bead.name}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">Rs. {bead.price}</p>
                    {isCurrent && !isChosen && (
                      <span className="absolute top-1.5 right-1.5 text-xs bg-neutral-300 text-neutral-700 rounded px-1 leading-none py-0.5">
                        cur
                      </span>
                    )}
                    {isChosen && (
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

        {/* Footer */}
        <div className="px-5 py-4 border-t border-neutral-100 flex items-center gap-2 flex-shrink-0 bg-white">
          <button
            onClick={handleRemove}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 text-red-600 text-xs font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </button>
          <div className="flex-1" />
          <button
            onClick={handleClose}
            className="px-3 py-2 rounded-lg text-xs text-neutral-600 font-medium hover:bg-neutral-100 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirmSwap}
            disabled={!pendingBead}
            className="px-4 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Confirm Swap
          </button>
        </div>
      </div>
    </div>
  );
};

export default BeadEditor;
