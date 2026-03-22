import React, { useEffect } from "react";
import { motion } from "framer-motion";

const NEW_LOGO = "https://media.base44.com/images/public/69af676714ee0899079240af/514321eb2_Logodeportivoconp.png";

export default function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-[#1B5EA8] via-primary to-[#4CB648] flex flex-col items-center justify-center overflow-hidden">
      {/* Light sweep animation (0-2s) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-200%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Scene 1: Audience silhouettes fade-in (0-2s) */}
      <motion.div
        className="absolute bottom-0 w-full opacity-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      >
        <div className="h-32 bg-gradient-to-t from-black/30 to-transparent" />
      </motion.div>

      {/* Scene 3: Logo animates in (4-6s) */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{
          duration: 1.5,
          delay: 4,
          ease: "easeOut",
        }}
      >
        <motion.img
          src={NEW_LOGO}
          alt="Se Juega"
          className="w-40 h-40 drop-shadow-2xl"
          animate={{ y: [0, -10, 0] }}
          transition={{
            duration: 2,
            delay: 4,
            repeat: Infinity,
          }}
        />
      </motion.div>

      {/* Scene 3: Sparkles around logo (4-6s) */}
      {[...Array(8)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          initial={{
            x: Math.cos((i / 8) * Math.PI * 2) * 180,
            y: Math.sin((i / 8) * Math.PI * 2) * 180,
            opacity: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 1.2,
            delay: 4.5 + (i * 0.15),
          }}
        />
      ))}

      {/* Scene 4: Text appears (6-8s) */}
      <motion.div
        className="relative z-10 text-center mt-12"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.8,
          delay: 6,
        }}
      >
        <h1 className="text-6xl font-black text-white tracking-tight drop-shadow-lg">Se Juega</h1>
        <motion.p
          className="text-xl text-white/90 mt-3 font-semibold"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 6.4 }}
        >
          Encontrá tu partido
        </motion.p>
      </motion.div>

      {/* Fade out to next screen (7.5-8s) */}
      <motion.div
        className="absolute inset-0 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 7.5 }}
      />
    </div>
  );
}