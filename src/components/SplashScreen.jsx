import React, { useEffect } from "react";
import { motion } from "framer-motion";

export default function SplashScreen({ onDone }) {
  useEffect(() => {
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-[100] bg-[#1A3A6B]"
    />
  );
}