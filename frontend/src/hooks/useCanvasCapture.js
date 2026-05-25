// frontend/src/hooks/useCanvasCapture.js
import { useCallback } from 'react';

/**
 * Returns capturePreview() which reads the current frame from a WebGL/2D canvas.
 *
 * canvasRef may point to:
 *   • a <canvas> element directly, or
 *   • any container element — the hook finds the first <canvas> inside it.
 *
 * Requires the Canvas to be created with preserveDrawingBuffer: true;
 * otherwise the GPU buffer is cleared after presentation and the capture
 * will return a transparent / black image.
 */
const useCanvasCapture = (canvasRef) => {
  const capturePreview = useCallback(() => {
    try {
      let el = canvasRef?.current;
      if (!el) return null;

      // If ref points to a wrapper, find the canvas inside
      if (el.tagName !== 'CANVAS') {
        el = el.querySelector('canvas');
      }
      if (!el) return null;

      return el.toDataURL('image/png');
    } catch (err) {
      console.error('useCanvasCapture: failed to capture canvas', err);
      return null;
    }
  }, [canvasRef]);

  return { capturePreview };
};

export default useCanvasCapture;
