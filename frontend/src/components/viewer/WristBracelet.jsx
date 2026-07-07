// frontend/src/components/viewer/WristBracelet.jsx
// Renders the CURRENT bracelet design (beads + charms) wrapped around the wrist.
// Mirrors BraceletScene's bead/charm appearance, scaled down to wrist size.
import { memo, useMemo } from 'react';
import useConfiguratorStore from '../../stores/configuratorStore';
import BeadMesh from './BeadMesh';
import CharmMesh from './CharmMesh';

const WRIST_CENTER    = [0, -0.18, 0];
const WRIST_RADIUS    = 0.060;
const CHAIN_THICKNESS = 0.0018;
const WRIST_CHARM_SCALE = 0.02; // world scale for a nominal charm on the wrist

// Bead radius so beads fit around the wrist without overlapping
const computeBeadRadius = (n) => {
  if (n <= 0) return 0.009;
  const arcPerBead = (2 * Math.PI * WRIST_RADIUS) / n;
  return Math.max(0.005, Math.min(0.018, arcPerBead * 0.42));
};

// Same size clamp as the main scene (nominal 15mm = 1.0).
const charmSizeFactor = (mm) => {
  const v = Number(mm);
  if (!v || Number.isNaN(v)) return 1;
  return Math.max(0.5, Math.min(1.8, v / 15));
};

// Snap a charm's angle to the midpoint of the nearest bead gap so it sits
// BETWEEN beads (same rule as the main scene), never on top of one.
const snapAngleToBeadGap = (angle, beadCount) => {
  if (!beadCount || beadCount < 1) return angle;
  const twoPi = Math.PI * 2;
  const idx = Math.round((angle / twoPi) * beadCount - 0.5);
  return ((idx + 0.5) / beadCount) * twoPi;
};

const WristBracelet = memo(() => {
  const selectedBeads  = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain  = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms = useConfiguratorStore((s) => s.selectedCharms);
  const selectedColor  = useConfiguratorStore((s) => s.selectedColor);
  const charmRingColor = useConfiguratorStore((s) => s.charmRingColor);

  const colorHex    = selectedColor?.hex_code ?? null;
  const chainColor  = selectedChain?.color?.hex_code ?? colorHex ?? '#c8a060';
  const n           = selectedBeads.length;
  const beadRadius  = useMemo(() => computeBeadRadius(n), [n]);

  const beadPositions = useMemo(
    () =>
      selectedBeads.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI;
        return [
          WRIST_CENTER[0] + WRIST_RADIUS * Math.cos(angle),
          WRIST_CENTER[1],
          WRIST_CENTER[2] + WRIST_RADIUS * Math.sin(angle),
        ];
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

      {/* Beads — same appearance as the main viewer, scaled to the wrist */}
      {selectedBeads.map((bead, i) => (
        <BeadMesh
          key={`wrist-bead-${bead.id}-${i}`}
          position={beadPositions[i] ?? WRIST_CENTER}
          modelUrl={bead.model_file ?? null}
          textureUrl={
            (bead.use_real_photo || bead.is_multi_shade)
              ? (bead.texture ?? bead.image ?? null)
              : null
          }
          fillColor={bead.shade_colors?.[0] ?? bead.color?.hex_code ?? colorHex ?? '#cccccc'}
          color={bead.color?.hex_code ?? colorHex ?? null}
          shape={bead.shape ?? 'round'}
          beadMaterialType={bead.bead_material_type ?? 'glass'}
          transparency={bead.transparency ?? 'translucent'}
          radius={beadRadius}
        />
      ))}

      {/* Charms — real images/colors/sizes, snapped BETWEEN beads and hung
          just below the band so they dangle clearly instead of merging. */}
      {selectedCharms.map((charm) => {
        const angle = snapAngleToBeadGap(charm.angle ?? 0, n);
        // Hoop sits ON the band (same ring as the chain/beads) between two
        // beads; the charm body then hangs below via CharmMesh's loop pivot.
        const pos = [
          WRIST_CENTER[0] + WRIST_RADIUS * Math.cos(angle),
          WRIST_CENTER[1],
          WRIST_CENTER[2] + WRIST_RADIUS * Math.sin(angle),
        ];
        const scale = WRIST_CHARM_SCALE * charmSizeFactor(charm.size_mm);
        return (
          <group key={`wrist-charm-${charm.instanceId ?? charm.id}`} position={pos}>
            <CharmMesh
              modelUrl={charm.model_file ?? null}
              imageUrl={charm.image ?? charm.preview_image ?? charm.thumbnail ?? null}
              anchorX={charm.variantId ? null : (charm.anchor_x ?? null)}
              anchorY={charm.variantId ? null : (charm.anchor_y ?? null)}
              ringColor={charmRingColor ?? charm.jump_ring_color ?? 'gold'}
              color={colorHex ?? charm.color?.hex_code ?? null}
              scale={scale}
            />
          </group>
        );
      })}
    </group>
  );
});
WristBracelet.displayName = 'WristBracelet';

export default WristBracelet;
