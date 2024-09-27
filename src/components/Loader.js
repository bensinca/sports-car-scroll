import React from 'react';
import { useProgress } from '@react-three/drei';

function Loader() {
  const { progress } = useProgress();
  return (
    <div className="loader">
      <div className="loader-bar" style={{ width: `${progress}%` }}></div>
      <div className="loader-text">{progress.toFixed(2)}% loaded</div>
    </div>
  );
}

export default Loader;