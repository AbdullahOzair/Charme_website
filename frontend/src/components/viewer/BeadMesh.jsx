// frontend/src/components/viewer/BeadMesh.jsx
import { memo, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';

const BEAD_SEGMENTS = 24;

// ── Module-level preload helper ───────────────────────────────────────────────
export const preloadBeadModel = (url) => {
  if (url) useGLTF.preload(url);
};

// ── Sub-components ────────────────────────────────────────────────────────────

const GLTFBeadInner = memo(({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene.clone(true)} />;
});
GLTFBeadInner.displayName = 'GLTFBeadInner';

const FallbackBead = memo(({ color, isEditing, radius }) => (
  <mesh castShadow receiveShadow>
    <sphereGeometry args={[radius, BEAD_SEGMENTS, BEAD_SEGMENTS]} />
    <meshStandardMaterial
      color={color ?? '#c9a96e'}
      metalness={0.5}
      roughness={0.25}
      emissive={isEditing ? '#ffffff' : '#000000'}
      emissiveIntensity={isEditing ? 0.45 : 0}
    />
  </mesh>
));
FallbackBead.displayName = 'FallbackBead';

// ── BeadMesh ─────────────────────────────────────────────────────────────────
const BeadMesh = memo(({ modelUrl, position, color, onClick, isEditing, radius = 0.35 }) => (
  <group position={position} onClick={onClick} scale={isEditing ? 1.15 : 1}>
    <Suspense fallback={<FallbackBead color={color} isEditing={false} radius={radius} />}>
      {modelUrl ? (
        <GLTFBeadInner modelUrl={modelUrl} />
      ) : (
        <FallbackBead color={color} isEditing={isEditing} radius={radius} />
      )}
    </Suspense>
  </group>
));
BeadMesh.displayName = 'BeadMesh';

export default BeadMesh;
