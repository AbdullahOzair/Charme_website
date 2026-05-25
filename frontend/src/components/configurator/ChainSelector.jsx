// frontend/src/components/configurator/ChainSelector.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const CheckIcon = () => (
  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ChainSelector = ({ chains }) => {
  const selectedChain = useConfiguratorStore((s) => s.selectedChain);

  const handleSelect = (chain) => {
    const same = selectedChain?.id === chain.id;
    useConfiguratorStore.setState({ selectedChain: same ? null : chain });
  };

  if (!chains || chains.length === 0) {
    return <p className="text-xs text-neutral-400 italic">No chains available.</p>;
  }

  return (
    <div className="space-y-2">
      {chains.map((chain) => {
        const active = selectedChain?.id === chain.id;
        return (
          <button
            key={chain.id}
            onClick={() => handleSelect(chain)}
            className={`w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all duration-150 ${
              active
                ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                : 'border-neutral-200 bg-white hover:border-neutral-400'
            }`}
          >
            {chain.thumbnail ? (
              <img
                src={chain.thumbnail}
                alt={chain.name}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-md bg-neutral-100 flex-shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-neutral-900 truncate">{chain.name}</p>
              <p className="text-xs text-neutral-500 mt-0.5">
                {chain.thickness_mm} mm &middot; Rs. {chain.price}
              </p>
              {chain.material?.name && (
                <p className="text-xs text-neutral-400 mt-0.5">{chain.material.name}</p>
              )}
            </div>

            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                active ? 'bg-neutral-900' : 'bg-neutral-200'
              }`}
            >
              {active && <CheckIcon />}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default ChainSelector;
