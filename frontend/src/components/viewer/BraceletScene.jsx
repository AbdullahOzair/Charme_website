// frontend/src/components/viewer/BraceletScene.jsx
import { memo, useMemo, useCallback, Suspense } from 'react';
import { useThree } from '@react-three/fiber';
import { Plane, Vector3 } from 'three';
import useConfiguratorStore from '../../stores/configuratorStore';
import BeadMesh from './BeadMesh';
import ChainMesh from './ChainMesh';
import CharmMesh from './CharmMesh';

const BEAD_ARC_RADIUS = 2.5;

// Charm sizing — nominal 15mm charm = scale 1.0, clamped so extremes stay sane.
const CHARM_NOMINAL_MM = 15;
const charmSizeFactor = (mm) => {
  const v = Number(mm);
  if (!v || Number.isNaN(v)) return 1;
  return Math.max(0.5, Math.min(1.8, v / CHARM_NOMINAL_MM));
};

// World position of a charm's attach point ON the wire (y=0). The charm body
// then hangs below via the sprite's loop pivot — see CharmMesh.
const charmPlacement = (angle) => [
  BEAD_ARC_RADIUS * Math.cos(angle),
  0,
  BEAD_ARC_RADIUS * Math.sin(angle),
];

// Snap an angle to the midpoint of the nearest gap between two beads, so a
// charm always sits BETWEEN beads. Gap i midpoint = ((i + 0.5)/n)·2π.
const snapAngleToBeadGap = (angle, beadCount) => {
  if (!beadCount || beadCount < 1) return angle;
  const twoPi = Math.PI * 2;
  const idx = Math.round((angle / twoPi) * beadCount - 0.5);
  return ((idx + 0.5) / beadCount) * twoPi;
};

// Reusable y=0 plane for converting a drag ray into a bracelet angle.
const DRAG_PLANE = new Plane(new Vector3(0, 1, 0), 0);

// Bead radius so beads nearly touch each other (≈90% of available arc per bead)
const computeBeadRadius = (n) => {
  if (n <= 0) return 0.35;
  const arcPerBead = (2 * Math.PI * BEAD_ARC_RADIUS) / n;
  return Math.max(0.08, Math.min(0.44, arcPerBead * 0.45));
};

const beadPosition = (index, total) => {
  const angle = (index / total) * Math.PI * 2;
  return [
    BEAD_ARC_RADIUS * Math.cos(angle),
    0,
    BEAD_ARC_RADIUS * Math.sin(angle),
  ];
};

// ── A placed charm: hangs between beads, draggable (snaps to bead gaps) ──────
const PlacedCharm = ({ charm, color, beadCount }) => {
  const moveCharm       = useConfiguratorStore((s) => s.moveCharm);
  const setDraggingCharm = useConfiguratorStore((s) => s.setDraggingCharmId);
  const draggingCharmId = useConfiguratorStore((s) => s.draggingCharmId);
  const charmRingColor  = useConfiguratorStore((s) => s.charmRingColor);
  const { invalidate }  = useThree();

  const movable = charm.is_movable !== false;
  const sizeF   = charmSizeFactor(charm.size_mm);
  const angle   = snapAngleToBeadGap(charm.angle ?? 0, beadCount);
  const pos     = charmPlacement(angle);
  const dragging = draggingCharmId === charm.instanceId;

  const onPointerDown = (e) => {
    if (!movable) return;
    e.stopPropagation();
    e.target.setPointerCapture?.(e.pointerId);
    setDraggingCharm(charm.instanceId);
  };
  const onPointerMove = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    const hit = new Vector3();
    if (e.ray.intersectPlane(DRAG_PLANE, hit)) {
      // Snap live so the charm clicks into the gap between beads.
      moveCharm(charm.instanceId, snapAngleToBeadGap(Math.atan2(hit.z, hit.x), beadCount));
      invalidate();
    }
  };
  const onPointerUp = (e) => {
    if (!dragging) return;
    e.stopPropagation();
    e.target.releasePointerCapture?.(e.pointerId);
    setDraggingCharm(null);
  };

  return (
    <group
      position={pos}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Suspense fallback={null}>
        <CharmMesh
          modelUrl={charm.model_file ?? null}
          imageUrl={charm.image ?? charm.preview_image ?? charm.thumbnail ?? null}
          anchorX={charm.variantId ? null : (charm.anchor_x ?? null)}
          anchorY={charm.variantId ? null : (charm.anchor_y ?? null)}
          ringColor={charmRingColor ?? charm.jump_ring_color ?? 'gold'}
          color={color}
          scale={0.9 * sizeF}
        />
      </Suspense>
    </group>
  );
};

const BraceletScene = memo(() => {
  const selectedBeads    = useConfiguratorStore((s) => s.selectedBeads);
  const selectedChain    = useConfiguratorStore((s) => s.selectedChain);
  const selectedCharms   = useConfiguratorStore((s) => s.selectedCharms);
  const selectedColor    = useConfiguratorStore((s) => s.selectedColor);
  const editingBeadIndex = useConfiguratorStore((s) => s.editingBeadIndex);
  const openBeadEditor   = useConfiguratorStore((s) => s.openBeadEditor);

  const colorHex   = selectedColor?.hex_code ?? null;
  const totalBeads = selectedBeads.length;

  const beadRadius = useMemo(() => computeBeadRadius(totalBeads), [totalBeads]);

  // Only recompute positions when the bead count changes — not on color/material updates
  const beadPositions = useMemo(
    () => selectedBeads.map((_, i) => beadPosition(i, totalBeads)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [totalBeads],
  );

  // Stable handler — openBeadEditor is a Zustand action (never re-created)
  const handleBeadClick = useCallback(
    (i) => openBeadEditor(i),
    [openBeadEditor],
  );

  return (
    // scale 0.72 → ~28% smaller so the full bracelet sits with margin in-frame.
    // Uniform scale about the origin keeps bead angles and charm-drag math intact.
    <group position={[0, 0, 0]} scale={0.72}>
      {/* Chain */}
      <Suspense fallback={null}>
        <ChainMesh
          modelUrl={selectedChain?.model_file ?? null}
          length={selectedChain?.thickness_mm ?? null}
          color={colorHex ?? selectedChain?.color?.hex_code ?? null}
        />
      </Suspense>

      {/* Beads — evenly spaced on circular arc, 0 → 2π */}
      {totalBeads > 0 &&
        selectedBeads.map((bead, i) => (
          <BeadMesh
            key={`bead-${bead.id}-${i}`}
            modelUrl={bead.model_file ?? null}
            textureUrl={
              (bead.use_real_photo || bead.is_multi_shade)
                ? (bead.texture ?? bead.image ?? null)
                : null
            }
            fillColor={bead.shade_colors?.[0] ?? bead.color?.hex_code ?? colorHex ?? '#cccccc'}
            shape={bead.shape ?? 'round'}
            beadMaterialType={bead.bead_material_type ?? 'glass'}
            transparency={bead.transparency ?? 'translucent'}
            position={beadPositions[i]}
            color={bead.color?.hex_code ?? colorHex ?? null}
            onClick={() => handleBeadClick(i)}
            isEditing={editingBeadIndex === i}
            radius={beadRadius}
          />
        ))}

      {/* Charms — hang between beads from a hoop-ring; movable ones are draggable */}
      {selectedCharms.map((charm) => (
        <PlacedCharm
          key={charm.instanceId ?? charm.id}
          charm={charm}
          color={colorHex ?? charm.color?.hex_code ?? null}
          beadCount={totalBeads}
        />
      ))}
    </group>
  );
});

BraceletScene.displayName = 'BraceletScene';

export default BraceletScene;
