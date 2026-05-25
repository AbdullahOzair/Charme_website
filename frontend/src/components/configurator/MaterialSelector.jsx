// frontend/src/components/configurator/MaterialSelector.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const MaterialSelector = ({ materials }) => {
  const selectedMaterial = useConfiguratorStore((s) => s.selectedMaterial);

  const handleSelect = (material) => {
    const same = selectedMaterial?.id === material.id;
    useConfiguratorStore.setState({ selectedMaterial: same ? null : material });
  };

  if (!materials || materials.length === 0) {
    return <p className="text-xs text-neutral-400 italic">No materials available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {materials.map((material) => {
        const active = selectedMaterial?.id === material.id;
        return (
          <button
            key={material.id}
            onClick={() => handleSelect(material)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              active
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-600 hover:text-neutral-900'
            }`}
          >
            {material.name}
          </button>
        );
      })}
    </div>
  );
};

export default MaterialSelector;
