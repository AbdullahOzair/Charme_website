// frontend/src/components/viewer/TryOnToggle.jsx
// Rendered inside <Html fullscreen> in JewelryViewer — same DOM layer as ViewerControls.
// Positioned bottom-LEFT so it doesn't collide with the bottom-right controls.
import { Hand, Circle } from 'lucide-react';
import useConfiguratorStore from '../../stores/configuratorStore';

const TryOnToggle = () => {
  const isHandViewActive = useConfiguratorStore((s) => s.isHandViewActive);
  const toggleHandView   = useConfiguratorStore((s) => s.toggleHandView);

  return (
    <button
      onClick={toggleHandView}
      aria-label={isHandViewActive ? 'Back to bracelet view' : 'Try on hand'}
      style={{
        position:      'absolute',
        bottom:        '16px',
        left:          '16px',
        display:       'flex',
        alignItems:    'center',
        gap:           '6px',
        padding:       '10px 16px',
        borderRadius:  '12px',
        fontSize:      '13px',
        fontWeight:    '500',
        lineHeight:    1,
        border:        isHandViewActive ? '0.5px solid #AFA9EC' : '0.5px solid #e5e7eb',
        background:    isHandViewActive ? '#EEEDFE'             : '#ffffff',
        color:         isHandViewActive ? '#3C3489'             : '#374151',
        boxShadow:     '0 1px 6px rgba(0,0,0,0.15)',
        cursor:        'pointer',
        transition:    'all 0.2s ease',
        userSelect:    'none',
        pointerEvents: 'auto',
        zIndex:        20,
        whiteSpace:    'nowrap',
      }}
    >
      {isHandViewActive
        ? <Circle size={14} strokeWidth={2} />
        : <Hand   size={14} strokeWidth={2} />
      }
      {isHandViewActive ? 'Back to Bracelet' : 'Try On Hand'}
    </button>
  );
};

export default TryOnToggle;
