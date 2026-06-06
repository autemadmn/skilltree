import { Canvas } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { Stars } from "@react-three/drei";
import { ArrowLeft, BookOpen, Waypoints } from "lucide-react";
import type { CSSProperties } from "react";
import * as THREE from "three";
import { useKnowledgeStore } from "../../store/useKnowledgeStore";
import { ParticleField } from "./ParticleField";
import { FloatingBookArchive } from "./FloatingBookArchive";

export function OrbInteriorView() {
  const orbs = useKnowledgeStore((state) => state.orbs);
  const selectedOrbId = useKnowledgeStore((state) => state.selectedOrbId);
  const returnToSkillTree = useKnowledgeStore((state) => state.returnToSkillTree);
  const openKnowledgeChamber = useKnowledgeStore((state) => state.openKnowledgeChamber);
  const orb = orbs[selectedOrbId] ?? orbs["curiosity-core"];

  return (
    <main className="orb-interior-page" style={{ "--accent": orb.color } as CSSProperties}>
      <Canvas
        className="orb-interior-canvas"
        dpr={[1, 1.75]}
        camera={{ position: [0, 2.2, 10.5], fov: 46, near: 0.1, far: 160 }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <color attach="background" args={["#02030b"]} />
        <fog attach="fog" args={["#02030b", 14, 60]} />
        <ambientLight intensity={0.34} />
        <directionalLight position={[4, 6, 6]} intensity={2.8} color="#dce7ff" />
        <Stars radius={110} depth={42} count={2200} factor={3.7} saturation={0.3} fade speed={0.2} />
        <ParticleField />
        <FloatingBookArchive orb={orb} onBookClick={() => openKnowledgeChamber(orb.id)} />
        <EffectComposer multisampling={0}>
          <Bloom mipmapBlur luminanceThreshold={0.05} luminanceSmoothing={0.2} intensity={1.35} radius={0.8} />
          <Vignette eskil={false} offset={0.12} darkness={0.82} />
        </EffectComposer>
      </Canvas>

      <header className="interior-header glass-panel">
        <button className="toolbar-button" onClick={returnToSkillTree}>
          <ArrowLeft size={16} />
          Back to Skill Tree
        </button>
        <div className="interior-title">
          <span className="tiny-orb" style={{ background: orb.color }} />
          <div>
            <p className="eyebrow">Knowledge Node</p>
            <h1>{orb.title}</h1>
          </div>
        </div>
        <button className="toolbar-button primary" onClick={() => openKnowledgeChamber(orb.id)}>
          <BookOpen size={16} />
          Open Knowledge Chamber
        </button>
      </header>

      <div className="entry-prompt glass-panel">
        <Waypoints size={16} />
        <span>Click the floating book</span>
      </div>
    </main>
  );
}
