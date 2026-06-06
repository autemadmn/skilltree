import { Billboard, Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const labels = ["Notes", "Sources", "Ideas", "Quotes", "Books", "PDFs", "Linked Concepts", "Reflections"];

export function HolographicBookLabels({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState<string | null>(null);
  const positions = useMemo(
    () =>
      labels.map((label, index) => {
        const angle = (index / labels.length) * Math.PI * 2;
        const radius = index % 2 ? 4.7 : 4.1;
        return {
          label,
          position: [Math.cos(angle) * radius, 1.2 + Math.sin(index * 1.7) * 1.3, Math.sin(angle) * radius] as [number, number, number]
        };
      }),
    []
  );

  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.045;
  });

  return (
    <group ref={groupRef}>
      {positions.map((item) => {
        const active = hovered === item.label;
        return (
          <Billboard
            key={item.label}
            position={item.position}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(item.label);
            }}
            onPointerOut={(event) => {
              event.stopPropagation();
              setHovered(null);
            }}
          >
            <group scale={active ? 1.08 : 1}>
              <mesh scale={[1.18 + item.label.length * 0.05, 0.42, 0.04]}>
                <boxGeometry args={[1, 1, 1]} />
                <meshBasicMaterial color="#06152b" transparent opacity={active ? 0.66 : 0.42} />
              </mesh>
              <Suspense fallback={null}>
                <Text fontSize={0.19} color={active ? "#ffffff" : "#dbe8ff"} anchorX="center" anchorY="middle" maxWidth={2.4}>
                  {item.label}
                </Text>
              </Suspense>
              <mesh position={[0, -0.24, 0]}>
                <boxGeometry args={[1.0 + item.label.length * 0.065, 0.015, 0.02]} />
                <meshBasicMaterial color={active ? "#ffffff" : color} transparent opacity={0.72} blending={THREE.AdditiveBlending} />
              </mesh>
            </group>
          </Billboard>
        );
      })}
    </group>
  );
}
