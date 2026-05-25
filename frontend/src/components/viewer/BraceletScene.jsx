// frontend/src/components/viewer/BraceletScene.jsx
import { memo, useMemo, useCallback, Suspense } from 'react';
import useConfiguratorStore from '../../stores/configuratorStore';
import BeadMesh from './BeadMesh';
import ChainMesh from './ChainMesh';
import CharmMesh from './CharmMesh';

const BEAD_ARC_RADIUS = 2.5;
const MAX_CHARM_SLOTS = 4;

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

const charmPosition = (index) => {
  const angle = (index / MAX_CHARM_SLOTS) * Math.PI * 2;
  return [
    BEAD_ARC_RADIUS * Math.cos(angle),
    -0.22,
    BEAD_ARC_RADIUS * Math.sin(angle),
  ];
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
    <group position={[0, 0, 0]}>
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
          <Suspense key={`bead-${bead.id}-${i}`} fallback={null}>
            <BeadMesh
              modelUrl={bead.model_file ?? null}
              position={beadPositions[i]}
              color={bead.color?.hex_code ?? colorHex ?? null}
              onClick={() => handleBeadClick(i)}
              isEditing={editingBeadIndex === i}
              radius={beadRadius}
            />
          </Suspense>
        ))}

      {/* Charms — up to 4 evenly spaced positions */}
      {selectedCharms.slice(0, MAX_CHARM_SLOTS).map((charm, i) => (
        <Suspense key={`charm-${charm.id}-${i}`} fallback={null}>
          <CharmMesh
            modelUrl={charm.model_file ?? null}
            position={charmPosition(i)}
            color={colorHex ?? charm.color?.hex_code ?? null}
          />
        </Suspense>
      ))}
    </group>
  );
});

BraceletScene.displayName = 'BraceletScene';

export default BraceletScene;
