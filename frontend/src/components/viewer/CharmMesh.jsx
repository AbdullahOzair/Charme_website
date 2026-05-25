// frontend/src/components/viewer/CharmMesh.jsx
import { useGLTF } from '@react-three/drei';

const GLTFCharmInner = ({ modelUrl, position }) => {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene.clone(true)} position={position} />;
};

const FallbackCharm = ({ position, color }) => (
  <mesh position={position} castShadow>
    <octahedronGeometry args={[0.15, 0]} />
    <meshStandardMaterial
      color={color ?? '#d4af37'}
      metalness={0.7}
      roughness={0.2}
    />
  </mesh>
);

const CharmMesh = ({ modelUrl, position, color }) => {
  if (modelUrl) {
    return <GLTFCharmInner modelUrl={modelUrl} position={position} />;
  }
  return <FallbackCharm position={position} color={color} />;
};

export default CharmMesh;
