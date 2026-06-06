import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { AdaptiveDpr, Stars } from "@react-three/drei";
import { Component, ReactNode, useEffect, useMemo, useState } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { getActiveOrbIds } from "../../utils/geometry";
import { CameraRig } from "./CameraRig";
import { ConnectionLines } from "./ConnectionLines";
import { CoreOrb } from "./CoreOrb";
import { KnowledgeOrb } from "./KnowledgeOrb";
import { ParticleField } from "./ParticleField";

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("The 3D renderer could not start. Falling back to lightweight mode.", error);
  }

  render() {
    if (this.state.failed) return <WebGLFallback />;
    return this.props.children;
  }
}

function WebGLFallback() {
  return (
    <div className="webgl-fallback" aria-label="Lightweight knowledge universe fallback">
      <div className="fallback-starfield" />
      <div className="fallback-core-orb">
        <span />
      </div>
      <div className="fallback-message glass-panel">
        <strong>Curiosity Core</strong>
        <span>Lightweight mode is active. You can still add orbs, open chambers, import, and export.</span>
      </div>
    </div>
  );
}

function SkillTreeCanvas() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const connections = useKnowledgeStore((state) => state.connections);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const hoveredOrbId = useKnowledgeStore((state) => state.hoveredOrbId);
  const highlightedOrbIds = useKnowledgeStore((state) => state.highlightedOrbIds);
  const bloomIntensity = useKnowledgeStore((state) => state.settings.bloomIntensity);
  const reducedMotion = useKnowledgeStore((state) => state.settings.reducedMotion);

  const activeAnchor = hoveredOrbId ?? selectedOrbId;
  const activeIds = useMemo(
    () => getActiveOrbIds(activeAnchor, orbs, connections, highlightedOrbIds),
    [activeAnchor, connections, highlightedOrbIds, orbs]
  );
  const nodeList = useMemo(() => Object.values(orbs), [orbs]);
  const hasFocusedState = Boolean(activeAnchor) || highlightedOrbIds.length > 0;

  return (
    <Canvas
      className="skill-tree-canvas"
      dpr={[0.75, 1.15]}
      camera={{ position: [0, 5, 30], fov: 52, near: 0.1, far: 420 }}
      gl={{ antialias: false, powerPreference: "high-performance" }}
      fallback={<WebGLFallback />}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.outputColorSpace = THREE.SRGBColorSpace;
      }}
    >
      <color attach="background" args={["#02030b"]} />
      <fog attach="fog" args={["#02030b", 24, 82]} />
      <ambientLight intensity={0.32} />
      <pointLight position={[0, 0, 0]} intensity={3.6} color="#d9e7ff" distance={28} />
      <pointLight position={[-14, 8, -16]} intensity={1.15} color="#8f5cff" distance={52} />
      <pointLight position={[16, -7, 10]} intensity={0.95} color="#35e2ff" distance={56} />
      <Stars radius={150} depth={44} count={reducedMotion ? 650 : 1100} factor={3.4} saturation={0.15} fade speed={reducedMotion ? 0 : 0.12} />
      <ParticleField reducedMotion={reducedMotion} />
      <ConnectionLines activeIds={activeIds} dimInactive={hasFocusedState} />
      {nodeList.map((node) =>
        node.type === "core" ? (
          <CoreOrb
            key={node.id}
            node={node}
            isSelected={selectedOrbId === node.id}
            isHovered={hoveredOrbId === node.id}
            isHighlighted={highlightedOrbIds.includes(node.id)}
            isDimmed={hasFocusedState && !activeIds.has(node.id)}
          />
        ) : (
          <KnowledgeOrb
            key={node.id}
            node={node}
            isSelected={selectedOrbId === node.id}
            isHovered={hoveredOrbId === node.id}
            isHighlighted={highlightedOrbIds.includes(node.id)}
            isDimmed={hasFocusedState && !activeIds.has(node.id)}
          />
        )
      )}
      <CameraRig />
      <AdaptiveDpr pixelated />
      {bloomIntensity > 0.05 && (
        <EffectComposer multisampling={0}>
          <Bloom
            mipmapBlur
            luminanceThreshold={0.12}
            luminanceSmoothing={0.32}
            intensity={bloomIntensity}
            radius={0.48}
          />
          <Vignette eskil={false} offset={0.18} darkness={0.72} />
        </EffectComposer>
      )}
    </Canvas>
  );
}

function canCreateWebGLContext() {
  if (typeof document === "undefined") return false;

  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl2", { powerPreference: "high-performance", antialias: false }) ??
      canvas.getContext("webgl", { powerPreference: "high-performance", antialias: false });

    if (!gl) return false;
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

export function SkillTreeScene() {
  const [webglReady, setWebglReady] = useState<boolean | null>(null);

  useEffect(() => {
    const idle = window.setTimeout(() => {
      setWebglReady(canCreateWebGLContext());
    }, 0);

    return () => window.clearTimeout(idle);
  }, []);

  if (webglReady !== true) return <WebGLFallback />;

  return (
    <SceneErrorBoundary>
      <SkillTreeCanvas />
    </SceneErrorBoundary>
  );
}
