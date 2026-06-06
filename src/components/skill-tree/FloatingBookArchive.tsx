import { Text } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import type { OrbNode } from "../../types/models";
import { HolographicBookLabels } from "./HolographicBookLabels";

// Extract C:\Users\mrani\Downloads\msxam6ypo2kg-Book.zip into public/models/BookOpen/.
// The provided archive contains BookOpen.FBX and TGA textures.
// A copy named BookOpen.model is included because some browser/ad-block setups block direct .FBX requests.
// If you convert or replace the asset with BookOpen.glb / BookOpen.gltf later,
// update this path and switch useFBX to useGLTF.
const BOOK_MODEL_PATH = "/models/BookOpen/BookOpen.model";

function useBookModel() {
  const [model, setModel] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = new FBXLoader();

    fetch(BOOK_MODEL_PATH)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.arrayBuffer();
      })
      .then((buffer) => {
        const parsed = loader.parse(buffer, "/models/BookOpen/");
        if (!cancelled) setModel(parsed);
      })
      .catch((error) => {
        if (cancelled) return;
        console.warn(
          `BookOpen model could not be loaded or parsed from ${BOOK_MODEL_PATH}. Rendering procedural fallback. Convert the FBX to GLB/GLTF if this file keeps failing.`,
          error
        );
        setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { model, failed };
}

function LoadedFBXBook({ color, model, onBookClick }: { color: string; model: THREE.Group; onBookClick: () => void }) {
  const preparedModel = useMemo(() => {
    const clone = model.clone(true);
    clone.traverse((child) => {
      const mesh = child as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const original = Array.isArray(mesh.material) ? mesh.material[0] : mesh.material;
      mesh.material = new THREE.MeshStandardMaterial({
        color: original && "color" in original ? (original as THREE.MeshStandardMaterial).color : new THREE.Color("#8b5a31"),
        roughness: 0.74,
        metalness: 0.04,
        emissive: new THREE.Color(color),
        emissiveIntensity: 0.035
      });
    });
    return clone;
  }, [color, model]);

  return (
    <primitive
      object={preparedModel}
      scale={0.038}
      rotation={[-Math.PI / 2, 0, Math.PI * 0.02]}
      position={[0, -0.45, 0]}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onBookClick();
      }}
    />
  );
}

function FallbackBook({ color, onBookClick, failed }: { color: string; onBookClick: () => void; failed?: boolean }) {
  useEffect(() => {
    if (failed) console.warn(`Using procedural fallback book. Check ${BOOK_MODEL_PATH} or replace it with a GLB/GLTF version.`);
  }, [failed]);

  return (
    <group
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onBookClick();
      }}
    >
      <mesh position={[0, -0.08, -0.08]} rotation={[0.16, 0, 0]}>
        <boxGeometry args={[3.45, 0.2, 2.2]} />
        <meshStandardMaterial color="#3d2418" roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[-0.86, 0.05, 0.02]} rotation={[0.08, 0.02, 0.2]}>
        <boxGeometry args={[1.65, 0.08, 2.05]} />
        <meshStandardMaterial color="#d9c385" roughness={0.88} emissive={color} emissiveIntensity={0.035} />
      </mesh>
      <mesh position={[0.86, 0.05, 0.02]} rotation={[0.08, -0.02, -0.2]}>
        <boxGeometry args={[1.65, 0.08, 2.05]} />
        <meshStandardMaterial color="#dfcc94" roughness={0.88} emissive={color} emissiveIntensity={0.035} />
      </mesh>
      {Array.from({ length: 7 }, (_, index) => (
        <mesh key={index} position={[index % 2 ? 0.64 : -0.64, 0.14 + index * 0.018, -0.02]} rotation={[0.08, 0, index % 2 ? -0.16 : 0.16]}>
          <boxGeometry args={[1.45, 0.018, 1.9]} />
          <meshStandardMaterial color={index % 2 ? "#ead8a5" : "#cfb875"} roughness={0.92} />
        </mesh>
      ))}
      {Array.from({ length: 10 }, (_, index) => (
        <mesh key={`mark-${index}`} position={[-0.76 + (index % 5) * 0.32, 0.24, -0.54 + Math.floor(index / 5) * 0.45]} rotation={[-Math.PI / 2, 0, 0.15]}>
          <boxGeometry args={[0.18 + (index % 3) * 0.09, 0.012, 0.01]} />
          <meshBasicMaterial color={index % 2 ? "#6b402d" : color} transparent opacity={0.72} />
        </mesh>
      ))}
      <mesh position={[0, 0.26, 0.07]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.01, 8, 80]} />
        <meshBasicMaterial color={color} transparent opacity={0.65} blending={THREE.AdditiveBlending} />
      </mesh>
      <Suspense fallback={null}>
        <Text position={[0, -1.08, 0]} fontSize={0.16} color="#b9c8e7" anchorX="center" anchorY="middle">
          BookOpen fallback
        </Text>
      </Suspense>
    </group>
  );
}

function MagicalRings({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  const particles = useMemo(
    () =>
      Array.from({ length: 90 }, (_, index) => {
        const angle = (index / 90) * Math.PI * 2;
        const radius = 1.8 + (index % 7) * 0.13;
        return {
          position: [Math.cos(angle) * radius, Math.sin(index * 1.9) * 0.62, Math.sin(angle) * radius] as [number, number, number],
          scale: 0.015 + (index % 4) * 0.006
        };
      }),
    []
  );

  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.28;
      groupRef.current.rotation.z -= delta * 0.055;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[2.15, 0.012, 10, 160]} />
        <meshBasicMaterial color={color} transparent opacity={0.72} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0.84, 0.1, Math.PI / 2]}>
        <torusGeometry args={[2.75, 0.008, 10, 160]} />
        <meshBasicMaterial color="#b993ff" transparent opacity={0.48} blending={THREE.AdditiveBlending} />
      </mesh>
      {particles.map((particle, index) => (
        <mesh key={index} position={particle.position}>
          <sphereGeometry args={[particle.scale, 8, 8]} />
          <meshBasicMaterial color={index % 3 === 0 ? "#ffffff" : color} transparent opacity={0.72} blending={THREE.AdditiveBlending} />
        </mesh>
      ))}
    </group>
  );
}

export function FloatingBookArchive({ orb, onBookClick }: { orb: OrbNode; onBookClick: () => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const { model, failed } = useBookModel();

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.position.y = Math.sin(time * 0.75) * 0.18;
    groupRef.current.rotation.y = Math.sin(time * 0.22) * 0.18;
  });

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
          opacity={0.18}
          emissive={orb.color}
          emissiveIntensity={0.18}
          depthWrite={false}
        />
      </mesh>
      <pointLight color={orb.color} intensity={7.5} distance={18} />
      <pointLight position={[0, 5, 4]} color="#b993ff" intensity={4.2} distance={14} />
      <MagicalRings color={orb.color} />
      <group ref={groupRef}>
        {model ? (
          <LoadedFBXBook color={orb.color} model={model} onBookClick={onBookClick} />
        ) : (
          <FallbackBook color={orb.color} onBookClick={onBookClick} failed={failed} />
        )}
      </group>
      <HolographicBookLabels color={orb.color} />
    </group>
  );
}
