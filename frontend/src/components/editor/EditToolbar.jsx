// frontend/src/components/editor/EditToolbar.jsx
import { List, Sparkles, Trash2, Link2 } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';

const EditToolbar = ({
  onReorderBeads,
  onAddCharm,
  onChangeChain,
  showReorder,
}) => {
  const selectedBeads = useConfiguratorStore((s) => s.selectedBeads);
  const removeBead    = useConfiguratorStore((s) => s.removeBead);

  const handleRemoveLast = () => {
    if (selectedBeads.length > 0) {
      removeBead(selectedBeads.length - 1);
    }
  };

  const tools = [
    {
      key: 'reorder',
      label: 'Reorder Beads',
      icon: List,
      onClick: onReorderBeads,
      active: showReorder,
      disabled: selectedBeads.length < 2,
      danger: false,
    },
    {
      key: 'charm',
      label: 'Add Charm',
      icon: Sparkles,
      onClick: onAddCharm,
      active: false,
      disabled: false,
      danger: false,
    },
    {
      key: 'remove',
      label: 'Remove Last Bead',
      icon: Trash2,
      onClick: handleRemoveLast,
      active: false,
      disabled: selectedBeads.length === 0,
      danger: true,
    },
    {
      key: 'chain',
      label: 'Change Chain',
      icon: Link2,
      onClick: onChangeChain,
      active: false,
      disabled: false,
      danger: false,
    },
  ];

  return (
    <div className="bg-white border-b border-neutral-200 px-4 sm:px-6 py-2">
      <div className="flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        {tools.map(({ key, label, icon: Icon, onClick, active, disabled, danger }) => (
          <button
            key={key}
            onClick={onClick}
            disabled={disabled}
            title={label}
            className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium
              whitespace-nowrap transition-colors flex-shrink-0
              disabled:opacity-40 disabled:cursor-not-allowed
              ${active
                ? 'bg-neutral-900 text-white border border-neutral-900'
                : danger
                ? 'text-red-600 border border-red-200 hover:bg-red-50'
                : 'text-neutral-600 border border-neutral-200 hover:bg-neutral-100 hover:border-neutral-400'
              }
            `}
          >
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EditToolbar;
