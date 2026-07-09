// frontend/src/components/configurator/ConfiguratorSidebar.jsx
import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';
import useJewelryAssets from '../../hooks/useJewelryAssets';
import CategorySelector from './CategorySelector';
import LengthSelector from './LengthSelector';
import BeadPanel from './BeadPanel';
import ChainSelector from './ChainSelector';
import CharmPanel from './CharmPanel';
import PriceCalculator from './PriceCalculator';

// Accordion section: single-open, smooth height animation via the grid-rows
// 1fr/0fr trick (no dependency, no height measuring), chevron rotates on open.
const Section = ({ id, label, open, onToggle, children }) => (
  <div className="border-b border-neutral-100 last:border-none">
    <button
      onClick={() => onToggle(id)}
      aria-expanded={open}
      className="w-full flex items-center justify-between py-3.5 px-1 text-left rounded transition-colors hover:bg-neutral-50"
    >
      <span className="text-xs uppercase tracking-widest font-semibold text-neutral-700">
        {label}
      </span>
      <ChevronDown
        className={`w-4 h-4 text-neutral-400 flex-shrink-0 transition-transform duration-300 ${
          open ? 'rotate-180' : ''
        }`}
      />
    </button>
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
        open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      }`}
    >
      <div className="overflow-hidden">
        <div className="pb-4 px-1">{children}</div>
      </div>
    </div>
  </div>
);

const ConfiguratorSidebar = () => {
  const { categories, beads, chains, charms, materials, colors, loading, error } =
    useJewelryAssets();

  // When the charm catalog (re)loads, refresh placed charms' config so admin
  // edits (size, ring, join point, variant images) show up without re-adding.
  const syncPlacedCharms = useConfiguratorStore((s) => s.syncPlacedCharms);
  useEffect(() => {
    if (charms?.length) syncPlacedCharms(charms);
  }, [charms, syncPlacedCharms]);

  // Single-open accordion — Beads open by default (the primary action).
  const [openId, setOpenId] = useState('beads');
  const toggle = (id) => setOpenId((prev) => (prev === id ? null : id));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-12">
        <div className="w-6 h-6 border-2 border-neutral-200 border-t-neutral-800 rounded-full animate-spin" />
        <p className="text-xs text-neutral-400">Loading assets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-medium text-red-700 mb-1">Failed to load</p>
        <p className="text-xs text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <Section id="category" label="Category" open={openId === 'category'} onToggle={toggle}>
        <CategorySelector categories={categories} />
      </Section>

      <Section id="length" label="Bracelet Length" open={openId === 'length'} onToggle={toggle}>
        <LengthSelector />
      </Section>

      <Section id="beads" label="Beads" open={openId === 'beads'} onToggle={toggle}>
        <BeadPanel beads={beads} materials={materials} colors={colors} />
      </Section>

      <Section id="chain" label="Chain" open={openId === 'chain'} onToggle={toggle}>
        <ChainSelector chains={chains} />
      </Section>

      <Section id="charms" label="Charms" open={openId === 'charms'} onToggle={toggle}>
        <CharmPanel charms={charms} />
      </Section>

      <Section id="price" label="Price Summary" open={openId === 'price'} onToggle={toggle}>
        <PriceCalculator />
      </Section>
    </div>
  );
};

export default ConfiguratorSidebar;
