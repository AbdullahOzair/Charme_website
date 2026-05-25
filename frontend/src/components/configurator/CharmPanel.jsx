// frontend/src/components/configurator/CharmPanel.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const MAX_CHARMS = 5;

const CheckIcon = () => (
  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const CharmPanel = ({ charms }) => {
  const selectedCharms = useConfiguratorStore((s) => s.selectedCharms);

  const isSelected = (charm) => selectedCharms.some((c) => c.id === charm.id);

  const handleClick = (charm) => {
    if (isSelected(charm)) {
      useConfiguratorStore.setState({
        selectedCharms: selectedCharms.filter((c) => c.id !== charm.id),
      });
    } else if (selectedCharms.length < MAX_CHARMS) {
      useConfiguratorStore.setState({
        selectedCharms: [...selectedCharms, charm],
      });
    }
  };

  const atMax = selectedCharms.length >= MAX_CHARMS;

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
          {selectedCharms.length}/{MAX_CHARMS} selected
        </span>
      </div>

      {!charms || charms.length === 0 ? (
        <p className="text-xs text-neutral-400 italic py-4 text-center">
          No charms available.
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {charms.map((charm) => {
            const active = isSelected(charm);
            const thumb = charm.thumbnail || charm.preview_image;
            return (
              <button
                key={charm.id}
                onClick={() => handleClick(charm)}
                disabled={!active && atMax}
                className={`relative flex flex-col items-center rounded-lg border p-2 text-center transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed ${
                  active
                    ? 'border-neutral-900 bg-neutral-50 ring-1 ring-neutral-900'
                    : 'border-neutral-200 bg-white hover:border-neutral-400'
                }`}
              >
                {thumb ? (
                  <img
                    src={thumb}
                    alt={charm.name}
                    className="w-10 h-10 object-contain rounded-md mb-1"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-md bg-neutral-100 mb-1" />
                )}
                <p className="text-xs text-neutral-800 font-medium leading-tight line-clamp-2">
                  {charm.name}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5">Rs. {charm.price}</p>
                {active && (
                  <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-neutral-900 flex items-center justify-center">
                    <CheckIcon />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CharmPanel;
