import React from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Wraps page content in the app-wide entrance: 250ms fade + 4px rise. */
export default function PageTransition({ children, className = "" }) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: reduced ? 0 : 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduced ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
