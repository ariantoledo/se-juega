import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// SVG logo elements representing Se Juega brand components
const BallIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <circle cx="24" cy="24" r="22" fill="white" fillOpacity="0.95"/>
    <path d="M24 2C24 2 16 10 16 24C16 38 24 46 24 46" stroke="#29ABE2" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M24 2C24 2 32 10 32 24C32 38 24 46 24 46" stroke="#29ABE2" strokeWidth="2.5" strokeLinecap="round"/>
    <path d="M2 24H46" stroke="#29ABE2" strokeWidth="2.5"/>
    <path d="M4 16H44" stroke="#29ABE2" strokeWidth="2" opacity="0.5"/>
    <path d="M4 32H44" stroke="#29ABE2" strokeWidth="2" opacity="0.5"/>
  </svg>
);

const PinIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <path d="M24 4C16.27 4 10 10.27 10 18C10 28.5 24 44 24 44C24 44 38 28.5 38 18C38 10.27 31.73 4 24 4Z" fill="white" fillOpacity="0.95"/>
    <path d="M24 4C16.27 4 10 10.27 10 18C10 28.5 24 44 24 44C24 44 38 28.5 38 18C38 10.27 31.73 4 24 4Z" stroke="#4CB648" strokeWidth="2"/>
    <path d="M24 12L25.8 17.4H31.4L26.8 20.6L28.6 26L24 22.8L19.4 26L21.2 20.6L16.6 17.4H22.2L24 12Z" fill="#4CB648"/>
  </svg>
);

const RacketIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <ellipse cx="20" cy="18" rx="14" ry="16" fill="white" fillOpacity="0.95" stroke="#1B5EA8" strokeWidth="2"/>
    <line x1="13" y1="18" x2="27" y2="18" stroke="#1B5EA8" strokeWidth="1.5" opacity="0.6"/>
    <line x1="13" y1="12" x2="27" y2="12" stroke="#1B5EA8" strokeWidth="1.5" opacity="0.6"/>
    <line x1="13" y1="24" x2="27" y2="24" stroke="#1B5EA8" strokeWidth="1.5" opacity="0.6"/>
    <line x1="17" y1="4" x2="17" y2="32" stroke="#1B5EA8" strokeWidth="1.5" opacity="0.6"/>
    <line x1="23" y1="4" x2="23" y2="32" stroke="#1B5EA8" strokeWidth="1.5" opacity="0.6"/>
    <rect x="18" y="30" width="4" height="14" rx="2" fill="#1B5EA8" opacity="0.8"/>
    <circle cx="36" cy="38" r="5" fill="white" fillOpacity="0.9" stroke="#4CB648" strokeWidth="2"/>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 48 48" fill="none" className="w-full h-full">
    <path d="M14 6H34V22C34 29.73 29.73 34 24 34C18.27 34 14 29.73 14 22V6Z" fill="white" fillOpacity="0.95" stroke="#29ABE2" strokeWidth="2"/>
    <path d="M14 10H8C8 10 6 10 6 16C6 22 10 24 14 22" stroke="#29ABE2" strokeWidth="2" strokeLinecap="round"/>
    <path d="M34 10H40C40 10 42 10 42 16C42 22 38 24 34 22" stroke="#29ABE2" strokeWidth="2" strokeLinecap="round"/>
    <rect x="20" y="34" width="8" height="6" fill="white" fillOpacity="0.9"/>
    <rect x="16" y="40" width="16" height="3" rx="1.5" fill="white" fillOpacity="0.95" stroke="#29ABE2" strokeWidth="1.5"/>
    <path d="M20 16L22 21H27L23 24L25 29L20 26L15 29L17 24L13 21H18L20 16Z" fill="#4CB648"/>
  </svg>
);

const ELEMENTS = [
  { id: "ball",   Component: BallIcon,   x: "20%", y: "28%", size: 64, delay: 0 },
  { id: "pin",    Component: PinIcon,    x: "62%", y: "22%", size: 56, delay: 0.3 },
  { id: "racket", Component: RacketIcon, x: "18%", y: "58%", size: 60, delay: 0.6 },
  { id: "trophy", Component: TrophyIcon, x: "64%", y: "56%", size: 58, delay: 0.9 },
];

export default function SplashScreen({ onDone }) {
  const [phase, setPhase] = useState("elements"); // elements → logo → exit

  useEffect(() => {
    // After elements appear (0.9 + 0.4 anim = ~1.5s), show logo
    const t1 = setTimeout(() => setPhase("logo"), 1600);
    // After logo shows, exit
    const t2 = setTimeout(() => setPhase("exit"), 2500);
    const t3 = setTimeout(onDone, 2900);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1B5EA8 0%, #29ABE2 45%, #4CB648 100%)",
          }}
        >
          {/* Background mesh */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "radial-gradient(circle at 20% 80%, #fff 1px, transparent 1px), radial-gradient(circle at 80% 20%, #fff 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
          <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-white/5 translate-x-1/3 translate-y-1/3" />

          {/* Floating logo elements */}
          {ELEMENTS.map(({ id, Component, x, y, size, delay }) => (
            <motion.div
              key={id}
                 initial={{ scale: 0, opacity: 0, rotate: -20 }}
              animate={phase === "elements" || phase === "logo"
                ? { scale: 1, opacity: 1, rotate: 0 }
                : { scale: 0.5, opacity: 0 }}
              exit={{ scale: 0.5, opacity: 0 }}
            >
              <Component />
            </motion.div>
          ))}

          {/* Central logo */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={phase === "logo" || phase === "exit"
              ? { scale: 1, opacity: 1 }
              : { scale: 0.5, opacity: 0 }}
            exit={{ scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.4, ease: "backOut" }}
            className="relative z-10 flex flex-col items-center gap-4"
          >
            <div className="w-28 h-28 rounded-3xl bg-white/90 backdrop-blur-sm shadow-2xl flex items-center justify-center">
              <img
                src="https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png"
                alt="Se Juega"
                className="w-20 h-20 rounded-2xl object-cover"
              />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={phase === "logo" || phase === "exit" ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ delay: 0.2, duration: 0.3 }}
              className="text-white text-3xl font-extrabold tracking-tight drop-shadow-lg"
            >
              Se Juega
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}