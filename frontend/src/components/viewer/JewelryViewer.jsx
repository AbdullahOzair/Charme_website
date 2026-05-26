// frontend/src/components/viewer/JewelryViewer.jsx
// Required packages (already installed):
//   @react-three/fiber  @react-three/drei  three
import { useRef, Suspense, Component, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents,
  Html,
} from '@react-three/drei';
import { ACESFilmicToneMapping } from 'three';
import useConfiguratorStore from '../../stores/configuratorStore';
import useGLTFPreload from '../../hooks/useGLTFPreload';
import BraceletScene from './BraceletScene';
import HandTryOnScene from './HandTryOnScene';
import ViewerControls from './ViewerControls';
import TryOnToggle from './TryOnToggle';

// ── TryOnToggle inside the Html layer (same DOM stack as ViewerControls) ──
// Placing it in <Html fullscreen> guarantees it's in the same overlay layer
// as the other controls and isn't blocked by the canvas or drei's portal.
// Positioned bottom-LEFT so it doesn't collide with ViewerControls (bottom-right).
const TryOnHtml = () => (
  <Html fullscreen>
    <TryOnToggle />
  </Html>
);

// ── Force a WebGL frame when the view mode switches ────────────────────────
// frameloop="demand" skips rendering unless explicitly invalidated.
// Mounting new scene content doesn't always auto-trigger a frame, so we do it here.
const ViewInvalidator = ({ isHandView }) => {
  const { invalidate } = useThree();
  useEffect(() => { invalidate(); }, [isHandView, invalidate]);
  return null;
};

// ── Bracelet scene content ──────────────────────────────────────────────────
const BraceletSceneContent = ({ controlsRef }) => (
  <>
    <PerspectiveCamera key="bracelet-cam" makeDefault fov={42} position={[0, 2.5, 8]} />

    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={3}
      maxDistance={15}
      autoRotate={false}
      makeDefault
    />

    <ambientLight intensity={0.25} />
    <directionalLight
      position={[8, 10, 6]}
      intensity={1.6}
      color="#fff5e8"
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.1}
      shadow-camera-far={50}
      shadow-bias={-0.0005}
    />
    <directionalLight position={[-6, 4, -5]} intensity={0.5} color="#c8d8ff" castShadow={false} />
    <pointLight position={[0, 7, 0]}   intensity={1.2} color="#ffffff" decay={2} />
    <pointLight position={[0, -3, 5]}  intensity={0.35} color="#ffe8d0" decay={2} />

    <BraceletScene />

    <Suspense fallback={null}>
      <Environment preset="studio" background={false} />
      <ContactShadows
        position={[0, -0.58, 0]}
        opacity={0.45}
        scale={12}
        blur={2.0}
        far={1.2}
        color="#000020"
      />
    </Suspense>

    <ViewerControls controlsRef={controlsRef} />
  </>
);

// ── Hand try-on scene content ───────────────────────────────────────────────
const HandSceneContent = ({ controlsRef }) => (
  <>
    {/* key forces PerspectiveCamera to reset to new position on mode switch */}
    <PerspectiveCamera key="hand-cam" makeDefault fov={50} position={[0, 0.2, 0.6]} />

    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={0.3}
      maxDistance={1.2}
      minPolarAngle={Math.PI / 4}
      maxPolarAngle={Math.PI * 0.75}
      autoRotate={false}
      makeDefault
    />

    <HandTryOnScene />
  </>
);

// ── Shared Canvas content wrapper ───────────────────────────────────────────
const SceneContent = ({ controlsRef, isHandView }) => (
  <>
    <color attach="background" args={[isHandView ? '#f0ede8' : '#0d0d1a']} />

    <ViewInvalidator isHandView={isHandView} />

    {isHandView
      ? <HandSceneContent  controlsRef={controlsRef} />
      : <BraceletSceneContent controlsRef={controlsRef} />
    }

    {/* Always-visible toggle — inside Html so it's in the same DOM layer as controls */}
    <TryOnHtml />

    <AdaptiveDpr pixelated />
    <AdaptiveEvents />
  </>
);

// ── Canvas error boundary ───────────────────────────────────────────────────
class CanvasErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err, info) { console.error('3D viewer crashed:', err, info?.componentStack ?? ''); }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[#0d0d1a]">
          <div className="text-center text-gray-400 text-sm space-y-3">
            <p>3D viewer unavailable</p>
            <button
              onClick={() => this.setState({ hasError: false })}
              className="text-xs underline hover:text-white transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// ── JewelryViewer ───────────────────────────────────────────────────────────
const JewelryViewer = () => {
  const controlsRef = useRef();

  const isHandViewActive = useConfiguratorStore((s) => s.isHandViewActive);
  const selectedBeads    = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain    = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms   = useConfiguratorStore((s) => s.selectedCharms);

  const modelUrls = [
    ...selectedBeads.map((b) => b.model_file).filter(Boolean),
    selectedChain?.model_file ?? null,
    ...selectedCharms.map((c) => c.model_file).filter(Boolean),
  ].filter(Boolean);

  useGLTFPreload(modelUrls);

  return (
    <CanvasErrorBoundary>
      <Canvas
        shadows
        className="w-full h-full"
        frameloop="demand"
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
          powerPreference: 'high-performance',
          toneMapping: ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
      >
        <SceneContent controlsRef={controlsRef} isHandView={isHandViewActive} />
      </Canvas>
    </CanvasErrorBoundary>
  );
};

export default JewelryViewer;
