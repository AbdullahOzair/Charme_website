// frontend/src/components/configurator/CharmPanel.jsx
import { useState } from 'react';
import useConfiguratorStore, { MAX_CHARMS } from '../../stores/configuratorStore';

const TYPE_LABEL = {
  dangle: 'Dangle',
  inline: 'Inline',
  clip:   'Clip',
};

// Tolerate bad/blank hex values so a swatch always shows something.
const safeHex = (h) => (/^#[0-9a-f]{6}$/i.test(h ?? '') ? h : '#cccccc');

// Color options for a charm = its OWN image (base) + each color variant.
const buildOptions = (charm) => {
  const opts = [];
  if (charm.image) {
    opts.push({
      key: `base-${charm.id}`,
      isBase: true,
      color_name: charm.color?.name ?? 'Original',
      color_hex: charm.color?.hex_code ?? '#cccccc',
      image: charm.image,
    });
  }
  for (const v of charm.variants ?? []) {
    opts.push({
      key: `v-${v.id}`,
      isBase: false,
      variant: v,
      color_name: v.color_name,
      color_hex: v.color_hex,
      image: v.image,
    });
  }
  return opts;
};

// Default selected option: the variant marked default, else the base image, else first.
const defaultOptionKey = (charm, options) => {
  const dv = (charm.variants ?? []).find((v) => v.is_default);
  if (dv) return `v-${dv.id}`;
  return options[0]?.key ?? null;
};

const RING_OPTIONS = [
  { value: 'gold',   label: 'Gold',   swatch: 'linear-gradient(135deg,#f4d47a,#d4af37)' },
  { value: 'silver', label: 'Silver', swatch: 'linear-gradient(135deg,#eef1f3,#b9c0c6)' },
];

const CharmPanel = ({ charms }) => {
  const selectedCharms      = useConfiguratorStore((s) => s.selectedCharms);
  const addCharm            = useConfiguratorStore((s) => s.addCharm);
  const removeCharmInstance = useConfiguratorStore((s) => s.removeCharmInstance);
  const charmRingColor      = useConfiguratorStore((s) => s.charmRingColor);
  const setCharmRingColor   = useConfiguratorStore((s) => s.setCharmRingColor);

  // Selected color-option key per charm id (defaults resolved lazily below).
  const [chosenOption, setChosenOption] = useState({});

  const atMax = selectedCharms.length >= MAX_CHARMS;
  const countOf = (charm) => selectedCharms.filter((c) => c.id === charm.id).length;

  // Remove the most recently added instance of this charm.
  const removeOne = (charm) => {
    const matches = selectedCharms.filter((c) => c.id === charm.id);
    const last = matches[matches.length - 1];
    if (last) removeCharmInstance(last.instanceId);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-neutral-500">
          {charms ? charms.length : 0} charms
        </span>
        <span
          className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            atMax ? 'bg-amber-100 text-amber-700' : 'bg-neutral-100 text-neutral-600'
          }`}
        >
          {selectedCharms.length}/{MAX_CHARMS} added
        </span>
      </div>

      {atMax && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-2">
          Maximum {MAX_CHARMS} charms reached. Remove one to add another.
        </p>
      )}

      {/* Jump-ring metal for all charms */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-neutral-500">Jump ring:</span>
        <div className="flex gap-1.5">
          {RING_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setCharmRingColor(opt.value)}
              title={opt.label}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full border text-xs transition-colors ${
                charmRingColor === opt.value
                  ? 'border-neutral-900 ring-1 ring-neutral-900 text-neutral-900'
                  : 'border-neutral-200 text-neutral-500 hover:border-neutral-400'
              }`}
            >
              <span
                className="w-3.5 h-3.5 rounded-full border border-black/10"
                style={{ background: opt.swatch }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {!charms || charms.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-4 text-center">
          No charms available.
        </p>
      ) : (
        <div className="config-scroll grid grid-cols-3 gap-2 max-h-[46vh] overflow-y-auto pr-1">
          {charms.map((charm) => {
            const count = countOf(charm);
            const options = buildOptions(charm);
            const selKey = chosenOption[charm.id] ?? defaultOptionKey(charm, options);
            const opt = options.find((o) => o.key === selKey) ?? options[0] ?? null;
            const thumb = opt?.image || charm.thumbnail || charm.preview_image || charm.image;
            const addSelected = () => addCharm(charm, opt?.isBase ? null : opt?.variant ?? null);
            return (
              <div
                key={charm.id}
                className={`group relative flex flex-col rounded-lg border p-2 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${
                  count > 0
                    ? 'border-[#B76E79] ring-2 ring-[#B76E79] bg-[#FBF3F4]'
                    : 'border-neutral-200 bg-white hover:border-neutral-300'
                }`}
              >
                {/* Charm image is the focus */}
                {thumb ? (
                  <img
                    src={thumb}
                    alt={charm.name}
                    className="w-full aspect-square object-contain rounded-md mb-1.5"
                  />
                ) : (
                  <div className="w-full aspect-square rounded-md bg-neutral-100 mb-1.5" />
                )}
                <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-1">
                  {charm.name}
                </p>
                <p className="text-[10px] text-neutral-400 leading-none mb-0.5">
                  {TYPE_LABEL[charm.charm_type] ?? 'Dangle'}
                  {charm.is_movable === false ? ' · fixed' : ''}
                </p>
                <p className="text-[11px] text-neutral-500 mb-1.5">Rs. {charm.price}</p>

                {/* Color swatches (main image + variants), shown when >1 option */}
                {options.length > 1 && (
                  <div className="flex flex-wrap justify-center gap-1 mb-1.5">
                    {options.map((o) => (
                      <button
                        key={o.key}
                        onClick={() => setChosenOption((m) => ({ ...m, [charm.id]: o.key }))}
                        title={o.color_name}
                        aria-label={o.color_name}
                        className={`w-4 h-4 rounded-full border transition-transform hover:scale-110 ${
                          opt?.key === o.key
                            ? 'ring-2 ring-offset-1 ring-neutral-900 border-white'
                            : 'border-neutral-300'
                        }`}
                        style={{ backgroundColor: safeHex(o.color_hex) }}
                      />
                    ))}
                  </div>
                )}

                <div className="mt-auto">
                  {count === 0 ? (
                    <button
                      onClick={addSelected}
                      disabled={atMax}
                      title={atMax ? `Max ${MAX_CHARMS} charms` : `Add ${charm.name}`}
                      className="w-full py-1.5 text-xs font-semibold rounded-md bg-neutral-900 text-white hover:bg-neutral-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + Add
                    </button>
                  ) : (
                    <div className="flex items-center justify-between gap-1 w-full">
                      <button
                        onClick={() => removeOne(charm)}
                        aria-label={`Remove ${charm.name}`}
                        className="w-8 h-8 rounded-md bg-neutral-100 text-neutral-800 text-base font-bold leading-none hover:bg-neutral-200 transition flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold text-neutral-900 min-w-[1.25rem] text-center">
                        {count}
                      </span>
                      <button
                        onClick={addSelected}
                        disabled={atMax}
                        aria-label={`Add ${charm.name}`}
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

export default CharmPanel;
