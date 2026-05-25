// frontend/src/pages/Configurator.jsx
import { useState, useRef } from 'react';
import { RotateCcw, X } from 'lucide-react';
import toast from 'react-hot-toast';
import useConfiguratorStore from '../stores/configuratorStore';
import useJewelryAssets from '../hooks/useJewelryAssets';
import ConfiguratorSidebar from '../components/configurator/ConfiguratorSidebar';
import AIPromptInput from '../components/configurator/AIPromptInput';
import EditToolbar from '../components/editor/EditToolbar';
import BraceletReorder from '../components/editor/BraceletReorder';
import BeadEditor from '../components/editor/BeadEditor';
import CharmEditor from '../components/editor/CharmEditor';
import SaveDesignModal from '../components/configurator/SaveDesignModal';
import AddToCartButton from '../components/configurator/AddToCartButton';
import JewelryViewer from '../components/viewer/JewelryViewer';
import ChainSelector from '../components/configurator/ChainSelector';

// ── Chain picker modal (self-contained, fetches its own chain list) ─────────
const ChainPickerModal = ({ onClose }) => {
  const { chains, loading } = useJewelryAssets();

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 16777272 }}>
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 max-h-[80vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">
            Select Chain
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 transition-colors"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-5 h-5 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            </div>
          ) : (
            <ChainSelector chains={chains} />
          )}
        </div>

        <div className="px-5 py-4 border-t border-neutral-100 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Main page ───────────────────────────────────────────────────────────────
const Configurator = () => {
  const {
    resetDesign,
    isGenerating,
    editingBeadIndex,
  } = useConfiguratorStore();

  const [showSaveModal,   setShowSaveModal]   = useState(false);
  const [showReorder,     setShowReorder]     = useState(false);
  const [showCharmEditor, setShowCharmEditor] = useState(false);
  const [showChainPicker, setShowChainPicker] = useState(false);

  // Points to the <main> element wrapping the 3D viewer.
  // useCanvasCapture (inside SaveDesignModal) finds the <canvas> inside it.
  const viewerContainerRef = useRef(null);
  const asideRef           = useRef(null);

  const handleReset = () => {
    resetDesign();
    setShowReorder(false);
    setShowCharmEditor(false);
    toast.success('Design reset');
  };

  // Scroll the sidebar to roughly where the Beads section lives
  const handleOpenBeadPanel = () => {
    if (asideRef.current) {
      asideRef.current.scrollTo({ top: 420, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-30 bg-white border-b border-neutral-200 shadow-sm">
        <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-sm font-semibold text-neutral-900 tracking-widest uppercase truncate">
              Jewelry Configurator
            </h1>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Build your custom Charmé bracelet
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Reset */}
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-600 border border-neutral-300 rounded-md hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>

            {/* Add to Cart — triggers SaveDesignModal if no savedDesignId yet */}
            <AddToCartButton onNeedSave={() => setShowSaveModal(true)} />

            {/* Save Design */}
            <button
              onClick={() => setShowSaveModal(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-neutral-900 rounded-md hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Design
            </button>
          </div>
        </div>
      </header>

      {/* ── AI Prompt ── */}
      <AIPromptInput />

      {/* ── Edit Toolbar ── */}
      <EditToolbar
        showReorder={showReorder}
        onReorderBeads={() => setShowReorder((v) => !v)}
        onAddCharm={() => {
          setShowCharmEditor((v) => !v);
          setTimeout(() => {
            if (asideRef.current) {
              asideRef.current.scrollTo({
                top: asideRef.current.scrollHeight,
                behavior: 'smooth',
              });
            }
          }, 80);
        }}
        onChangeChain={() => setShowChainPicker(true)}
      />

      {/* ── Bead Reorder strip (collapsible) ── */}
      {showReorder && (
        <BraceletReorder onOpenBeadPanel={handleOpenBeadPanel} />
      )}

      {/* ── Main Layout ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside
          ref={asideRef}
          className="w-72 xl:w-80 flex-shrink-0 bg-white border-r border-neutral-200 overflow-y-auto"
        >
          <div className="p-4">
            <ConfiguratorSidebar />
          </div>

          {/* Charm editor docked at bottom of sidebar */}
          {showCharmEditor && (
            <CharmEditor onClose={() => setShowCharmEditor(false)} />
          )}
        </aside>

        {/* Right Panel — 3D Viewer
            pointer-events-none while any modal is open so the canvas cannot
            intercept clicks meant for the modal buttons above it. */}
        <main
          ref={viewerContainerRef}
          className={`flex-1 relative overflow-hidden min-h-[500px]${
            editingBeadIndex !== null || showChainPicker || showSaveModal
              ? ' pointer-events-none'
              : ''
          }`}
        >
          <div className="absolute inset-0 w-full h-full">
            <JewelryViewer />
          </div>
        </main>
      </div>

      {/* ── Bead Editor modal ── */}
      {editingBeadIndex !== null && <BeadEditor />}

      {/* ── Chain Picker modal ── */}
      {showChainPicker && (
        <ChainPickerModal onClose={() => setShowChainPicker(false)} />
      )}

      {/* ── Save Design modal ── */}
      {showSaveModal && (
        <SaveDesignModal
          canvasRef={viewerContainerRef}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  );
};

export default Configurator;
