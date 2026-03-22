import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

// SVG Icons
const SoccerBall = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16">
    <circle cx="50" cy="50" r="48" fill="#000" stroke="#fff" strokeWidth="2" />
    <circle cx="50" cy="50" r="40" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
    <g fill="#fff">
      <polygon points="50,20 60,35 75,35 65,45 70,60 50,50 30,60 35,45 25,35 40,35" />
    </g>
  </svg>
);

const PadelRacket = () => (
  <svg viewBox="0 0 100 100" className="w-16 h-16">
    <rect x="35" y="10" width="30" height="50" rx="15" fill="#29ABE2" stroke="#fff" strokeWidth="2" />
    <rect x="40" y="15" width="20" height="40" fill="none" stroke="#fff" strokeWidth="1" opacity="0.3" />
    <rect x="38" y="60" width="24" height="30" fill="#29ABE2" stroke="#fff" strokeWidth="2" />
    <line x1="50" y1="60" x2="50" y2="90" stroke="#fff" strokeWidth="2" />
  </svg>
);

const LocationPin = () => (
  <svg viewBox="0 0 100 100" className="w-14 h-14">
    <path d="M50 10 C35 10 25 20 25 35 C25 55 50 85 50 85 C50 85 75 55 75 35 C75 20 65 10 50 10" 
          fill="#4CB648" stroke="#fff" strokeWidth="2" />
    <circle cx="50" cy="35" r="8" fill="#fff" />
  </svg>
);

const Silhouettes = () => (
  <svg viewBox="0 0 400 100" className="w-full h-24">
    {[...Array(5)].map((_, i) => (
      <g key={i} transform={`translate(${i * 80}, 0)`}>
        <ellipse cx="40" cy="30" rx="12" ry="15" fill="#000" opacity="0.6" />
        <ellipse cx="40" cy="55" rx="20" ry="25" fill="#000" opacity="0.6" />
        <rect x="28" y="48" width="24" height="18" fill="#000" opacity="0.6" />
      </g>
    ))}
  </svg>
);

export default function IntroAnimation({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      onComplete?.();
    }, 8000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-primary via-primary to-[#1B5EA8] flex flex-col items-center justify-center overflow-hidden">
      {/* Light sweep animation (0-2s) */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent"
        initial={{ x: "-200%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      {/* Audience silhouettes (0-2s) */}
      <motion.div
        className="absolute bottom-0 w-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      >
        <Silhouettes />
      </motion.div>

      {/* Scene 2: Soccer ball (2-4s) */}
      <motion.div
        className="absolute"
        initial={{ x: "-200px", opacity: 0 }}
        animate={{ x: "100px", y: [0, -30, 0] }}
        transition={{
          x: { duration: 2, delay: 2 },
          y: { duration: 1.2, delay: 2, repeat: Infinity },
          opacity: { duration: 0.5, delay: 2 },
        }}
      >
        <SoccerBall />
      </motion.div>

      {/* Scene 2: Padel racket (2-4s) */}
      <motion.div
        className="absolute"
        initial={{ x: "200px", y: "-100px", opacity: 0 }}
        animate={{ x: "-80px", y: "-50px" }}
        transition={{
          duration: 2,
          delay: 2,
          ease: "easeOut",
          opacity: { duration: 0.5, delay: 2 },
        }}
      >
        <PadelRacket />
      </motion.div>

      {/* Scene 2: Location pin (2-4s) */}
      <motion.div
        className="absolute"
        initial={{ y: "-150px", opacity: 0, scale: 0.5 }}
        animate={{ y: "40px", opacity: 1, scale: 1 }}
        transition={{
          duration: 2,
          delay: 2,
          ease: "easeOut",
        }}
      >
        <LocationPin />
      </motion.div>

      {/* Scene 3: Sparkles (4-6s) */}
      {[...Array(6)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 bg-white rounded-full"
          initial={{
            x: Math.cos((i / 6) * Math.PI * 2) * 150,
            y: Math.sin((i / 6) * Math.PI * 2) * 150,
            opacity: 0,
            scale: 0,
          }}
          animate={{
            opacity: [0, 1, 0],
            scale: [0, 1, 0],
          }}
          transition={{
            duration: 1.5,
            delay: 4 + (i * 0.2),
          }}
        />
      ))}

      {/* Logo text (6-8s) */}
      <motion.div
        className="relative z-10 text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 1,
          delay: 6,
          ease: "easeOut",
        }}
      >
        <motion.img
          src="https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png"
          alt="Se Juega"
          className="w-24 h-24 rounded-2xl shadow-2xl mx-auto mb-6"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.6, delay: 6 }}
        />
        
        <motion.div
          className="text-white text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 6.3 }}
        >
          <h1 className="text-5xl font-extrabold tracking-tight">Se Juega</h1>
          <p className="text-lg text-white/80 mt-2">Encontrá tu partido</p>
        </motion.div>

        {/* Final zoom out */}
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 1, delay: 7 }}
        />
      </motion.div>
    </div>
  );
}