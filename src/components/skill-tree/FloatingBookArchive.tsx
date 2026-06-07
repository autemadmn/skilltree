import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbNode } from "../../types/models";
import { OpenBookModel } from "./OpenBookModel";

function MagicalRings({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 120 }, (_, index) => {
        const angle = (index / 120) * Math.PI * 2;
        const radius = 1.7 + (index % 8) * 0.12;
        return {
          position: [Math.cos(angle) * radius, Math.sin(index * 1.9) * 0.64, Math.sin(angle) * radius] as [number, number, number],
          scale: 0.013 + (index % 4) * 0.005
        };
      }),
    []
  );

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    groupRef.current.rotation.y += delta * (opening ? 0.7 : hovered ? 0.42 : 0.24);
    groupRef.current.rotation.z -= delta * 0.055;
  });

  const primaryOpacity = opening ? 0.95 : hovered ? 0.82 : 0.62;
  const secondaryOpacity = opening ? 0.74 : hovered ? 0.56 : 0.38;

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.05, 0.011, 10, 160]} />
        <meshBasicMaterial color={color} transparent opacity={primaryOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh rotation={[0.84, 0.1, Math.PI / 2]}>
        <torusGeometry args={[2.65, 0.008, 10, 160]} />
        <meshBasicMaterial color="#b993ff" transparent opacity={secondaryOpacity} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshBasicMaterial
            color={index % 3 === 0 ? "#ffffff" : color}
            transparent
            opacity={opening ? 0.9 : hovered ? 0.78 : 0.58}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function BookAura({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const ref = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.2) * 0.035;
    ref.current.scale.setScalar((opening ? 1.55 : hovered ? 1.24 : 1) * pulse);
  });

  return (
    <mesh ref={ref} position={[0, -0.18, -0.32]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.35, 96]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={opening ? 0.22 : hovered ? 0.17 : 0.1}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

function LoadingBookText() {
  return (
    <Suspense fallback={null}>
      <Text position={[0, -2.4, 0]} fontSize={0.16} color="#b9c8e7" anchorX="center" anchorY="middle">
        Cargando libro...
      </Text>
    </Suspense>
  );
}

export function FloatingBookArchive({
  orb,
  opening,
  onBookClick
}: {
  orb: OrbNode;
  opening: boolean;
  onBookClick: () => void;
}) {
  const [bookState, setBookState] = useState<"loadingModel" | "ready" | "hovered" | "opening" | "error">("loadingModel");
  const hovered = bookState === "hovered";
  const isOpening = opening || bookState === "opening";

  return (
    <group>
      <mesh>
        <sphereGeometry args={[6.3, 96, 96]} />
        <meshPhysicalMaterial
          color={orb.color}
          roughness={0.08}
          metalness={0.04}
          clearcoat={1}
          transmission={0.82}
          thickness={2.6}
          transparent
          opacity={0.14}
          emissive={orb.color}
          emissiveIntensity={isOpening ? 0.28 : hovered ? 0.22 : 0.14}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={orb.color} intensity={isOpening ? 10 : hovered ? 8.2 : 6.8} distance={18} />
      <pointLight position={[0, 4.2, 4]} color="#b993ff" intensity={hovered ? 4.8 : 3.7} distance={14} />
      <spotLight position={[0, 5.5, 5.2]} angle={0.58} penumbra={0.7} intensity={3.2} color="#f2e0b8" castShadow />
      <BookAura color={orb.color} hovered={hovered} opening={isOpening} />
      <MagicalRings color={orb.color} hovered={hovered} opening={isOpening} />
      <OpenBookModel
        auraColor={orb.color}
        position={[0, -0.28, 0]}
        rotation={[-Math.PI / 2 + 0.24, 0, 0.02]}
        scale={1.36}
        opening={isOpening}
        onReady={() => setBookState("ready")}
        onError={() => setBookState("error")}
        onPointerEnter={() => {
          if (!isOpening) setBookState("hovered");
        }}
        onPointerLeave={() => {
          if (!isOpening) setBookState(bookState === "error" ? "error" : "ready");
        }}
        onClick={() => {
          if (isOpening) return;
          setBookState("opening");
          onBookClick();
        }}
      />
      {bookState === "loadingModel" && <LoadingBookText />}
    </group>
  );
}
