import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export function ParticleField({ reducedMotion = false }: { reducedMotion?: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const mistRef = useRef<THREE.Points>(null);

  const particles = useMemo(() => {
    const count = reducedMotion ? 260 : 520;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = ["#426dff", "#8f5cff", "#32e6a1", "#ffb13d", "#f7fbff"].map((value) => new THREE.Color(value));
    for (let index = 0; index < count; index += 1) {
      const radius = 16 + Math.random() * 64;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[index * 3] = radius * Math.sin(phi) * Math.cos(theta);
      positions[index * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.62;
      positions[index * 3 + 2] = radius * Math.cos(phi);
      const color = palette[index % palette.length].clone().lerp(new THREE.Color("#02030b"), Math.random() * 0.35);
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [reducedMotion]);

  const mist = useMemo(() => {
    const count = reducedMotion ? 42 : 90;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const palette = ["#7d5cff", "#42a8ff", "#36f4f1", "#ff4fc4"].map((value) => new THREE.Color(value));
    for (let index = 0; index < count; index += 1) {
      const band = index / count;
      const angle = band * Math.PI * 10 + Math.random();
      const radius = 11 + Math.random() * 38;
      positions[index * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 8;
      positions[index * 3 + 1] = Math.sin(angle * 0.7) * 8 + (Math.random() - 0.5) * 5;
      positions[index * 3 + 2] = Math.sin(angle) * radius + (Math.random() - 0.5) * 8;
      const color = palette[index % palette.length].clone();
      colors[index * 3] = color.r;
      colors[index * 3 + 1] = color.g;
      colors[index * 3 + 2] = color.b;
    }
    return { positions, colors };
  }, [reducedMotion]);

  useFrame((_, delta) => {
    if (reducedMotion) return;
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.008;
      pointsRef.current.rotation.x += delta * 0.003;
    }
    if (mistRef.current) {
      mistRef.current.rotation.y -= delta * 0.012;
      mistRef.current.rotation.z += delta * 0.004;
    }
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={particles.positions.length / 3} array={particles.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={particles.colors.length / 3} array={particles.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.08} vertexColors transparent opacity={0.52} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
      <points ref={mistRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" count={mist.positions.length / 3} array={mist.positions} itemSize={3} />
          <bufferAttribute attach="attributes-color" count={mist.colors.length / 3} array={mist.colors} itemSize={3} />
        </bufferGeometry>
        <pointsMaterial size={0.42} vertexColors transparent opacity={0.045} blending={THREE.AdditiveBlending} depthWrite={false} />
      </points>
    </>
  );
}
