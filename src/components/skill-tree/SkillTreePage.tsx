import { AddOrbPanel } from "./AddOrbPanel";
import { OrbDetailsPanel } from "./OrbDetailsPanel";
import { SectionMenu } from "./SectionMenu";
import { SkillTreeScene } from "./SkillTreeScene";
import { TopToolbar } from "./TopToolbar";
import { SettingsPanel } from "../chamber/SettingsPanel";

export function SkillTreePage() {
  return (
    <main className="skill-tree-page">
      <SkillTreeScene />
      <div className="scene-vignette" />
      <SectionMenu />
      <TopToolbar />
      <OrbDetailsPanel />
      <AddOrbPanel />
      <SettingsPanel />
    </main>
  );
}
