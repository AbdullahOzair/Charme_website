// frontend/src/components/configurator/CategorySelector.jsx
import useConfiguratorStore from '../../stores/configuratorStore';

const CategorySelector = ({ categories }) => {
  const category = useConfiguratorStore((s) => s.category);

  const handleSelect = (cat) => {
    useConfiguratorStore.setState({ category: cat });
  };

  if (!categories || categories.length === 0) {
    return <p className="text-xs text-neutral-400 italic">No categories available.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((cat) => {
        const active = category?.id === cat.id;
        return (
          <button
            key={cat.id}
            onClick={() => handleSelect(cat)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-all duration-150 ${
              active
                ? 'bg-neutral-900 text-white border-neutral-900'
                : 'bg-white text-neutral-700 border-neutral-300 hover:border-neutral-600 hover:text-neutral-900'
            }`}
          >
            {cat.name}
          </button>
        );
      })}
    </div>
  );
};

export default CategorySelector;
