// frontend/src/components/viewer/HandTryOnScene.jsx
import { Suspense } from 'react';
import { Environment, ContactShadows } from '@react-three/drei';
import HandModel from './HandModel';
import WristBracelet from './WristBracelet';
import HandLoadingFallback from './HandLoadingFallback';

// HandModel has its own internal Suspense + ErrorBoundary, so it never bubbles
// up a suspension here. The outer Suspense catches Environment's async load.
const HandTryOnScene = () => (
  <group>
    {/* Warm skin-friendly lighting */}
    <ambientLight intensity={0.55} color="#fff8f0" />

    {/* Key light — warm top-front, main skin highlight */}
    <directionalLight
      position={[2, 4, 3]}
      intensity={1.3}
      color="#fff3e0"
      castShadow
      shadow-mapSize-width={1024}
      shadow-mapSize-height={1024}
      shadow-bias={-0.001}
    />

    {/* Fill light — cool side, adds dimension to fingers */}
    <directionalLight position={[-2, 2, -1]} intensity={0.35} color="#d0e8ff" castShadow={false} />

    {/* Under-rim — subtle warmth from below, lifts shadows */}
    <pointLight position={[0, -0.4, 0.4]} intensity={0.25} color="#ffd0a0" decay={2} />

    {/* Hand + bracelet share a rotation so they always stay aligned */}
    <group rotation={[-0.15, 0, 0]}>
      <HandModel />
      <WristBracelet />
    </group>

    {/* Environment + shadows load asynchronously */}
    <Suspense fallback={<HandLoadingFallback />}>
      <Environment preset="apartment" background={false} />
      <ContactShadows
        position={[0, -0.52, 0]}
        opacity={0.28}
        scale={1.5}
        blur={1.8}
        far={0.6}
        color="#3a1a00"
      />
    </Suspense>
  </group>
);

export default HandTryOnScene;
