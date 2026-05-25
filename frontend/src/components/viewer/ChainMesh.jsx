// frontend/src/components/viewer/ChainMesh.jsx
import { useGLTF } from '@react-three/drei';

const ARC_RADIUS = 2.5;
const TUBE_THICKNESS = 0.035;

const GLTFChainInner = ({ modelUrl, length }) => {
  const { scene } = useGLTF(modelUrl);
  const scale = length ? length / 180 : 1;
  return (
    <primitive
      object={scene.clone(true)}
      scale={[scale, scale, scale]}
    />
  );
};

const FallbackChain = ({ color }) => (
  <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
    <torusGeometry args={[ARC_RADIUS, TUBE_THICKNESS, 8, 100]} />
    <meshStandardMaterial
      color={color ?? '#c0c0c0'}
      metalness={0.9}
      roughness={0.1}
    />
  </mesh>
);

const ChainMesh = ({ modelUrl, length, color }) => {
  if (modelUrl) {
    return <GLTFChainInner modelUrl={modelUrl} length={length} />;
  }
  return <FallbackChain color={color} />;
};

export default ChainMesh;
