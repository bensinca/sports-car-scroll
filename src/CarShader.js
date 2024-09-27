import { shaderMaterial } from '@react-three/drei';
import { extend } from '@react-three/fiber';
import * as THREE from 'three';

const CarShaderMaterial = shaderMaterial(
  {
    time: 0,
    color: new THREE.Color(0.2, 0.0, 0.1),
  },
  // Vertex shader
  `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  // Fragment shader
  `
    uniform float time;
    uniform vec3 color;
    varying vec2 vUv;
    void main() {
      vec2 uv = vUv;
      vec3 finalColor = color;
      finalColor += 0.1 * sin(uv.x * 10.0 + time) * sin(uv.y * 10.0 + time);
      gl_FragColor = vec4(finalColor, 1.0);
    }
  `
);

extend({ CarShaderMaterial });

export { CarShaderMaterial };