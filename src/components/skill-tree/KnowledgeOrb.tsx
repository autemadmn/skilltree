import { Billboard, Text } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import type { OrbNode } from "../../types/models";
import { tupleToVector } from "../../utils/geometry";
import { OrbGlow } from "./OrbGlow";

type KnowledgeOrbProps = {
  node: OrbNode;
  isSelected: boolean;
  isHovered: boolean;
  isHighlighted: boolean;
  isDimmed: boolean;
};

export function KnowledgeOrb({ node, isSelected, isHovered, isHighlighted, isDimmed }: KnowledgeOrbProps) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Group>(null);
  const particleRef = useRef<THREE.Group>(null);
  const spawnStartRef = useRef(0);
  const selectOrb = useKnowledgeStore((state) => state.selectOrb);
  const hoverOrb = useKnowledgeStore((state) => state.hoverOrb);
  const openInterior = useKnowledgeStore((state) => state.openInterior);
  const recentOrbId = useKnowledgeStore((state) => state.recentOrbId);
  const showLabels = useKnowledgeStore((state) => state.settings.showLabels);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);
  const position = useMemo(() => tupleToVector(node.position), [node.position]);
  const isNew = recentOrbId === node.id;

  useEffect(() => {
    if (isNew) spawnStartRef.current = performance.now() / 1000;
  }, [isNew]);

  const radius = useMemo(() => {
    if (node.type === "section") return 1.42 + node.importance * 0.05;
    if (node.type === "person" || node.type === "project") return 0.94 + node.importance * 0.04;
    return 0.66 + node.importance * 0.035;
  }, [node.importance, node.type]);

  const orbitingParticles = useMemo(
    () =>
      Array.from({ length: node.type === "section" ? 5 : 3 }, (_, index) => {
        const angle = (index / (node.type === "section" ? 5 : 3)) * Math.PI * 2;
        return {
          position: [
            Math.cos(angle) * radius * (1.55 + (index % 2) * 0.16),
            Math.sin(angle * 1.7) * radius * 0.34,
            Math.sin(angle) * radius * (1.15 + (index % 3) * 0.11)
          ] as [number, number, number],
          scale: 0.025 + (index % 3) * 0.012
        };
      }),
    [node.type, radius]
  );

  useFrame(({ clock }, delta) => {
    const group = groupRef.current;
    if (!group) return;
    const time = clock.getElapsedTime();
    const selectedBoost = isSelected || isHovered || isHighlighted ? 1.15 : 1;
    const dim = isDimmed ? 0.74 : 1;
    const spawnScale = isNew ? Math.min(1, (performance.now() / 1000 - spawnStartRef.current) / 0.85) : 1;
    const bob = reducedMotion ? 0 : Math.sin(time * 0.82 + position.x * 0.25) * 0.055;
    group.position.set(position.x, position.y + bob, position.z);
    group.scale.lerp(new THREE.Vector3(selectedBoost * dim * spawnScale, selectedBoost * dim * spawnScale, selectedBoost * dim * spawnScale), 0.12);
    if (!reducedMotion) group.rotation.y += delta * (0.035 + node.importance * 0.004);
    if (!reducedMotion && ringRef.current) ringRef.current.rotation.z -= delta * 0.32;
    if (!reducedMotion && particleRef.current) particleRef.current.rotation.y += delta * (isSelected ? 0.72 : 0.34);
  });

  const handleSelect = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    selectOrb(node.id);
  };

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation();
    openInterior(node.id);
  };

  const showLabel =
    showLabels === "all" ||
    (showLabels === "sections" && node.type === "section") ||
    isHovered ||
    isSelected ||
    isHighlighted;
  const materialOpacity = isDimmed ? 0.23 : isSelected || isHovered || isHighlighted ? 0.68 : 0.48;

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
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
      <OrbGlow color={node.color} radius={radius} selected={isSelected} highlighted={isHighlighted} dimmed={isDimmed} />
      <mesh>
        <sphereGeometry args={[radius, 28, 22]} />
        <meshPhysicalMaterial
          color={node.color}
          roughness={0.12}
          metalness={0.05}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transmission={0.62}
          thickness={1.8}
          transparent
          opacity={materialOpacity}
          emissive={node.color}
          emissiveIntensity={isDimmed ? 0.24 : isSelected || isHovered || isHighlighted ? 1.08 : 0.58}
          depthWrite={false}
        />
      </mesh>
      <mesh scale={0.55}>
        <sphereGeometry args={[radius, 18, 14]} />
        <meshBasicMaterial
          color={node.color}
          transparent
          opacity={isDimmed ? 0.2 : 0.62}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      {(isSelected || isHovered || isHighlighted || node.favorite) && (
        <group ref={particleRef}>
          {orbitingParticles.map((particle, index) => (
            <mesh key={index} position={particle.position}>
              <sphereGeometry args={[radius * particle.scale, 6, 6]} />
              <meshBasicMaterial color={index % 3 === 0 ? "#ffffff" : node.color} transparent opacity={isDimmed ? 0.16 : 0.76} />
            </mesh>
          ))}
        </group>
      )}
      {(isSelected || isHovered || node.favorite) && (
        <group ref={ringRef}>
          <mesh rotation={[1.22, 0.35, 0.4]}>
            <torusGeometry args={[radius * 1.35, radius * 0.012, 8, 56]} />
            <meshBasicMaterial color={node.favorite ? "#fff3b0" : node.color} transparent opacity={0.8} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}
      {showLabel && (
        <Billboard position={[0, radius * 1.65, 0]}>
          <group>
            <mesh position={[0, -0.03, -0.04]} scale={[Math.min(3.4, node.title.length * 0.12 + 0.8), 0.38, 0.02]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshBasicMaterial color="#020714" transparent opacity={isDimmed ? 0.28 : 0.55} />
            </mesh>
            <Suspense fallback={null}>
              <Text
                color={isDimmed ? "#99a9c7" : "#f7fbff"}
                fontSize={node.type === "section" ? 0.34 : 0.24}
                anchorX="center"
                anchorY="middle"
                maxWidth={3.4}
                outlineWidth={0.015}
                outlineColor="#02030b"
              >
                {node.title}
              </Text>
            </Suspense>
          </group>
        </Billboard>
      )}
    </group>
  );
}
