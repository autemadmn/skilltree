import { useCursor } from "@react-three/drei";
import { ThreeEvent, useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";

type Vector3Tuple = [number, number, number];

type OpenBookModelProps = {
  visible?: boolean;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: number;
  opening?: boolean;
  auraColor: string;
  onClick?: () => void;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onReady?: () => void;
  onError?: () => void;
};

const OLD_BOOK_FBX_PATH = "/models/old-open-book/old-open-book.fbx";
const OLD_BOOK_RESOURCE_PATH = "/models/old-open-book/";

// If this FBX is converted later, place the GLB at:
// public/models/old-open-book/old-open-book.glb and swap this loader for useGLTF.
const textureRedirects: Record<string, string> = {
  "book page left.jpg": "/models/old-open-book/textures/page-left.jpg",
  "book page right.jpg": "/models/old-open-book/textures/page-right.jpg",
  "book texture 1.jpg": "/models/old-open-book/textures/texture-1.jpg",
  "book texture 1 normal map.jpg": "/models/old-open-book/textures/texture-1-normal.jpg",
  "book texture 2.jpg": "/models/old-open-book/textures/texture-2.jpg",
  "book texture 2 normal map.jpg": "/models/old-open-book/textures/texture-2-normal.jpg",
  "book texture 3.jpg": "/models/old-open-book/textures/texture-3.jpg",
  "book texture 3 normal map.jpg": "/models/old-open-book/textures/texture-3-normal.jpg"
};

function createBookLoader() {
  const manager = new THREE.LoadingManager();
  manager.setURLModifier((url) => {
    const fileName = url.replace(/\\/g, "/").split("/").pop()?.toLowerCase();
    return fileName && textureRedirects[fileName] ? textureRedirects[fileName] : url;
  });

  const loader = new FBXLoader(manager);
  loader.setResourcePath(OLD_BOOK_RESOURCE_PATH);
  return loader;
}

function prepareBookModel(source: THREE.Group, auraColor: string) {
  const clone = source.clone(true);

  clone.traverse((child) => {
    const mesh = child as THREE.Mesh;
    if (!mesh.isMesh) return;
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    const originalMaterials = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).filter(Boolean) as THREE.Material[];
    const materials = originalMaterials.map((material) => material.clone());
    mesh.material = Array.isArray(mesh.material) ? materials : materials[0];
    materials.forEach((material) => {
      const standard = material as THREE.MeshStandardMaterial;
      if (standard.map) {
        standard.map.colorSpace = THREE.SRGBColorSpace;
        standard.map.needsUpdate = true;
      }
      if (standard.normalMap) standard.normalMap.needsUpdate = true;
      if ("roughness" in standard) standard.roughness = Math.max(standard.roughness ?? 0.7, 0.72);
      if ("metalness" in standard) standard.metalness = Math.min(standard.metalness ?? 0.04, 0.06);
      if ("emissive" in standard) {
        standard.emissive = new THREE.Color(auraColor);
        standard.emissiveIntensity = 0.018;
      }
      material.needsUpdate = true;
    });
  });

  const box = new THREE.Box3().setFromObject(clone);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  clone.position.sub(center);
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  clone.scale.setScalar(3.35 / maxAxis);
  return clone;
}

function ProceduralFallbackBook({ auraColor }: { auraColor: string }) {
  return (
    <group>
      <mesh position={[0, -0.08, -0.08]} rotation={[0.16, 0, 0]}>
        <boxGeometry args={[3.45, 0.2, 2.2]} />
        <meshStandardMaterial color="#3d2418" roughness={0.82} metalness={0.08} />
      </mesh>
      <mesh position={[-0.86, 0.05, 0.02]} rotation={[0.08, 0.02, 0.2]}>
        <boxGeometry args={[1.65, 0.08, 2.05]} />
        <meshStandardMaterial color="#d9c385" roughness={0.88} emissive={auraColor} emissiveIntensity={0.035} />
      </mesh>
      <mesh position={[0.86, 0.05, 0.02]} rotation={[0.08, -0.02, -0.2]}>
        <boxGeometry args={[1.65, 0.08, 2.05]} />
        <meshStandardMaterial color="#dfcc94" roughness={0.88} emissive={auraColor} emissiveIntensity={0.035} />
      </mesh>
      {Array.from({ length: 8 }, (_, index) => (
        <mesh key={index} position={[index % 2 ? 0.62 : -0.62, 0.14 + index * 0.018, -0.02]} rotation={[0.08, 0, index % 2 ? -0.16 : 0.16]}>
          <boxGeometry args={[1.45, 0.018, 1.9]} />
          <meshStandardMaterial color={index % 2 ? "#ead8a5" : "#cfb875"} roughness={0.92} />
        </mesh>
      ))}
    </group>
  );
}

export function OpenBookModel({
  visible = true,
  position = [0, -0.35, 0],
  rotation = [-0.25, 0, 0],
  scale = 1,
  opening = false,
  auraColor,
  onClick,
  onPointerEnter,
  onPointerLeave,
  onReady,
  onError
}: OpenBookModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const onReadyRef = useRef(onReady);
  const onErrorRef = useRef(onError);
  const [sourceModel, setSourceModel] = useState<THREE.Group | null>(null);
  const [failed, setFailed] = useState(false);
  const [hovered, setHovered] = useState(false);
  useCursor(hovered && !opening);

  useEffect(() => {
    onReadyRef.current = onReady;
    onErrorRef.current = onError;
  }, [onError, onReady]);

  useEffect(() => {
    let cancelled = false;
    const loader = createBookLoader();

    loader.load(
      OLD_BOOK_FBX_PATH,
      (model) => {
        if (cancelled) return;
        setSourceModel(model);
        onReadyRef.current?.();
      },
      undefined,
      (error) => {
        if (cancelled) return;
        console.warn("Old open book model could not be loaded. Rendering a minimal procedural book fallback.", error);
        setFailed(true);
        onErrorRef.current?.();
      }
    );

    return () => {
      cancelled = true;
    };
  }, []);

  const preparedModel = useMemo(() => (sourceModel ? prepareBookModel(sourceModel, auraColor) : null), [auraColor, sourceModel]);

  useFrame(({ clock }, delta) => {
    if (!groupRef.current) return;
    const time = clock.getElapsedTime();
    const baseY = position[1] + Math.sin(time * 0.8) * 0.075;
    const targetY = baseY + (hovered ? 0.08 : 0) + (opening ? 0.18 : 0);
    const targetScale = scale * (opening ? 1.22 : hovered ? 1.055 : 1);
    groupRef.current.position.x = THREE.MathUtils.damp(groupRef.current.position.x, position[0], 7, delta);
    groupRef.current.position.y = THREE.MathUtils.damp(groupRef.current.position.y, targetY, 7, delta);
    groupRef.current.position.z = THREE.MathUtils.damp(groupRef.current.position.z, position[2] + (opening ? 0.55 : hovered ? 0.16 : 0), 7, delta);
    groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, rotation[0] + (opening ? -0.16 : 0), 6, delta);
    groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, rotation[1] + Math.sin(time * 0.32) * 0.08, 5, delta);
    groupRef.current.rotation.z = THREE.MathUtils.damp(groupRef.current.rotation.z, rotation[2] + (hovered ? 0.025 : 0), 6, delta);
    groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 7, delta));
  });

  return (
    <group
      ref={groupRef}
      visible={visible}
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation();
        onClick?.();
      }}
      onPointerEnter={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(true);
        onPointerEnter?.();
      }}
      onPointerLeave={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation();
        setHovered(false);
        onPointerLeave?.();
      }}
    >
      {preparedModel ? <primitive object={preparedModel} /> : failed ? <ProceduralFallbackBook auraColor={auraColor} /> : null}
    </group>
  );
}
