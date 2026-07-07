// frontend/src/components/viewer/CharmMesh.jsx
// Renders a charm at the local origin (the parent group handles positioning).
import { Component, Suspense, useState, useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import { Texture, SRGBColorSpace } from 'three';

// Only real 3D models belong in model_file — ignore stray images (e.g. a PNG
// uploaded by mistake) so useGLTF never tries to parse them and crash.
const isModelUrl = (url) => typeof url === 'string' && /\.(glb|gltf)(\?|$)/i.test(url);

// Analyze a charm image: find the attach point (loop) AND the content bounding
// box, so the charm can be sized by its actual shape (ignoring image whitespace)
// and hung from its loop. All values are fractions (0–1). null if unreadable.
function analyzeCharm(img) {
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  if (!w || !h) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);

  let px;
  try {
    px = ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null; // tainted (no CORS)
  }

  const at = (x, y) => { const i = (y * w + x) * 4; return [px[i], px[i + 1], px[i + 2], px[i + 3]]; };
  const corners = [at(0, 0), at(w - 1, 0), at(0, h - 1), at(w - 1, h - 1)];
  const opaque = corners.filter((c) => c[3] >= 32);
  const bg = opaque.length
    ? [0, 1, 2].map((k) => Math.round(opaque.reduce((s, c) => s + c[k], 0) / opaque.length))
    : null;
  const isFg = (x, y) => {
    const [r, g, b, a] = at(x, y);
    if (a < 32) return false;
    if (bg && Math.abs(r - bg[0]) + Math.abs(g - bg[1]) + Math.abs(b - bg[2]) < 60) return false;
    return true;
  };

  const step = Math.max(1, Math.floor(Math.min(w, h) / 300));

  // Content bounding box + topmost row (the loop).
  let x0 = w, y0 = h, x1 = 0, y1 = 0, yTop = -1, found = false;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
      if (isFg(x, y)) {
        found = true;
        if (yTop < 0) yTop = y;
        if (x < x0) x0 = x; if (x > x1) x1 = x;
        if (y < y0) y0 = y; if (y > y1) y1 = y;
      }
    }
  }
  if (!found) return { ax: 0.5, ay: 0.06, contentW: 1, contentH: 1 };

  // Horizontal centroid of foreground within a thin band below yTop → the loop.
  const band = Math.max(step, Math.round(h * 0.08));
  let sum = 0, count = 0;
  for (let y = yTop; y < Math.min(h, yTop + band); y += step) {
    for (let x = 0; x < w; x += step) {
      if (isFg(x, y)) { sum += x; count += 1; }
    }
  }
  const xC = count ? sum / count : w / 2;
  return {
    ax: xC / w,
    ay: yTop / h,
    contentW: (x1 - x0 + step) / w,
    contentH: (y1 - y0 + step) / h,
  };
}

const GLTFCharmInner = ({ modelUrl, scale }) => {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene.clone(true)} scale={scale} />;
};

// Charm rendered from its 2D photo — a camera-facing sprite pinned by its loop
// so it hangs BELOW the wire (the wire passes over the top through the hoop-ring).
// Join point priority: manual (anchorX/anchorY) → auto-detected → top-centre.
// Hoop/jump-ring metal colours.
const RING_COLORS = {
  gold:   '#d4af37',
  silver: '#cfd4d8',
};

// Target world size of a charm's actual content (the visible shape) at scale 1.
const CHARM_CONTENT_SIZE = 1.15;

const CharmSprite = ({ imageUrl, anchorX, anchorY, ringColor, scale }) => {
  const [texture, setTexture]   = useState(null);
  const [aspect, setAspect]     = useState(1);
  const [detected, setDetected] = useState({ ax: 0.5, ay: 0.06 });
  // Fraction of the image the charm actually fills — used to size by content,
  // not by the image's whitespace, so same-size charms render the same size.
  const [content, setContent]   = useState({ w: 1, h: 1 });
  const spriteRef               = useRef();
  const { invalidate }          = useThree();

  const hasManual = anchorX != null && anchorY != null;

  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      const tex = new Texture(img);
      tex.colorSpace = SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
      setAspect(img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 1);
      const a = analyzeCharm(img);
      if (a) {
        if (!hasManual) setDetected({ ax: a.ax, ay: a.ay });
        setContent({ w: a.contentW, h: a.contentH });
      }
      invalidate();
    };
    img.onerror = () => { if (!cancelled) console.warn('Charm image failed:', imageUrl); };
    img.src = imageUrl;
    return () => { cancelled = true; };
  }, [imageUrl, hasManual, invalidate]);

  // Pin the sprite by its loop so the body hangs below the pivot (the wire).
  useEffect(() => {
    const s = spriteRef.current;
    if (!s) return;
    const ax = hasManual ? anchorX : detected.ax;
    const ay = hasManual ? anchorY : detected.ay;
    s.center.set(ax, 1 - ay);
    invalidate();
  }, [texture, detected, hasManual, anchorX, anchorY, invalidate]);

  // Repaint when the ring colour changes (frameloop is on-demand).
  useEffect(() => { invalidate(); }, [ringColor, invalidate]);

  if (!texture) return null;

  // Size the sprite so the CONTENT's larger dimension equals the target, so the
  // rendered charm is a consistent size regardless of the image's padding.
  const contentSpan = Math.max(content.h, content.w * aspect) || 1;
  const h = (CHARM_CONTENT_SIZE * scale) / contentSpan;
  const w = h * aspect;
  const ringR = 0.05 * scale;

  return (
    <group>
      <sprite ref={spriteRef} scale={[w, h, 1]}>
        <spriteMaterial map={texture} transparent alphaTest={0.4} toneMapped={false} />
      </sprite>
      {/* Hoop-ring sits on the wire (group origin); the charm hangs below it. */}
      <mesh>
        <torusGeometry args={[ringR, ringR * 0.32, 8, 20]} />
        <meshStandardMaterial
          color={RING_COLORS[ringColor] ?? RING_COLORS.gold}
          metalness={0.9}
          roughness={ringColor === 'silver' ? 0.15 : 0.25}
        />
      </mesh>
    </group>
  );
};

const FallbackCharm = ({ color, scale }) => (
  <mesh castShadow scale={scale}>
    <octahedronGeometry args={[0.15, 0]} />
    <meshStandardMaterial
      color={color ?? '#d4af37'}
      metalness={0.7}
      roughness={0.2}
    />
  </mesh>
);

// Never let a bad/broken model file crash the whole canvas.
class ModelErrorBoundary extends Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(err) { console.warn('Charm model failed to load:', err?.message ?? err); }
  render() { return this.state.hasError ? this.props.fallback : this.props.children; }
}

const CharmMesh = ({ modelUrl, imageUrl, anchorX, anchorY, ringColor, color, scale = 1 }) => {
  const fallback = imageUrl
    ? <CharmSprite imageUrl={imageUrl} anchorX={anchorX} anchorY={anchorY} ringColor={ringColor} scale={scale} />
    : <FallbackCharm color={color} scale={scale} />;

  if (!isModelUrl(modelUrl)) return fallback;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Suspense fallback={fallback}>
        <GLTFCharmInner modelUrl={modelUrl} scale={scale} />
      </Suspense>
    </ModelErrorBoundary>
  );
};

export default CharmMesh;
