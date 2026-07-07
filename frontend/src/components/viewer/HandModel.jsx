// frontend/src/components/viewer/HandModel.jsx
/*
  HOW TO USE A REAL GLB HAND MODEL (optional upgrade):
  1. Place a hand GLB at: public/models/hand/hand.glb
  2. Uncomment the GLTFHand block at the bottom.
  Recommended free source: Sketchfab — search "female hand CC0" or "hand low poly CC0".
  The model should have the wrist near Y = -0.18 in local space.
*/
import { memo } from 'react';

// Soft skin: physical material with a subtle sheen so it reads as skin, not plastic.
const SkinMat = () => (
  <meshPhysicalMaterial
    color="#e0a982"
    roughness={0.6}
    metalness={0}
    sheen={0.5}
    sheenColor="#ffcfae"
    sheenRoughness={0.6}
    clearcoat={0.08}
    clearcoatRoughness={0.7}
  />
);

const NAIL = { color: '#e8c3ab', roughness: 0.35, metalness: 0 };

// Finger config: [x, baseY, radius, length, rotZ]
const FINGERS = [
  [-0.033, 0.045, 0.011, 0.068, 0.06],   // index
  [-0.009, 0.052, 0.012, 0.080, 0.0],    // middle
  [0.015,  0.047, 0.011, 0.072, -0.05],  // ring
  [0.038,  0.035, 0.008, 0.054, -0.13],  // pinky
];

/*
  GEOMETRY MATH — all Y positions connect with no gaps:
  ─────────────────────────────────────────────────────
  Wrist cyl : center y=−0.18,  h=0.09  → top  y=−0.135
  Palm box  : center y=−0.065, h=0.15  → bot  y=−0.14 (overlaps wrist +0.005)
                                          top  y= 0.010
  Fingers   : capsule bottoms at y=0.00 (overlaps palm top +0.01)
    capsule center = 0.00 + (height/2 + radius)
*/

export const HandModelFallback = memo(() => (
  /* NO rotation here — rotation is applied by HandTryOnScene group */
  <group>
    {/* ── Wrist — center [0,−0.18,0], top at y=−0.135 ── */}
    <mesh position={[0, -0.18, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.044, 0.048, 0.09, 24]} />
      <SkinMat />
    </mesh>

    {/* ── Palm — bottom at y=−0.14 (overlaps wrist), top at y=0.01 ── */}
    <mesh position={[0, -0.065, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.10, 0.15, 0.025]} />
      <SkinMat />
    </mesh>

    {/* ── Palm rounding — softens the flat box front for a fleshier look ── */}
    <mesh position={[0, -0.065, 0.006]} scale={[1, 1, 0.5]} castShadow>
      <sphereGeometry args={[0.05, 20, 16]} />
      <SkinMat />
    </mesh>

    {/* ── Thumb base (thenar eminence) — bridges palm to thumb ── */}
    <mesh position={[-0.054, -0.080, 0.008]} castShadow>
      <sphereGeometry args={[0.021, 14, 14]} />
      <SkinMat />
    </mesh>

    {/* ── Thumb — nearly horizontal, right end inside palm ── */}
    <mesh position={[-0.072, -0.065, 0.010]} rotation={[0.05, 0, -1.25]} castShadow>
      <capsuleGeometry args={[0.014, 0.058, 6, 14]} />
      <SkinMat />
    </mesh>

    {/* ── Fingers — capsules with a gentle forward curl + nails ── */}
    {FINGERS.map(([x, baseY, r, len, rotZ], i) => {
      const tipY = baseY + len / 2 + r;
      return (
        <group key={i} rotation={[-0.06, 0, 0]}>
          <mesh position={[x, baseY, 0]} rotation={[0, 0, rotZ]} castShadow>
            <capsuleGeometry args={[r, len, 6, 14]} />
            <SkinMat />
          </mesh>
          {/* mid knuckle crease bump */}
          <mesh position={[x, baseY + len * 0.18, 0]} castShadow>
            <sphereGeometry args={[r * 1.02, 10, 10]} />
            <SkinMat />
          </mesh>
          {/* fingernail on the front face of the tip */}
          <mesh position={[x, tipY - r * 0.35, r * 0.72]} rotation={[0.5, 0, rotZ]}>
            <boxGeometry args={[r * 1.3, r * 1.5, 0.003]} />
            <meshStandardMaterial {...NAIL} />
          </mesh>
        </group>
      );
    })}

    {/* ── Knuckle rounds at finger bases (covers palm/finger seam) ── */}
    {FINGERS.map(([x], i) => (
      <mesh key={`k${i}`} position={[x, 0.006, 0]}>
        <sphereGeometry args={[0.013 - i * 0.001, 10, 10]} />
        <SkinMat />
      </mesh>
    ))}
  </group>
));
HandModelFallback.displayName = 'HandModelFallback';

const HandModel = memo(() => <HandModelFallback />);
HandModel.displayName = 'HandModel';

export default HandModel;

/*
  ── GLB version — uncomment when public/models/hand/hand.glb is placed ────────

  import { Suspense, useMemo, Component } from 'react';
  import { useGLTF } from '@react-three/drei';
  import { MeshStandardMaterial } from 'three';

  const skinMat = new MeshStandardMaterial({ color: '#D4956A', roughness: 0.75, metalness: 0 });

  class HandGLBBoundary extends Component {
    state = { failed: false };
    static getDerivedStateFromError() { return { failed: true }; }
    componentDidCatch(e) { console.warn('Hand GLB failed:', e?.message); }
    render() { return this.state.failed ? this.props.fallback : this.props.children; }
  }

  const HandGLTFInner = () => {
    const { scene } = useGLTF('/models/hand/hand.glb');
    const cloned = useMemo(() => {
      const c = scene.clone(true);
      c.traverse(n => { if (n.isMesh) { n.material = skinMat; n.castShadow = true; } });
      return c;
    }, [scene]);
    return <primitive object={cloned} />;
  };

  export const HandModel = memo(() => (
    <HandGLBBoundary fallback={<HandModelFallback />}>
      <Suspense fallback={<HandModelFallback />}>
        <HandGLTFInner />
      </Suspense>
    </HandGLBBoundary>
  ));
*/
