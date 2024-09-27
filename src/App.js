import React, { useRef, useEffect, useState, useMemo, Suspense } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { useGLTF, OrbitControls, useProgress } from '@react-three/drei';
import Loader from './components/Loader';
import Lenis from '@studio-freight/lenis';
import * as THREE from 'three';
import { isMobile } from 'react-device-detect';
import './App.css';

function CarModel({ scrollY, setIsLoading }) {
  const { scene } = useGLTF('/blender/scene.gltf');
  const [isTextureRemoved, setIsTextureRemoved] = useState(false);
  const { gl, camera } = useThree();
  
  // Store original materials
  const originalMaterials = useMemo(() => {
    const materials = new Map();
    scene.traverse((child) => {
      if (child.isMesh) {
        materials.set(child, child.material);
      }
    });
    return materials;
  }, [scene]);

  useEffect(() => {
    setIsLoading(false);
  }, [scene, setIsLoading]);

  useEffect(() => {
    scene.rotation.y = scrollY * 0.002;
  }, [scrollY, scene]);

  const removeTextures = () => {
    scene.traverse((child) => {
      if (child.isMesh) {
        child.material = new THREE.MeshStandardMaterial({
          color: 0xcccccc, // Light gray color
          metalness: 0.5,
          roughness: 0.5,
        });
      }
    });
    setIsTextureRemoved(true);
  };

  const restoreTextures = () => {
    originalMaterials.forEach((material, mesh) => {
      mesh.material = material;
    });
    setIsTextureRemoved(false);
  };

  const handleClick = (event) => {
    event.stopPropagation();
    if (isTextureRemoved) {
      restoreTextures();
    } else {
      removeTextures();
    }
  };

  useEffect(() => {
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onClick = (event) => {
      // Calculate mouse position in normalized device coordinates
      mouse.x = (event.clientX / gl.domElement.clientWidth) * 2 - 1;
      mouse.y = -(event.clientY / gl.domElement.clientHeight) * 2 + 1;

      // Update the picking ray with the camera and mouse position
      raycaster.setFromCamera(mouse, camera);

      // Calculate objects intersecting the picking ray
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length > 0) {
        handleClick(event);
      }
    };

    gl.domElement.addEventListener('click', onClick);

    return () => {
      gl.domElement.removeEventListener('click', onClick);
    };
  }, [gl, camera, scene, handleClick]);

  return <primitive object={scene} />;
}

function CameraController({ scrollY }) {
  const { camera } = useThree();
  
  useFrame(() => {
    if (scrollY > 2000) {
      camera.position.lerp(new THREE.Vector3(0, 1, 3), 0.01);
    } else {
      camera.position.lerp(new THREE.Vector3(0, 2, 4), 0.01);
    }
  });

  return null;
}

function Resize() {
  const { gl, camera } = useThree();

  useEffect(() => {
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      gl.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [gl, camera]);

  return null;
}

function DynamicPointLight({ scrollY, intensity, color, position }) {
  const light = useRef();
  const tealColor = new THREE.Color(0x00ffff);
  const endColor = color == 'red' ? new THREE.Color(0xff0000) : new THREE.Color(0x800080);

  useFrame(() => {
    if (scrollY > 2000) {
      light.current.color.lerp(tealColor, 0.1);
    } else {
      light.current.color.lerp(endColor, 0.1);
    }
  });

  return <pointLight ref={light} position={position} intensity={intensity} />;
}


function App() {
  const [scrollY, setScrollY] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const lenisRef = useRef();

  useEffect(() => {
    lenisRef.current = new Lenis({
      duration: 5,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    function raf(time) {
      lenisRef.current.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    lenisRef.current.on('scroll', ({ scroll }) => {
      setScrollY(scroll);
       // Check if we've scrolled to section 3
       const section3 = document.getElementById('section3');
       if (section3) {
         const section3Top = section3.offsetTop;
         if (scroll >= section3Top) {
           document.body.classList.add('last');
         } else {
           document.body.classList.remove('last');
         }
       }
    });

    useGLTF.preload('/blender/scene.gltf');

    return () => {
      lenisRef.current.destroy();
      document.body.classList.remove('last');
    };
  }, []);

  const handleScrollTo = (target) => {
    lenisRef.current.scrollTo(target);
  };

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) {
      const preventTouch = (e) => {
        e.preventDefault();
      };
      canvas.addEventListener('touchstart', preventTouch, { passive: false });
      canvas.addEventListener('touchmove', preventTouch, { passive: false });
      return () => {
        canvas.removeEventListener('touchstart', preventTouch);
        canvas.removeEventListener('touchmove', preventTouch);
      };
    }
  }, []);

  return (
    <div className="App">
      {isLoading && <Loader />}
      <Canvas camera={{ position: [0, 0, 5], fov: 75 }} className='canvas-wrapper'>
        <Suspense fallback={null}>
          <ambientLight color='teal' intensity={2} />
          <ambientLight color='white' intensity={0.5} />
          <pointLight color='white' position={[0, 2, 0]} intensity={4} />
          <pointLight color='red' position={[-2, 2, -2]} intensity={10} />
          <pointLight color='purple' position={[2, 2, 2]} intensity={10} />
          <DynamicPointLight scrollY={scrollY} intensity={10} color='red' position={[-2, 2, -2]}/>
          <DynamicPointLight scrollY={scrollY} intensity={10} color='purple' position={[2, 2, 2]}/>
          <directionalLight color='teal' position={[0, 5, 0]} intensity={2} />
          <directionalLight color='teal' position={[0, -5, 0]} intensity={10} />
          <CarModel setIsLoading={setIsLoading} scrollY={scrollY} />
          <CameraController scrollY={scrollY} />
          {!isMobile && <OrbitControls enableZoom={false} enablePan={false} />}
          <Resize />
        </Suspense>
      </Canvas>
      <div className="scroll-content">
        <section className='hero'>
          <h1>Aston Martin F1</h1>
          <h1>AMR23 2023</h1>
        </section>
        <nav>
          <button onClick={() => handleScrollTo('#section1')}>Jacques Villeneuve</button>
          <button onClick={() => handleScrollTo('#section2')}>Podiums</button>
          <button onClick={() => handleScrollTo('#section3')}>Points</button>
        </nav>
        <section id="section1">
          <h2>I don't really listen to Jacques Villeneuve anymore.</h2>
          <p>Lance Stroll</p>
        </section>
        <section id="section2">
          <h2>3/161</h2>
          <p>Podiums.</p>
        </section>
        <section id="section3">
          <h2>292 Points</h2>
          <p>Since 2019.</p>
        </section>
      </div>
    </div>
  );
}

export default App;