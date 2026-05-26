// frontend/src/components/viewer/BeadMesh.jsx
import { memo, useState, useEffect, Component, Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { TextureLoader, SRGBColorSpace } from 'three';
import { useThree } from '@react-three/fiber';

const SEG = 56; // sphere segments — smooth silhouette

export const preloadBeadModel = (url) => { if (url) useGLTF.preload(url); };

// ── Material presets ────────────────────────────────────────────────────────
// Each preset is tuned to the physical properties of that bead material.
// envMapIntensity: how strongly the IBL environment map reflects on this surface.
// transmission / ior / thickness / attenuationDistance: physical glass/crystal params.
const MATERIAL_PRESETS = {
  crystal: {
    // Gem-like: colored surface + attenuation depth + strong clearcoat
    // transmission 0.55 = semi-transparent, color is visible, not a clear glass ball
    transmission: 0.55, roughness: 0.0, metalness: 0,
    ior: 1.9,            thickness: 2.0,
    clearcoat: 1.0,      clearcoatRoughness: 0.0,
    reflectivity: 1,     envMapIntensity: 1.2,
    attenuationDistance: 0.6,
  },
  glass: {
    transmission: 0.65, roughness: 0.03, metalness: 0,
    ior: 1.52,           thickness: 1.0,
    clearcoat: 0.9,      clearcoatRoughness: 0.03,
    envMapIntensity: 1.0,
    attenuationDistance: 0.9,
  },
  stone: {
    // Jade/agate: slightly translucent, waxy surface
    transmission: 0.06, roughness: 0.25, metalness: 0,
    ior: 1.62,           thickness: 0.3,
    clearcoat: 0.5,      clearcoatRoughness: 0.15,
    envMapIntensity: 1.0,
  },
  metal: {
    transmission: 0, roughness: 0.1, metalness: 1,
    ior: 1.5,
    envMapIntensity: 2.0,
  },
  resin: {
    transmission: 0.30, roughness: 0.06, metalness: 0,
    ior: 1.50,           thickness: 0.7,
    clearcoat: 0.9,      clearcoatRoughness: 0.05,
    envMapIntensity: 1.0,
    attenuationDistance: 0.8,
  },
  pearl: {
    transmission: 0, roughness: 0.06, metalness: 0.3,
    ior: 1.53,
    clearcoat: 1.0,  clearcoatRoughness: 0.02,
    sheen: 1,        sheenRoughness: 0.2,
    envMapIntensity: 1.5,
  },
  wood: {
    transmission: 0, roughness: 0.72, metalness: 0,
    ior: 1.5,
    envMapIntensity: 0.5,
  },
  ceramic: {
    transmission: 0, roughness: 0.12, metalness: 0,
    ior: 1.5,
    clearcoat: 0.85, clearcoatRoughness: 0.05,
    envMapIntensity: 1.2,
  },
  other: {
    transmission: 0.18, roughness: 0.14, metalness: 0,
    ior: 1.5,            thickness: 0.5,
    clearcoat: 0.6,      clearcoatRoughness: 0.12,
    envMapIntensity: 1.0,
    attenuationDistance: 0.8,
  },
};
const DEFAULT_PRESET = MATERIAL_PRESETS.glass;

// Returns material props merged with transparency and color adjustments.
function resolvePreset(beadMaterialType, transparency, colorHex) {
  const base = { ...(MATERIAL_PRESETS[beadMaterialType] ?? DEFAULT_PRESET) };

  const isGlassy = base.transmission > 0.1 && base.attenuationDistance !== undefined;

  if (isGlassy && colorHex && transparency !== 'opaque') {
    // attenuationColor adds color-depth: bead gets richer/darker toward center
    base.attenuationColor = colorHex;
    if (transparency === 'translucent') base.transmission = Math.min(base.transmission, 0.30);
  } else {
    if (transparency === 'opaque') base.transmission = 0;
    else if (transparency === 'translucent') base.transmission = Math.min(base.transmission ?? 0, 0.25);
    delete base.attenuationColor;
    delete base.attenuationDistance;
  }

  if (beadMaterialType === 'pearl' && colorHex) {
    base.sheenColor = colorHex;
  }

  return base;
}

// ── GLTF error boundary ────────────────────────────────────────────────────
class ModelErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.warn('GLTF load failed:', err?.message ?? err); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

// ── Geometry per shape ─────────────────────────────────────────────────────
function ShapedMesh({ shape, radius, children }) {
  switch (shape) {
    case 'oval':
      return (
        <mesh castShadow receiveShadow scale={[1.3, 0.72, 1.3]}>
          <sphereGeometry args={[radius, SEG, SEG]} />
          {children}
        </mesh>
      );
    case 'cube':
      return (
        <mesh castShadow receiveShadow>
          <boxGeometry args={[radius * 1.75, radius * 1.75, radius * 1.75]} />
          {children}
        </mesh>
      );
    case 'faceted':
      // Icosahedron detail=1 → 80 triangular faces, gem-like multifaceted look
      return (
        <mesh castShadow receiveShadow>
          <icosahedronGeometry args={[radius, 1]} />
          {children}
        </mesh>
      );
    default: // round
      return (
        <mesh castShadow receiveShadow>
          <sphereGeometry args={[radius, SEG, SEG]} />
          {children}
        </mesh>
      );
  }
}

// ── Physics-based bead (main renderer) ────────────────────────────────────
const PhysicalBead = memo(({ color, shape, beadMaterialType, transparency, isEditing, radius }) => {
  const matProps  = resolvePreset(beadMaterialType, transparency, color);
  const hexColor  = color ?? '#c8a0d8';

  return (
    <ShapedMesh shape={shape} radius={radius}>
      <meshPhysicalMaterial
        color={hexColor}
        emissive={isEditing ? '#ffffff' : '#000000'}
        emissiveIntensity={isEditing ? 0.12 : 0}
        {...matProps}
      />
    </ShapedMesh>
  );
});
PhysicalBead.displayName = 'PhysicalBead';

// ── MatCap textured bead (patterned: millefiori, crackle, etc.) ───────────
// Imperative TextureLoader — never throws inside React, never crashes the canvas.
const TexturedBead = memo(({ textureUrl, shape, isEditing, radius }) => {
  const [texture, setTexture] = useState(null);
  const { invalidate }        = useThree();

  useEffect(() => {
    setTexture(null);
    let cancelled = false;
    const loader  = new TextureLoader();
    loader.load(
      textureUrl,
      (tex) => {
        if (cancelled) { tex.dispose(); return; }
        tex.colorSpace  = SRGBColorSpace;
        tex.needsUpdate = true;
        setTexture(tex);
        invalidate();
      },
      undefined,
      (err) => { if (!cancelled) console.warn('Texture load failed:', textureUrl, err?.message); },
    );
    return () => { cancelled = true; };
  }, [textureUrl, invalidate]);

  if (!texture) {
    return (
      <ShapedMesh shape={shape} radius={radius}>
        <meshPhysicalMaterial
          color="#e8e8e8"
          transmission={0.4}
          roughness={0.08}
          ior={1.5}
          clearcoat={0.9}
          envMapIntensity={2.0}
          emissive={isEditing ? '#ffffff' : '#000000'}
          emissiveIntensity={isEditing ? 0.12 : 0}
        />
      </ShapedMesh>
    );
  }

  return (
    <ShapedMesh shape={shape} radius={radius}>
      <meshMatcapMaterial matcap={texture} />
    </ShapedMesh>
  );
});
TexturedBead.displayName = 'TexturedBead';

// ── GLTF bead ──────────────────────────────────────────────────────────────
const GLTFBeadInner = memo(({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene.clone(true)} />;
});
GLTFBeadInner.displayName = 'GLTFBeadInner';

// ── BeadMesh (public API) ──────────────────────────────────────────────────
const BeadMesh = memo(({
  modelUrl,
  textureUrl,
  position,
  color,
  shape            = 'round',
  beadMaterialType = 'glass',
  transparency     = 'translucent',
  onClick,
  isEditing,
  radius           = 0.35,
}) => {
  const physicalFallback = (
    <PhysicalBead
      color={color}
      shape={shape}
      beadMaterialType={beadMaterialType}
      transparency={transparency}
      isEditing={isEditing}
      radius={radius}
    />
  );

  return (
    <group position={position} onClick={onClick} scale={isEditing ? 1.18 : 1}>
      {modelUrl ? (
        <ModelErrorBoundary fallback={physicalFallback}>
          <Suspense fallback={physicalFallback}>
            <GLTFBeadInner modelUrl={modelUrl} />
          </Suspense>
        </ModelErrorBoundary>
      ) : textureUrl ? (
        <TexturedBead
          textureUrl={textureUrl}
          shape={shape}
          isEditing={isEditing}
          radius={radius}
        />
      ) : (
        physicalFallback
      )}
    </group>
  );
});
BeadMesh.displayName = 'BeadMesh';

export default BeadMesh;
