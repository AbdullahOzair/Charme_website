// frontend/src/components/configurator/ConfiguratorSidebar.jsx
import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import useJewelryAssets from '../../hooks/useJewelryAssets';
import CategorySelector from './CategorySelector';
import LengthSelector from './LengthSelector';
import MaterialSelector from './MaterialSelector';
import ColorPicker from './ColorPicker';
import BeadPanel from './BeadPanel';
import ChainSelector from './ChainSelector';
import CharmPanel from './CharmPanel';
import PriceCalculator from './PriceCalculator';

const SECTION_IDS = [
  'category',
  'length',
  'material',
  'color',
  'beads',
  'chain',
  'charms',
  'price',
];

const Section = ({ id, label, open, onToggle, children }) => (
  <div className="border-b border-neutral-100 last:border-none">
    <button
      onClick={() => onToggle(id)}
      className="w-full flex items-center justify-between py-3 px-1 text-left rounded transition-colors hover:bg-neutral-50"
    >
      <span className="text-xs uppercase tracking-widest font-semibold text-neutral-700">
        {label}
      </span>
      {open ? (
        <ChevronUp className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
      )}
    </button>
    {open && <div className="pb-4 px-1">{children}</div>}
  </div>
);

const ConfiguratorSidebar = () => {
  const { categories, beads, chains, charms, materials, colors, loading, error } =
    useJewelryAssets();

  const [open, setOpen] = useState(
    Object.fromEntries(SECTION_IDS.map((id) => [id, true]))
  );

  const toggle = (id) => setOpen((prev) => ({ ...prev, [id]: !prev[id] }));

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
      <Section id="category" label="Category" open={open.category} onToggle={toggle}>
        <CategorySelector categories={categories} />
      </Section>

      <Section id="length" label="Bracelet Length" open={open.length} onToggle={toggle}>
        <LengthSelector />
      </Section>

      <Section id="material" label="Material" open={open.material} onToggle={toggle}>
        <MaterialSelector materials={materials} />
      </Section>

      <Section id="color" label="Color" open={open.color} onToggle={toggle}>
        <ColorPicker colors={colors} />
      </Section>

      <Section id="beads" label="Beads" open={open.beads} onToggle={toggle}>
        <BeadPanel beads={beads} materials={materials} colors={colors} />
      </Section>

      <Section id="chain" label="Chain" open={open.chain} onToggle={toggle}>
        <ChainSelector chains={chains} />
      </Section>

      <Section id="charms" label="Charms" open={open.charms} onToggle={toggle}>
        <CharmPanel charms={charms} />
      </Section>

      <Section id="price" label="Price Summary" open={open.price} onToggle={toggle}>
        <PriceCalculator />
      </Section>
    </div>
  );
};

export default ConfiguratorSidebar;
