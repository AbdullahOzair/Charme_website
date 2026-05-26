// frontend/src/components/viewer/WristBracelet.jsx
/*
  WRIST CIRCLE MATH:
  center = [0, -0.18, 0]
  radius = 0.085
  For N beads, bead at index i:
    angle = (i / N) * 2 * Math.PI
    x = center[0] + radius * Math.cos(angle)
    y = center[1]  (all beads at same wrist height)
    z = center[2] + radius * Math.sin(angle)
    rotateY = -angle  (face outward from wrist center)
  Chain torus:
    position = center
    rotation = [Math.PI / 2, 0, 0]  (lay flat around wrist)
    args = [radius, chainThickness, 8, 64]
*/
import { memo, useMemo } from 'react';
import useConfiguratorStore from '../../stores/configuratorStore';
import BeadMesh from './BeadMesh';

const WRIST_CENTER  = [0, -0.18, 0];
const WRIST_RADIUS  = 0.060;
const CHAIN_THICKNESS = 0.0018;
const MAX_CHARM_SLOTS = 3;

// Bead radius so beads fit around the wrist without overlapping
const computeBeadRadius = (n) => {
  if (n <= 0) return 0.009;
  const arcPerBead = (2 * Math.PI * WRIST_RADIUS) / n;
  return Math.max(0.005, Math.min(0.018, arcPerBead * 0.42));
};

const WristBracelet = memo(() => {
  const selectedBeads  = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain  = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms = useConfiguratorStore((s) => s.selectedCharms);
  const selectedColor  = useConfiguratorStore((s) => s.selectedColor);

  const colorHex    = selectedColor?.hex_code ?? null;
  const chainColor  = selectedChain?.color?.hex_code ?? colorHex ?? '#c8a060';
  const n           = selectedBeads.length;
  const beadRadius  = useMemo(() => computeBeadRadius(n), [n]);

  const beadPositions = useMemo(
    () =>
      selectedBeads.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI;
        return {
          pos:    [WRIST_CENTER[0] + WRIST_RADIUS * Math.cos(angle), WRIST_CENTER[1], WRIST_CENTER[2] + WRIST_RADIUS * Math.sin(angle)],
          rotY:   -angle,
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [n],
  );

  return (
    <group>
      {/* Chain — flat torus around wrist */}
      <mesh position={WRIST_CENTER} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[WRIST_RADIUS, CHAIN_THICKNESS, 8, 64]} />
        <meshStandardMaterial
          color={chainColor}
          metalness={0.9}
          roughness={0.15}
          envMapIntensity={2.0}
        />
      </mesh>

      {/* Beads */}
      {selectedBeads.map((bead, i) => (
        <BeadMesh
          key={`wrist-bead-${bead.id}-${i}`}
          position={beadPositions[i]?.pos ?? WRIST_CENTER}
          color={bead.color?.hex_code ?? colorHex ?? null}
          shape={bead.shape ?? 'round'}
          beadMaterialType={bead.bead_material_type ?? 'glass'}
          transparency={bead.transparency ?? 'translucent'}
          radius={beadRadius}
        />
      ))}

      {/* Charms — 3 evenly distributed positions, hanging slightly below */}
      {selectedCharms.slice(0, MAX_CHARM_SLOTS).map((_, i) => {
        const angle = (i / MAX_CHARM_SLOTS) * 2 * Math.PI;
        const x = WRIST_CENTER[0] + WRIST_RADIUS * Math.cos(angle);
        const z = WRIST_CENTER[2] + WRIST_RADIUS * Math.sin(angle);
        return (
          <mesh
            key={`wrist-charm-${i}`}
            position={[x, WRIST_CENTER[1] - 0.02, z]}
          >
            <sphereGeometry args={[0.006, 8, 8]} />
            <meshStandardMaterial color={colorHex ?? '#c8a060'} metalness={0.8} roughness={0.2} />
          </mesh>
        );
      })}
    </group>
  );
});
WristBracelet.displayName = 'WristBracelet';

export default WristBracelet;
