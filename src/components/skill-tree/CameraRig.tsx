import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { ElementRef } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { tupleToVector } from "../../utils/geometry";

type OrbitControlsImpl = ElementRef<typeof OrbitControls>;

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const orbs = useKnowledgeStore((state) => state.orbs);
  const focusedOrbId = useKnowledgeStore((state) => state.focusedOrbId);
  const requestVersion = useKnowledgeStore((state) => state.cameraRequestVersion);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);
  const animation = useRef({
    active: false,
    elapsed: 0,
    duration: 1.35,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  });

  const targetData = useMemo(() => {
    if (!focusedOrbId) {
      return {
        target: new THREE.Vector3(0, 0, 0),
        position: new THREE.Vector3(0, 6, 42)
      };
    }
    const orb = orbs[focusedOrbId];
    if (!orb) {
      return {
        target: new THREE.Vector3(0, 0, 0),
        position: new THREE.Vector3(0, 6, 42)
      };
    }
    const target = tupleToVector(orb.position);
    const direction = target.clone().normalize();
    if (direction.length() < 0.2) direction.set(0.3, 0.18, 1).normalize();
    const distance = orb.type === "section" ? 13 : orb.type === "core" ? 18 : 7.6;
    const position = target
      .clone()
      .add(direction.multiplyScalar(distance))
      .add(new THREE.Vector3(0, orb.type === "section" ? 2.4 : 1.1, 5.4));
    return { target, position };
  }, [focusedOrbId, orbs]);

  useEffect(() => {
    const controls = controlsRef.current;
    animation.current = {
      active: true,
      elapsed: 0,
      duration: reducedMotion ? 0.25 : 1.35,
      fromPosition: camera.position.clone(),
      toPosition: targetData.position.clone(),
      fromTarget: controls?.target.clone() ?? new THREE.Vector3(),
      toTarget: targetData.target.clone()
    };
  }, [camera, requestVersion, reducedMotion, targetData]);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls) return;

    if (animation.current.active) {
      animation.current.elapsed += delta;
      const t = Math.min(animation.current.elapsed / animation.current.duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      camera.position.lerpVectors(animation.current.fromPosition, animation.current.toPosition, eased);
      controls.target.lerpVectors(animation.current.fromTarget, animation.current.toTarget, eased);
      if (t >= 1) animation.current.active = false;
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.075}
      rotateSpeed={0.52}
      zoomSpeed={0.62}
      panSpeed={0.58}
      minDistance={4}
      maxDistance={92}
      makeDefault
    />
  );
}
