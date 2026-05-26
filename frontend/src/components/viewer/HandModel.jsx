// frontend/src/components/viewer/HandModel.jsx
/*
  HOW TO USE A REAL GLB HAND MODEL (optional upgrade):
  1. Place a hand GLB at: public/models/hand/hand.glb
  2. Uncomment the GLTFHand block at the bottom.
  Recommended free source: Sketchfab — search "female hand CC0" or "hand low poly CC0".
  The model should have the wrist near Y = -0.18 in local space.
*/
import { memo } from 'react';

const SKIN = { color: '#D4956A', roughness: 0.75, metalness: 0.0 };

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
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Palm — bottom at y=−0.14 (overlaps wrist), top at y=0.01 ── */}
    <mesh position={[0, -0.065, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.10, 0.15, 0.025]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Thumb base (thenar eminence) — bridges palm to thumb ── */}
    <mesh position={[-0.054, -0.080, 0.008]} castShadow>
      <sphereGeometry args={[0.019, 12, 12]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Thumb — nearly horizontal, right end inside palm ── */}
    {/* rotation Z=−1.25 rad ≈ 72° → mostly horizontal, tip pointing up-left */}
    <mesh position={[-0.072, -0.065, 0.010]} rotation={[0.05, 0, -1.25]} castShadow>
      <capsuleGeometry args={[0.014, 0.058, 4, 10]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Index — center y = 0.00 + (0.034+0.011) = 0.045 ── */}
    <mesh position={[-0.033, 0.045, 0]} rotation={[0, 0, 0.06]} castShadow>
      <capsuleGeometry args={[0.011, 0.068, 4, 10]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Middle — center y = 0.00 + (0.040+0.012) = 0.052 ── */}
    <mesh position={[-0.009, 0.052, 0]} castShadow>
      <capsuleGeometry args={[0.012, 0.080, 4, 10]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Ring — center y = 0.00 + (0.036+0.011) = 0.047 ── */}
    <mesh position={[0.015, 0.047, 0]} rotation={[0, 0, -0.05]} castShadow>
      <capsuleGeometry args={[0.011, 0.072, 4, 10]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Pinky — center y = 0.00 + (0.027+0.008) = 0.035 ── */}
    <mesh position={[0.038, 0.035, 0]} rotation={[0, 0, -0.13]} castShadow>
      <capsuleGeometry args={[0.008, 0.054, 4, 10]} />
      <meshStandardMaterial {...SKIN} />
    </mesh>

    {/* ── Knuckle rounds at finger bases (covers palm/finger seam) ── */}
    {[[-0.033, 0.006], [-0.009, 0.006], [0.015, 0.006], [0.038, 0.006]].map(([x, y], i) => (
      <mesh key={i} position={[x, y, 0]}>
        <sphereGeometry args={[0.013 - i * 0.001, 8, 8]} />
        <meshStandardMaterial {...SKIN} />
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
