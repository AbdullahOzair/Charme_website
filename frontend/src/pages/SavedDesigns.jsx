// frontend/src/pages/SavedDesigns.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShoppingBag, Edit2, Loader2, ImageOff, Package } from 'lucide-react';
import toast from 'react-hot-toast';
import useConfiguratorStore from '../stores/configuratorStore';
import useJewelryAssets from '../hooks/useJewelryAssets';
import { getSavedDesigns, addToCart } from '../services/designService';

// ── Status badge ─────────────────────────────────────────────────────────────
const STATUS_STYLES = {
  draft:   'bg-neutral-100 text-neutral-600',
  saved:   'bg-green-100 text-green-700',
  ordered: 'bg-blue-100 text-blue-700',
};

const StatusBadge = ({ status }) => (
  <span
    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${
      STATUS_STYLES[status] ?? STATUS_STYLES.draft
    }`}
  >
    {status}
  </span>
);

// ── Single design card ────────────────────────────────────────────────────────
const DesignCard = ({ design, onEdit, onAddToCart, addingId }) => {
  const isAdding = addingId === design.id;
  const canCart  = design.status === 'saved' || design.status === 'draft';

  const dateStr = new Date(design.created_at).toLocaleDateString('en-PK', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <div className="bg-white rounded-2xl border border-neutral-200 overflow-hidden flex flex-col shadow-sm hover:shadow-md transition-shadow">
      {/* Preview image */}
      <div className="aspect-video bg-neutral-100 flex items-center justify-center overflow-hidden">
        {design.preview_image ? (
          <img
            src={design.preview_image}
            alt={design.name}
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-300">
            <ImageOff className="w-8 h-8" />
            <span className="text-xs">No preview</span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col gap-2 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2">
            {design.name}
          </h3>
          <StatusBadge status={design.status} />
        </div>

        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>Rs. {Number(design.total_price).toLocaleString('en-PK')}</span>
          <span>{dateStr}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto pt-2">
          <button
            onClick={() => onEdit(design)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:border-neutral-400 transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>

          <button
            onClick={() => onAddToCart(design)}
            disabled={!canCart || isAdding}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-semibold hover:bg-neutral-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={!canCart ? 'Already ordered' : 'Add to cart'}
          >
            {isAdding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <ShoppingBag className="w-3.5 h-3.5" />
            )}
            {!canCart ? 'Ordered' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Page ─────────────────────────────────────────────────────────────────────
const SavedDesigns = () => {
  const navigate = useNavigate();
  const { beads, chains, charms, materials, colors, loading: assetsLoading } =
    useJewelryAssets();

  const [designs,   setDesigns]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [addingId,  setAddingId]  = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getSavedDesigns();
        setDesigns(Array.isArray(data) ? data : (data.results ?? []));
      } catch (err) {
        setError(
          err.response?.status === 401
            ? 'Please log in to view your saved designs.'
            : err.response?.data?.detail ?? 'Failed to load saved designs.',
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  // Reload the selected design into the Zustand configurator store and navigate
  const handleEdit = (design) => {
    const cfg = design.config_json ?? {};

    const fullBeads = (cfg.selectedBeads ?? [])
      .map((id) => beads.find((b) => b.id === id))
      .filter(Boolean);

    const fullChain = cfg.selectedChain
      ? (chains.find((c) => c.id === cfg.selectedChain) ?? null)
      : null;

    const fullCharms = (cfg.selectedCharms ?? [])
      .map((id) => charms.find((c) => c.id === id))
      .filter(Boolean);

    const fullMaterial = cfg.selectedMaterial
      ? (materials.find((m) => m.id === cfg.selectedMaterial) ?? null)
      : null;

    const fullColor = cfg.selectedColor
      ? (colors.find((c) => c.id === cfg.selectedColor) ?? null)
      : null;

    useConfiguratorStore.setState({
      selectedBeads:    fullBeads,
      selectedChain:    fullChain,
      selectedCharms:   fullCharms,
      selectedMaterial: fullMaterial,
      selectedColor:    fullColor,
      braceletLength:   cfg.braceletLength ?? null,
      totalPrice:       parseFloat(design.total_price) || 0,
      savedDesignId:    design.id,
      editingBeadIndex: null,
    });

    navigate('/configurator');
  };

  const handleAddToCart = async (design) => {
    setAddingId(design.id);
    try {
      await addToCart(design.id);
      toast.success('Added to cart!');
      navigate('/cart');
    } catch (err) {
      const msg =
        err.response?.status === 401
          ? 'Please log in to add items to cart.'
          : err.response?.data?.detail ?? 'Failed to add to cart.';
      toast.error(msg);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* ── Page header ── */}
      <div className="bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-2xl font-semibold text-neutral-900 tracking-tight">
            Saved Designs
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Your custom Charmé bracelet designs
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading */}
        {(loading || assetsLoading) && (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-7 h-7 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
            <p className="text-sm text-neutral-400">Loading your designs…</p>
          </div>
        )}

        {/* Error */}
        {!loading && !assetsLoading && error && (
          <div className="max-w-md mx-auto mt-10 rounded-xl border border-red-200 bg-red-50 p-5 text-center">
            <p className="text-sm font-medium text-red-700">{error}</p>
          </div>
        )}

        {/* Empty */}
        {!loading && !assetsLoading && !error && designs.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <Package className="w-12 h-12 text-neutral-300" />
            <div>
              <p className="text-base font-medium text-neutral-700">No saved designs yet</p>
              <p className="text-sm text-neutral-400 mt-1">
                Head to the configurator to build your first custom bracelet.
              </p>
            </div>
            <button
              onClick={() => navigate('/configurator')}
              className="mt-2 px-5 py-2 bg-neutral-900 text-white text-sm font-semibold rounded-lg hover:bg-neutral-700 transition-colors"
            >
              Open Configurator
            </button>
          </div>
        )}

        {/* Grid */}
        {!loading && !assetsLoading && !error && designs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {designs.map((design) => (
              <DesignCard
                key={design.id}
                design={design}
                onEdit={handleEdit}
                onAddToCart={handleAddToCart}
                addingId={addingId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDesigns;
