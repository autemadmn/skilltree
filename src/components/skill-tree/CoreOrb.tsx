import { Billboard, Text } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";
import { tupleToVector } from "../../utils/geometry";
import { OrbGlow } from "./OrbGlow";

type CoreOrbProps = {
  node: OrbNode;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
};

export function CoreOrb({ node, isSelected, isHovered, isHighlighted, isDimmed }: CoreOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const energyRef = useRef<THREE.Group>(null);
  const selectOrb = useKnowledgeStore((state) => state.selectOrb);
  const hoverOrb = useKnowledgeStore((state) => state.hoverOrb);
  const openInterior = useKnowledgeStore((state) => state.openInterior);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);
  const position = useMemo(() => tupleToVector(node.position), [node.position]);
  const radius = 2.25;

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    if (groupRef.current) {
      const scale = isSelected || isHovered || isHighlighted ? 1.08 : 1;
      groupRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
      if (!reducedMotion) groupRef.current.rotation.y += delta * 0.035;
    }
    if (energyRef.current) {
      energyRef.current.rotation.x = reducedMotion ? 0.12 : Math.sin(time * 0.28) * 0.18;
      if (!reducedMotion) {
        energyRef.current.rotation.y += delta * 0.22;
        energyRef.current.rotation.z -= delta * 0.12;
      }
    }
  });

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    if (event.delta > 6) return;
    selectOrb(node.id);
  };

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleSelect}
      onDoubleClick={(event) => {
        event.stopPropagation();
        if (event.delta > 6) return;
        openInterior(node.id);
      }}
      onPointerOver={(event) => {
        event.stopPropagation();
        document.body.classList.add("is-grabbing-orb");
        hoverOrb(node.id);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        document.body.classList.remove("is-grabbing-orb");
        hoverOrb(null);
      }}
    >
      <OrbGlow color={node.color} radius={radius} intensity={1.3} selected={isSelected || isHovered} highlighted={isHighlighted} dimmed={isDimmed} />
      <mesh>
        <sphereGeometry args={[radius, 42, 32]} />
        <meshPhysicalMaterial
          color="#dce7ff"
          roughness={0.08}
          metalness={0.08}
          clearcoat={1}
          transmission={0.72}
          thickness={2.4}
          transparent
          opacity={0.48}
          emissive="#88bbff"
          emissiveIntensity={0.85}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={0.48}>
        <sphereGeometry args={[radius, 24, 18]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.82} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <group ref={energyRef}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[radius * 1.03, radius * 0.018, 8, 72]} />
          <meshBasicMaterial color="#9bbdff" transparent opacity={0.92} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[0.3, Math.PI / 2.3, 0.7]}>
          <torusGeometry args={[radius * 1.33, radius * 0.012, 8, 72]} />
          <meshBasicMaterial color="#c695ff" transparent opacity={0.58} blending={THREE.AdditiveBlending} />
        </mesh>
        <mesh rotation={[1.1, 0.3, Math.PI / 2]}>
          <torusGeometry args={[radius * 1.68, radius * 0.01, 8, 72]} />
          <meshBasicMaterial color="#54f4ff" transparent opacity={0.42} blending={THREE.AdditiveBlending} />
        </mesh>
      </group>
      <Billboard position={[0, radius * 1.5, 0]}>
        <Suspense fallback={null}>
          <Text
            color="#f8fbff"
            fontSize={0.42}
            anchorX="center"
            anchorY="middle"
            maxWidth={4.2}
            outlineWidth={0.025}
            outlineColor="#02030b"
          >
            Curiosity Core
          </Text>
        </Suspense>
      </Billboard>
    </group>
  );
}
