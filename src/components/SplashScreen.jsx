import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    // Splash minimalista: 0.7 segundos total
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-[#1E90FF]"
    >
      {/* Logo limpio sin animación */}
      <motion.img
        src="https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png"
        alt="Se Juega"
        className="w-32 h-32 drop-shadow-lg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
    </motion.div>
  );
}