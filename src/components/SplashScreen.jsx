import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    // Splash muy breve: 0.5-0.8 segundos total
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#0D3B5C] via-[#1A5A8C] to-[#2D8F47]"
    >
      {/* Minimal loading indicator */}
      <motion.div
        className="w-3 h-3 bg-white rounded-full"
        animate={{ scale: [1, 1.3, 1] }}
        transition={{ duration: 0.8, repeat: Infinity }}
      />
    </motion.div>
  );
}