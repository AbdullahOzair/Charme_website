// frontend/src/hooks/useHandModel.js
// Preloads the hand GLB in the background when the configurator mounts,
// so the model is cached before the user clicks "Try On Hand".
import { useEffect, useState } from 'react';
import { useGLTF } from '@react-three/drei';

const useHandModel = () => {
  const [isPreloaded, setIsPreloaded] = useState(false);

  useEffect(() => {
    try {
      useGLTF.preload('/models/hand/hand.glb');
      setIsPreloaded(true);
    } catch {
      // GLB not present — HandModel has its own fallback, no crash here
      setIsPreloaded(false);
    }
  }, []);

  return { isPreloaded };
};

export default useHandModel;
