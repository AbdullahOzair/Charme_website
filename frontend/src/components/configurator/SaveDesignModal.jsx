// frontend/src/components/configurator/SaveDesignModal.jsx
import { useState, useEffect } from 'react';
import { X, Save, CheckCircle, AlertCircle, ImageOff } from 'lucide-react';
import toast from 'react-hot-toast';
import useConfiguratorStore from '../../stores/configuratorStore';
import useCanvasCapture from '../../hooks/useCanvasCapture';
import { saveDesign } from '../../services/designService';

const SaveDesignModal = ({ canvasRef, onClose }) => {
  const {
    category,
    braceletLength,
    selectedBeads,
    selectedChain,
    selectedCharms,
    selectedMaterial,
    selectedColor,
    totalPrice,
  } = useConfiguratorStore();

  const { capturePreview } = useCanvasCapture(canvasRef);

  const defaultName = `Design ${new Date().toLocaleDateString('en-PK')}`;
  const [name,        setName]        = useState(defaultName);
  const [previewUrl,  setPreviewUrl]  = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [savedId,     setSavedId]     = useState(null);
  const [error,       setError]       = useState('');

  // Capture the 3D canvas preview on mount (slight delay to let the frame render)
  useEffect(() => {
    const timer = setTimeout(() => {
      const url = capturePreview();
      setPreviewUrl(url);
    }, 180);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Please enter a name for your design.');
      return;
    }
    if (!selectedBeads.length && !selectedChain && !selectedCharms.length) {
      setError('Add at least one bead, chain, or charm before saving.');
      return;
    }

    setError('');
    setSaving(true);

    const config_json = {
      category:        category?.id ?? null,
      braceletLength:  braceletLength ?? null,
      selectedBeads:   selectedBeads.map((b) => b.id),
      selectedChain:   selectedChain?.id ?? null,
      selectedCharms:  selectedCharms.map((c) => c.id),
      selectedMaterial: selectedMaterial?.id ?? null,
      selectedColor:    selectedColor?.id ?? null,
    };

    try {
      const result = await saveDesign({
        name: name.trim(),
        config_json,
        total_price: totalPrice,
        preview_image_base64: previewUrl ?? '',
      });

      // Persist design ID globally so AddToCartButton can use it immediately
      useConfiguratorStore.setState({ savedDesignId: result.id });
      setSavedId(result.id);
      toast.success('Design saved!');
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? 'Please log in to save your design.'
          : err.response?.data?.detail ??
            err.response?.data?.error ??
            err.message ??
            'Failed to save design.';
      setError(msg);
      console.error('SaveDesignModal:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') onClose();
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex: 16777272 }}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!saving ? onClose : undefined}
      />

      {/* Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h2 className="text-xs font-semibold text-neutral-900 uppercase tracking-widest">
            Save Design
          </h2>
          <button
            onClick={onClose}
            disabled={saving}
            className="text-neutral-400 hover:text-neutral-700 transition-colors disabled:opacity-40"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 py-5 space-y-4">
          {/* ── Success state ── */}
          {savedId ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <CheckCircle className="w-10 h-10 text-green-500" />
              <div>
                <p className="text-sm font-semibold text-neutral-900">Saved!</p>
                <p className="text-xs text-neutral-500 mt-1">
                  Design #{savedId} — "{name}"
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-2 px-5 py-2 bg-neutral-900 text-white text-xs font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <>
              {/* ── Canvas preview ── */}
              <div className="rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 aspect-video flex items-center justify-center">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Design preview"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-neutral-400">
                    <ImageOff className="w-6 h-6" />
                    <span className="text-xs">Capturing preview…</span>
                  </div>
                )}
              </div>

              {/* ── Design name input ── */}
              <div>
                <label
                  htmlFor="design-name"
                  className="block text-xs font-medium text-neutral-700 mb-1.5"
                >
                  Design name
                </label>
                <input
                  id="design-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  maxLength={200}
                  disabled={saving}
                  placeholder="e.g. Midnight Luxury Bracelet"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent disabled:opacity-50 disabled:bg-neutral-50 transition-colors"
                />
              </div>

              {/* ── Price summary ── */}
              <div className="flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
                <span className="text-xs text-neutral-500">Total price</span>
                <span className="text-sm font-semibold text-neutral-900">
                  Rs. {Number(totalPrice).toLocaleString('en-PK')}
                </span>
              </div>

              {/* ── Error ── */}
              {error && (
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* ── Actions ── */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={onClose}
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg text-xs font-medium text-neutral-600 border border-neutral-200 hover:bg-neutral-100 transition-colors disabled:opacity-40"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      Save Design
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default SaveDesignModal;
