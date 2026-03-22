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
  useEffect(() => {
    // Splash muy breve: 0.5-0.8 segundos total
    const timer = setTimeout(onDone, 700);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <AnimatePresence>
      {phase !== "done" && (
        <motion.div
          key="splash"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-[#1B5EA8] via-primary to-[#4CB648]"
        >
          {/* Minimal loading indicator */}
          <motion.div
            className="w-3 h-3 bg-white rounded-full"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 0.8, repeat: Infinity }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}