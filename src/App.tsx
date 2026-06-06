import { AnimatePresence, motion } from "framer-motion";
import { SkillTreePage } from "./components/skill-tree/SkillTreePage";
import { OrbInteriorView } from "./components/skill-tree/OrbInteriorView";
import { KnowledgeChamberPage } from "./components/chamber/KnowledgeChamberPage";
import { useKnowledgeStore } from "./store/useKnowledgeStore";
import { LocalVaultAutosave } from "./utils/localVault";

function App() {
  const appMode = useKnowledgeStore((state) => state.appMode);

  return (
    <>
      <LocalVaultAutosave />
      <AnimatePresence mode="wait">
        {appMode === "knowledge-chamber" ? (
          <motion.div key="chamber" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <KnowledgeChamberPage />
          </motion.div>
        ) : appMode === "orb-interior" ? (
          <motion.div key="interior" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <OrbInteriorView />
          </motion.div>
        ) : (
          <motion.div key="skill-tree" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <SkillTreePage />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
