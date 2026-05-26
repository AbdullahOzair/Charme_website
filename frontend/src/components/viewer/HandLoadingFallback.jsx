// frontend/src/components/viewer/HandLoadingFallback.jsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';

const HandLoadingFallback = () => {
  const ringRef = useRef();

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 1.8;
  });

  return (
    <group position={[0, -0.1, 0]}>
      <mesh ref={ringRef}>
        <torusGeometry args={[0.08, 0.005, 8, 48]} />
        <meshStandardMaterial color="#9CA3AF" roughness={0.4} metalness={0.3} />
      </mesh>

      <Text
        position={[0, -0.14, 0]}
        fontSize={0.04}
        color="#6B7280"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.5}
      >
        Loading hand model...
      </Text>
    </group>
  );
};

export default HandLoadingFallback;
