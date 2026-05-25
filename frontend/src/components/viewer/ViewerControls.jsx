// frontend/src/components/viewer/ViewerControls.jsx
// Must be rendered as a direct child of <Canvas> — uses useThree() + Html fullscreen overlay.
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';

const ROTATE_STEP = Math.PI / 16;
const ZOOM_FACTOR = 0.85;

const CtrlBtn = ({ onClick, title, children }) => (
  <button
    onClick={onClick}
    title={title}
    className="w-9 h-9 rounded-full bg-white border border-neutral-200 text-neutral-700 flex items-center justify-center hover:bg-neutral-100 hover:border-neutral-400 transition-colors shadow text-sm font-semibold select-none"
  >
    {children}
  </button>
);

const ResetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-3.5 h-3.5">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
    />
  </svg>
);

const ViewerControls = ({ controlsRef }) => {
  const { camera } = useThree();

  const rotateLeft = () => {
    const ctrl = controlsRef?.current;
    if (!ctrl) return;
    ctrl.rotateLeft(ROTATE_STEP);
    ctrl.update();
  };

  const rotateRight = () => {
    const ctrl = controlsRef?.current;
    if (!ctrl) return;
    ctrl.rotateLeft(-ROTATE_STEP);
    ctrl.update();
  };

  const zoomIn = () => {
    camera.position.multiplyScalar(ZOOM_FACTOR);
    camera.updateProjectionMatrix();
  };

  const zoomOut = () => {
    camera.position.multiplyScalar(1 / ZOOM_FACTOR);
    camera.updateProjectionMatrix();
  };

  const resetView = () => {
    const ctrl = controlsRef?.current;
    if (ctrl) {
      ctrl.reset();
    } else {
      camera.position.set(0, 2, 8);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    }
  };

  return (
    <Html fullscreen>
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 pointer-events-auto z-10">
        {/* Rotate row */}
        <div className="flex gap-1.5 justify-end">
          <CtrlBtn onClick={rotateLeft} title="Rotate Left">←</CtrlBtn>
          <CtrlBtn onClick={rotateRight} title="Rotate Right">→</CtrlBtn>
        </div>
        {/* Zoom row */}
        <div className="flex gap-1.5 justify-end">
          <CtrlBtn onClick={zoomIn} title="Zoom In">+</CtrlBtn>
          <CtrlBtn onClick={zoomOut} title="Zoom Out">−</CtrlBtn>
        </div>
        {/* Reset */}
        <div className="flex justify-end">
          <CtrlBtn onClick={resetView} title="Reset View">
            <ResetIcon />
          </CtrlBtn>
        </div>
      </div>
    </Html>
  );
};

export default ViewerControls;
