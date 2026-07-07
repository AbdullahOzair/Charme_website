// frontend/src/components/viewer/BackgroundPicker.jsx
// Plain DOM overlay (NOT inside the WebGL <Html> layer) so clicks are never
// blocked by the canvas / drei Html overlays. Lets the customer preview the
// bracelet against different backdrop colors.
import useConfiguratorStore from '../../stores/configuratorStore';

// Preset backdrop colors
const BG_PRESETS = [
  { color: '#0d0d1a', label: 'Midnight' },
  { color: '#ffffff', label: 'White' },
  { color: '#f0ede8', label: 'Ivory' },
  { color: '#1f2937', label: 'Slate' },
  { color: '#f8e8e8', label: 'Blush' },
  { color: '#0b3d2e', label: 'Emerald' },
];

const BackgroundPicker = () => {
  const viewerBackground = useConfiguratorStore((s) => s.viewerBackground);
  const setViewerBackground = useConfiguratorStore((s) => s.setViewerBackground);
  const isHandViewActive = useConfiguratorStore((s) => s.isHandViewActive);

  // Background customization only applies to the bracelet 3D view
  if (isHandViewActive) return null;

  return (
    <div
      className="absolute top-4 left-4 flex items-center gap-2 bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 shadow border border-neutral-200"
      style={{ zIndex: 16777272, pointerEvents: 'auto' }}
    >
      <span className="text-[11px] font-semibold text-neutral-500 select-none">BG</span>
      {BG_PRESETS.map(({ color, label }) => (
        <button
          key={color}
          type="button"
          onClick={() => setViewerBackground(color)}
          title={label}
          aria-label={`Background ${label}`}
          className={`w-6 h-6 rounded-full border transition-transform hover:scale-110 ${
            viewerBackground === color
              ? 'ring-2 ring-offset-1 ring-rose-400 border-white'
              : 'border-neutral-300'
          }`}
          style={{ backgroundColor: color }}
        />
      ))}
      {/* Custom color */}
      <label
        title="Custom color"
        className="w-6 h-6 rounded-full border border-neutral-300 cursor-pointer overflow-hidden relative"
        style={{
          background: 'conic-gradient(red, orange, yellow, lime, cyan, blue, magenta, red)',
        }}
      >
        <input
          type="color"
          value={viewerBackground}
          onChange={(e) => setViewerBackground(e.target.value)}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </label>
    </div>
  );
};

export default BackgroundPicker;
