// frontend/src/components/viewer/JewelryViewer.jsx
import { useRef, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import {
  PerspectiveCamera,
  OrbitControls,
  Environment,
  ContactShadows,
  AdaptiveDpr,
  AdaptiveEvents,
} from '@react-three/drei';
import useConfiguratorStore from '../../stores/configuratorStore';
import useGLTFPreload from '../../hooks/useGLTFPreload';
import BraceletScene from './BraceletScene';
import ViewerControls from './ViewerControls';

const SceneContent = ({ controlsRef }) => (
  <>
    {/* Background color */}
    <color attach="background" args={['#0f0f1a']} />

    {/* Camera */}
    <PerspectiveCamera makeDefault fov={45} position={[0, 2, 8]} />

    {/* Lights */}
    <ambientLight intensity={0.45} />
    <directionalLight
      position={[10, 10, 5]}
      intensity={1.4}
      castShadow
      shadow-mapSize-width={2048}
      shadow-mapSize-height={2048}
      shadow-camera-near={0.1}
      shadow-camera-far={50}
    />
    <spotLight
      position={[-6, 8, -4]}
      intensity={0.5}
      angle={0.35}
      penumbra={0.6}
      castShadow={false}
    />

    {/* Controls */}
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      minDistance={3}
      maxDistance={15}
      autoRotate={false}
      makeDefault
    />

    {/* Scene */}
    <BraceletScene />

    {/* Environment + shadows — lazy loaded */}
    <Suspense fallback={null}>
      <Environment preset="studio" />
      <ContactShadows
        position={[0, -0.55, 0]}
        opacity={0.35}
        scale={10}
        blur={2.5}
        far={1}
      />
    </Suspense>

    {/* Adaptive quality — lowers DPR during interaction, restores when idle.
        Works in conjunction with performance.min on Canvas. */}
    <AdaptiveDpr pixelated />

    {/* Only attach pointer events while the pointer is over the canvas */}
    <AdaptiveEvents />

    {/* HTML overlay controls — rendered inside Canvas via drei Html fullscreen */}
    <ViewerControls controlsRef={controlsRef} />
  </>
);

const JewelryViewer = () => {
  const controlsRef = useRef();

  const selectedBeads  = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain  = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms = useConfiguratorStore((s) => s.selectedCharms);

  const modelUrls = [
    ...selectedBeads.map((b) => b.model_file).filter(Boolean),
    selectedChain?.model_file ?? null,
    ...selectedCharms.map((c) => c.model_file).filter(Boolean),
  ].filter(Boolean);

  useGLTFPreload(modelUrls);

  return (
    <Canvas
      shadows
      className="w-full h-full"
      // frameloop="demand" skips rendering frames when nothing has changed,
      // eliminating idle GPU work. OrbitControls invalidates automatically on interaction.
      frameloop="demand"
      gl={{
        antialias: true,
        alpha: false,
        preserveDrawingBuffer: true,   // required for canvas.toDataURL() capture
        powerPreference: 'high-performance',
      }}
      dpr={[1, 2]}
      // performance.min works with AdaptiveDpr to scale DPR down during heavy frames
      performance={{ min: 0.5 }}
    >
      <SceneContent controlsRef={controlsRef} />
    </Canvas>
  );
};

export default JewelryViewer;
