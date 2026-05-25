// frontend/src/components/configurator/LengthSelector.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const MIN = 14;
const MAX = 22;
const STEP = 0.5;
const DEFAULT_LENGTH = 18;
const QUICK_PICKS = [14, 16, 18, 20, 22];

// Linear mapping: 14 cm → 16 beads, 22 cm → 24 beads  (slope = 1)
const recommendedCount = (length) => Math.round(length + 2);

const LengthSelector = () => {
  const braceletLength  = useConfiguratorStore((s) => s.braceletLength);
  const selectedBeads   = useConfiguratorStore((s) => s.selectedBeads);
  const setSelectedBeads = useConfiguratorStore((s) => s.setSelectedBeads);

  const current     = braceletLength ?? DEFAULT_LENGTH;
  const recommended = recommendedCount(current);

  const applyLength = (value) => {
    useConfiguratorStore.setState({ braceletLength: value });
    const rec = recommendedCount(value);
    if (selectedBeads.length > rec) {
      setSelectedBeads(selectedBeads.slice(0, rec));
    }
  };

  const handleChange = (e) => applyLength(parseFloat(e.target.value));

  const beadCountLabel =
    selectedBeads.length > 0
      ? `${selectedBeads.length} / ${recommended}`
      : `~${recommended}`;

  const overLimit = selectedBeads.length > recommended;

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="text-xs text-neutral-500">{MIN} cm</span>
        <span className="text-sm font-semibold text-neutral-900 tabular-nums">
          {current.toFixed(1)} cm
        </span>
        <span className="text-xs text-neutral-500">{MAX} cm</span>
      </div>

      <input
        type="range"
        min={MIN}
        max={MAX}
        step={STEP}
        value={current}
        onChange={handleChange}
        className="w-full h-1.5 bg-neutral-200 rounded-full appearance-none cursor-pointer accent-neutral-900"
      />

      {/* Quick picks */}
      <div className="flex justify-between mt-2">
        {QUICK_PICKS.map((v) => (
          <button
            key={v}
            onClick={() => applyLength(v)}
            className={`text-xs px-1 py-0.5 rounded transition-colors ${
              current === v
                ? 'text-neutral-900 font-semibold underline underline-offset-2'
                : 'text-neutral-400 hover:text-neutral-700'
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      {/* Bead count recommendation */}
      <div className="mt-3 flex items-center justify-between bg-neutral-50 border border-neutral-100 rounded-lg px-3 py-2">
        <span className="text-xs text-neutral-500">Recommended beads</span>
        <span
          className={`text-xs font-semibold tabular-nums ${
            overLimit ? 'text-amber-700' : 'text-neutral-800'
          }`}
        >
          {beadCountLabel}
        </span>
      </div>
      {overLimit && (
        <p className="text-xs text-amber-600 mt-1.5">
          Trimmed to {recommended} beads to fit this length.
        </p>
      )}
    </div>
  );
};

export default LengthSelector;
