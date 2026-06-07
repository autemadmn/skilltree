import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import type { OrbNode } from "../../types/models";
import { OpenBookModel } from "./OpenBookModel";

function createSoftCircleTexture() {
  if (typeof document === "undefined") return null;
  const canvas = document.createElement("canvas");
  canvas.width = 192;
  canvas.height = 192;
  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(96, 96, 0, 96, 96, 94);
  gradient.addColorStop(0, "rgba(255, 255, 255, 0.95)");
  gradient.addColorStop(0.34, "rgba(255, 255, 255, 0.36)");
  gradient.addColorStop(0.68, "rgba(255, 255, 255, 0.11)");
  gradient.addColorStop(1, "rgba(255, 255, 255, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

function MagicalRings({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const groupRef = useRef<THREE.Group>(null);

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
    </group>
  );
}

function ParticleAura({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const particleData = useMemo(() => {
    const count = 96;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const baseColor = new THREE.Color(color);
    const violet = new THREE.Color("#b993ff");
    const white = new THREE.Color("#ffffff");

    for (let index = 0; index < count; index += 1) {
      const angle = (index / count) * Math.PI * 2;
      const radius = 0.82 + Math.random() * 1.95;
      const vertical = -0.28 + Math.random() * 1.24;
      positions[index * 3] = Math.cos(angle) * radius + (Math.random() - 0.5) * 0.13;
      positions[index * 3 + 1] = vertical;
      positions[index * 3 + 2] = Math.sin(angle) * radius * 0.72 + (Math.random() - 0.5) * 0.13;

      const mixed = (index % 5 === 0 ? white : index % 2 === 0 ? baseColor : violet).clone();
      colors[index * 3] = mixed.r;
      colors[index * 3 + 1] = mixed.g;
      colors[index * 3 + 2] = mixed.b;
    }

    return { positions, colors };
  }, [color]);

  useFrame(({ clock }, delta) => {
    if (!pointsRef.current) return;
    pointsRef.current.rotation.y += delta * (opening ? 0.22 : hovered ? 0.14 : 0.07);
    pointsRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 0.35) * 0.045;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={particleData.positions.length / 3} array={particleData.positions} itemSize={3} />
        <bufferAttribute attach="attributes-color" count={particleData.colors.length / 3} array={particleData.colors} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial
        size={opening ? 0.075 : hovered ? 0.065 : 0.052}
        vertexColors
        transparent
        opacity={opening ? 0.62 : hovered ? 0.5 : 0.34}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}

function PortalMist({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const texture = useMemo(() => createSoftCircleTexture(), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    groupRef.current.rotation.z += delta * 0.018;
    groupRef.current.position.y = Math.sin(time * 0.42) * 0.035;
  });

  if (!texture) return null;

  const opacity = opening ? 0.25 : hovered ? 0.19 : 0.135;

  return (
    <group ref={groupRef} position={[0, 0.02, -0.24]}>
      <sprite position={[0, 0.08, -0.12]} scale={[4.5, 2.35, 1]}>
        <spriteMaterial map={texture} color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </sprite>
      <sprite position={[-0.55, -0.02, 0.08]} scale={[2.65, 1.25, 1]}>
        <spriteMaterial map={texture} color="#efe6ff" transparent opacity={opacity * 0.62} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </sprite>
      <sprite position={[0.64, 0.14, 0.02]} scale={[2.25, 1.05, 1]}>
        <spriteMaterial map={texture} color="#b993ff" transparent opacity={opacity * 0.54} blending={THREE.AdditiveBlending} depthWrite={false} depthTest={false} />
      </sprite>
    </group>
  );
}

function BookAura({ color, hovered, opening }: { color: string; hovered: boolean; opening: boolean }) {
  const ref = useRef<THREE.Mesh>(null);
  const texture = useMemo(() => createSoftCircleTexture(), []);

  useEffect(() => () => texture?.dispose(), [texture]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pulse = 1 + Math.sin(clock.getElapsedTime() * 2.2) * 0.035;
    ref.current.scale.setScalar((opening ? 1.55 : hovered ? 1.24 : 1) * pulse);
  });

  if (!texture) return null;

  return (
    <mesh ref={ref} position={[0, -0.48, -0.2]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[2.35, 96]} />
      <meshBasicMaterial
        color={color}
        map={texture}
        transparent
        opacity={opening ? 0.3 : hovered ? 0.23 : 0.15}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        side={THREE.DoubleSide}
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
      <pointLight position={[-2.4, 1.05, 1.8]} color={orb.color} intensity={hovered ? 1.65 : 1.15} distance={5.8} />
      <pointLight position={[2.2, 0.8, 2.4]} color="#fff3d2" intensity={hovered ? 1.1 : 0.72} distance={5.5} />
      <spotLight position={[0, 5.5, 5.2]} angle={0.58} penumbra={0.7} intensity={3.2} color="#f2e0b8" castShadow />
      <PortalMist color={orb.color} hovered={hovered} opening={isOpening} />
      <BookAura color={orb.color} hovered={hovered} opening={isOpening} />
      <ParticleAura color={orb.color} hovered={hovered} opening={isOpening} />
      <MagicalRings color={orb.color} hovered={hovered} opening={isOpening} />
      {/* Tune these if the source model is replaced; OpenBookModel handles pivot centering and scale normalization. */}
      <OpenBookModel
        auraColor={orb.color}
        position={[0, -0.08, 0]}
        rotation={[0.22, Math.PI, 0]}
        scale={1.05}
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
