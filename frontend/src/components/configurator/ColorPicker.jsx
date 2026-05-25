// frontend/src/components/configurator/ColorPicker.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const CheckIcon = () => (
  <svg className="w-3 h-3 text-white drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

const ColorPicker = ({ colors }) => {
  const selectedColor = useConfiguratorStore((s) => s.selectedColor);

  const handleSelect = (color) => {
    const same = selectedColor?.id === color.id;
    useConfiguratorStore.setState({ selectedColor: same ? null : color });
  };

  if (!colors || colors.length === 0) {
    return <p className="text-xs text-neutral-400 italic">No colors available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-3">
      {colors.map((color) => {
        const active = selectedColor?.id === color.id;
        return (
          <div key={color.id} className="relative group">
            <button
              onClick={() => handleSelect(color)}
              title={color.name}
              aria-label={color.name}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-500 ${
                active
                  ? 'border-neutral-900 scale-110 shadow-md'
                  : 'border-transparent hover:border-neutral-400 hover:scale-105'
              }`}
              style={{ backgroundColor: color.hex_code }}
            >
              {active && <CheckIcon />}
            </button>
            {/* Tooltip */}
            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-neutral-800 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
              {color.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ColorPicker;
