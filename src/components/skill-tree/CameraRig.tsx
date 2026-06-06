import { OrbitControls } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import type { ElementRef } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { tupleToVector } from "../../utils/geometry";
import { sensitivityToMultiplier } from "../../utils/navigationSensitivity";

type OrbitControlsImpl = ElementRef<typeof OrbitControls>;

const MIN_ORBIT_DISTANCE = 3.2;
const BASE_MAX_ORBIT_DISTANCE = 128;
const DRAG_THRESHOLD_PX = 5;

type CameraDragMode = "none" | "move" | "planar";

export function CameraRig() {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, gl } = useThree();
  const orbs = useKnowledgeStore((state) => state.orbs);
  const focusedOrbId = useKnowledgeStore((state) => state.focusedOrbId);
  const requestVersion = useKnowledgeStore((state) => state.cameraRequestVersion);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);
  const moveSensitivity = useKnowledgeStore((state) => state.settings.navigationMoveSensitivity);
  const rotateSensitivity = useKnowledgeStore((state) => state.settings.navigationRotateSensitivity);
  const zoomSensitivity = useKnowledgeStore((state) => state.settings.navigationZoomSensitivity);
  const moveMultiplier = sensitivityToMultiplier(moveSensitivity);
  const rotateMultiplier = sensitivityToMultiplier(rotateSensitivity);
  const zoomMultiplier = sensitivityToMultiplier(zoomSensitivity);
  const zoomVelocity = useRef(0);
  const planarPanVelocity = useRef(new THREE.Vector3());
  const dragState = useRef({
    active: false,
    mode: "none" as CameraDragMode,
    moved: false,
    lastX: 0,
    lastY: 0,
    totalMovement: 0
  });
  const scratchForward = useRef(new THREE.Vector3());
  const scratchRight = useRef(new THREE.Vector3());
  const scratchPlanarRight = useRef(new THREE.Vector3());
  const scratchMove = useRef(new THREE.Vector3());
  const scratchDirection = useRef(new THREE.Vector3());
  const animation = useRef({
    active: false,
    elapsed: 0,
    duration: 1.35,
    fromPosition: new THREE.Vector3(),
    toPosition: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    toTarget: new THREE.Vector3()
  });

  const sceneRadius = useMemo(() => {
    const farthestOrb = Object.values(orbs).reduce((max, orb) => Math.max(max, tupleToVector(orb.position).length()), 0);
    return Math.max(BASE_MAX_ORBIT_DISTANCE, farthestOrb + 76);
  }, [orbs]);

  const maxOrbitDistance = useMemo(() => Math.min(320, Math.max(BASE_MAX_ORBIT_DISTANCE, sceneRadius * 1.35)), [sceneRadius]);

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
    const canvas = gl.domElement;

    const stopDrag = () => {
      dragState.current.active = false;
      dragState.current.mode = "none";
      dragState.current.moved = false;
      document.body.classList.remove("is-camera-traveling", "is-camera-panning");
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.button === 1) {
        event.preventDefault();
        document.body.classList.add("is-rotating-camera");
        return;
      }

      if (event.button !== 0 && event.button !== 2) return;
      event.preventDefault();

      dragState.current = {
        active: true,
        mode: event.button === 2 ? "planar" : "move",
        moved: false,
        lastX: event.clientX,
        lastY: event.clientY,
        totalMovement: 0
      };
    };

    const handlePointerMove = (event: PointerEvent) => {
      const controls = controlsRef.current;
      if (!controls || !dragState.current.active) return;

      const dx = event.clientX - dragState.current.lastX;
      const dy = event.clientY - dragState.current.lastY;
      dragState.current.lastX = event.clientX;
      dragState.current.lastY = event.clientY;
      dragState.current.totalMovement += Math.hypot(dx, dy);

      if (dragState.current.totalMovement < DRAG_THRESHOLD_PX) return;

      dragState.current.moved = true;
      animation.current.active = false;
      event.preventDefault();

      const distance = camera.position.distanceTo(controls.target);
      const isLeftMove = dragState.current.mode === "move";
      const travelScale = THREE.MathUtils.clamp(distance * 0.0024, 0.014, 0.16);
      const forward = scratchForward.current;
      const right = scratchRight.current;
      const move = scratchMove.current;

      camera.getWorldDirection(forward).normalize();
      right.crossVectors(forward, camera.up).normalize();

      const planarRight = scratchPlanarRight.current.copy(right);
      planarRight.z = 0;
      if (planarRight.lengthSq() < 0.0001) planarRight.set(1, 0, 0);
      planarRight.normalize();

      move.copy(planarRight).multiplyScalar(-dx * travelScale);
      move.y += dy * travelScale;
      move.z = 0;
      planarPanVelocity.current.add(move.multiplyScalar(8.5 * (isLeftMove ? moveMultiplier : 1)));
      document.body.classList.add("is-camera-panning");
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (event.button === 1) {
        document.body.classList.remove("is-rotating-camera");
        return;
      }

      if (event.button === 0 || event.button === 2) stopDrag();
    };

    const handleWheel = (event: WheelEvent) => {
      const controls = controlsRef.current;
      if (!controls) return;

      event.preventDefault();
      animation.current.active = false;

      const distance = camera.position.distanceTo(controls.target);
      const wheelSteps = THREE.MathUtils.clamp(event.deltaY / 120, -3, 3);
      const impulse = distance * 1.35 * wheelSteps * zoomMultiplier;
      const maxZoomVelocity = 190 * zoomMultiplier;
      zoomVelocity.current = THREE.MathUtils.clamp(zoomVelocity.current + impulse, -maxZoomVelocity, maxZoomVelocity);
    };

    const handleAuxClick = (event: MouseEvent) => {
      if (event.button === 1) event.preventDefault();
    };

    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault();
    };

    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("wheel", handleWheel, { passive: false });
    canvas.addEventListener("auxclick", handleAuxClick);
    canvas.addEventListener("contextmenu", handleContextMenu);
    window.addEventListener("pointermove", handlePointerMove, { passive: false });
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("blur", stopDrag);

    return () => {
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("wheel", handleWheel);
      canvas.removeEventListener("auxclick", handleAuxClick);
      canvas.removeEventListener("contextmenu", handleContextMenu);
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("blur", stopDrag);
      document.body.classList.remove("is-camera-traveling", "is-camera-panning", "is-rotating-camera");
    };
  }, [camera, gl, moveMultiplier, zoomMultiplier]);

  useEffect(() => {
    const controls = controlsRef.current;
    zoomVelocity.current = 0;
    planarPanVelocity.current.set(0, 0, 0);
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

    if (Math.abs(zoomVelocity.current) > 0.001) {
      const offset = camera.position.clone().sub(controls.target);
      const distance = offset.length();
      if (distance > 0.001) {
        const nextDistance = THREE.MathUtils.clamp(distance + zoomVelocity.current * delta, MIN_ORBIT_DISTANCE, maxOrbitDistance);
        offset.setLength(nextDistance);
        camera.position.copy(controls.target).add(offset);
      }
      zoomVelocity.current = THREE.MathUtils.damp(zoomVelocity.current, 0, 8.4, delta);
    }

    if (planarPanVelocity.current.lengthSq() > 0.000001) {
      const move = planarPanVelocity.current.clone().multiplyScalar(delta);
      move.z = 0;
      const nextTarget = controls.target.clone().add(move);
      const nextCamera = camera.position.clone().add(move);
      const bounds = sceneRadius + maxOrbitDistance * 0.45;
      if (nextTarget.length() > bounds) {
        const correction = scratchDirection.current.copy(nextTarget).setLength(bounds).sub(controls.target);
        correction.z = 0;
        controls.target.add(correction);
        camera.position.add(correction);
      } else {
        controls.target.copy(nextTarget);
        camera.position.copy(nextCamera);
      }
      planarPanVelocity.current.multiplyScalar(Math.pow(0.055, delta));
    }

    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.105}
      rotateSpeed={0.92 * rotateMultiplier}
      enableZoom={false}
      enablePan={false}
      mouseButtons={{
        MIDDLE: THREE.MOUSE.ROTATE
      }}
      touches={{
        ONE: THREE.TOUCH.ROTATE,
        TWO: THREE.TOUCH.DOLLY_PAN
      }}
      minDistance={MIN_ORBIT_DISTANCE}
      maxDistance={maxOrbitDistance}
      makeDefault
    />
  );
}
