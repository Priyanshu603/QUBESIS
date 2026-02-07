import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import * as THREE from 'three';

const Asteroid = ({ position, size, color }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });

  return (
    <Sphere ref={meshRef} position={position} args={[size, 16, 16]}>
      <meshStandardMaterial color={color} />
    </Sphere>
  );
};

const Earth = () => {
  return (
    <Sphere position={[0, 0, 0]} args={[1, 32, 32]}>
      <meshStandardMaterial color="blue" />
    </Sphere>
  );
};

const Asteroid3D = ({ asteroids }) => {
  const asteroidData = useMemo(() => {
    return asteroids.map((asteroid, index) => {
      const distance = (asteroid.miss_distance / 1000000) * 0.1; // Scale down for visualization
      const angle = (index / asteroids.length) * Math.PI * 2;
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;
      const size = Math.max(0.05, asteroid.diameter_max * 0.01);
      const color = asteroid.is_hazardous ? 'red' : 'orange';

      return {
        id: asteroid.id,
        position: [x, 0, z],
        size,
        color
      };
    });
  }, [asteroids]);

  return (
    <div style={{ height: '400px', width: '100%' }}>
      <Canvas camera={{ position: [0, 5, 10], fov: 60 }}>
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} />
        <Earth />
        {asteroidData.map((asteroid) => (
          <Asteroid
            key={asteroid.id}
            position={asteroid.position}
            size={asteroid.size}
            color={asteroid.color}
          />
        ))}
        <OrbitControls enablePan={true} enableZoom={true} enableRotate={true} />
      </Canvas>
    </div>
  );
};

export default Asteroid3D;
