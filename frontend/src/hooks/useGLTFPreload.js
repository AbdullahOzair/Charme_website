// frontend/src/hooks/useGLTFPreload.js
import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';

const useGLTFPreload = (urls = []) => {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const valid = urls.filter(Boolean);
    if (!valid.length) return;

    setLoading(true);
    valid.forEach((url) => {
      try {
        useGLTF.preload(url);
      } catch (err) {
        console.warn('useGLTFPreload: failed to preload', url, err);
      }
    });
    setLoading(false);
  }, [JSON.stringify(urls)]);

  return { loading };
};

export default useGLTFPreload;
