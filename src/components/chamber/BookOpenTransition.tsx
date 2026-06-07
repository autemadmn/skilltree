import { motion } from "framer-motion";

export function BookOpenTransition({ active }: { active: boolean }) {
  if (!active) return null;
  return <motion.div className="book-entry-fade" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }} />;
}
