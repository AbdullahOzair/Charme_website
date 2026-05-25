// frontend/src/components/configurator/PriceCalculator.jsx
import { useEffect } from 'react';
import useConfiguratorStore from '../../stores/configuratorStore';

const fmt = (n) =>
  new Intl.NumberFormat('en-PK', {
    style: 'currency',
    currency: 'PKR',
    maximumFractionDigits: 0,
  }).format(n);

const Row = ({ label, value, muted }) => (
  <div className={`flex justify-between text-xs ${muted ? 'text-neutral-400' : 'text-neutral-600'}`}>
    <span>{label}</span>
    <span>{value}</span>
  </div>
);

const PriceCalculator = () => {
  const selectedBeads = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms = useConfiguratorStore((s) => s.selectedCharms);
  const selectedMaterial = useConfiguratorStore((s) => s.selectedMaterial);

  const beadsTotal = selectedBeads.reduce(
    (sum, b) => sum + parseFloat(b.price ?? 0),
    0
  );
  const chainTotal = parseFloat(selectedChain?.price ?? 0);
  const charmsTotal = selectedCharms.reduce(
    (sum, c) => sum + parseFloat(c.price ?? 0),
    0
  );
  const materialAdj = parseFloat(selectedMaterial?.price_modifier ?? 0);
  const computed = beadsTotal + chainTotal + charmsTotal + materialAdj;

  useEffect(() => {
    useConfiguratorStore.setState({ totalPrice: computed });
  }, [computed]);

  const isEmpty =
    selectedBeads.length === 0 &&
    !selectedChain &&
    selectedCharms.length === 0 &&
    !selectedMaterial;

  if (isEmpty) {
    return (
      <p className="text-xs text-neutral-400 italic text-center py-2">
        Select items to see pricing.
      </p>
    );
  }

  return (
    <div className="rounded-lg bg-neutral-50 border border-neutral-200 p-3 space-y-1.5">
      <Row
        label={`Beads (${selectedBeads.length})`}
        value={fmt(beadsTotal)}
        muted={selectedBeads.length === 0}
      />
      <Row
        label="Chain"
        value={selectedChain ? fmt(chainTotal) : '—'}
        muted={!selectedChain}
      />
      <Row
        label={`Charms (${selectedCharms.length})`}
        value={fmt(charmsTotal)}
        muted={selectedCharms.length === 0}
      />
      {selectedMaterial && (
        <Row
          label={`Material surcharge (${selectedMaterial.name})`}
          value={`+ ${fmt(materialAdj)}`}
        />
      )}
      <div className="border-t border-neutral-200 pt-2 mt-1 flex justify-between items-center">
        <span className="text-sm font-semibold text-neutral-900">Total</span>
        <span className="text-base font-bold text-neutral-900">{fmt(computed)}</span>
      </div>
    </div>
  );
};

export default PriceCalculator;
