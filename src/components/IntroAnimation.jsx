import React, { useEffect } from "react";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/69af676714ee0899079240af/514321eb2_Logodeportivoconp.png";

function Sparkle({ x, y, delay, size = 3 }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/70 pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
      transition={{ duration: 1, delay, repeat: 2, repeatDelay: 2 }}
    />
  );
}

export default function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0D3B5C 0%, #1565C0 40%, #1B8A3E 80%, #0D5C2A 100%)" }}
    >
      {/* Light sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 20%, rgba(255,255,255,0.1) 50%, transparent 80%)" }}
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2.2, ease: "easeInOut" }}
      />

      {/* Audience silhouettes */}
      <motion.div
        className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none"
        style={{ background: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 80'%3E%3Cellipse cx='20' cy='70' rx='10' ry='30' fill='%23000'/%3E%3Ccircle cx='20' cy='35' r='8' fill='%23000'/%3E%3Cellipse cx='55' cy='75' rx='10' ry='25' fill='%23000'/%3E%3Ccircle cx='55' cy='45' r='8' fill='%23000'/%3E%3Cellipse cx='90' cy='65' rx='10' ry='35' fill='%23000'/%3E%3Ccircle cx='90' cy='25' r='8' fill='%23000'/%3E%3Cellipse cx='125' cy='72' rx='10' ry='28' fill='%23000'/%3E%3Ccircle cx='125' cy='38' r='8' fill='%23000'/%3E%3Cellipse cx='160' cy='68' rx='10' ry='32' fill='%23000'/%3E%3Ccircle cx='160' cy='30' r='8' fill='%23000'/%3E%3Cellipse cx='195' cy='74' rx='10' ry='26' fill='%23000'/%3E%3Ccircle cx='195' cy='42' r='8' fill='%23000'/%3E%3Cellipse cx='230' cy='66' rx='10' ry='34' fill='%23000'/%3E%3Ccircle cx='230' cy='26' r='8' fill='%23000'/%3E%3Cellipse cx='265' cy='72' rx='10' ry='28' fill='%23000'/%3E%3Ccircle cx='265' cy='38' r='8' fill='%23000'/%3E%3Cellipse cx='300' cy='68' rx='10' ry='32' fill='%23000'/%3E%3Ccircle cx='300' cy='30' r='8' fill='%23000'/%3E%3Cellipse cx='335' cy='70' rx='10' ry='30' fill='%23000'/%3E%3Ccircle cx='335' cy='34' r='8' fill='%23000'/%3E%3Cellipse cx='370' cy='75' rx='10' ry='25' fill='%23000'/%3E%3Ccircle cx='370' cy='44' r='8' fill='%23000'/%3E%3C/svg%3E\") repeat-x bottom", backgroundSize: "400px 80px", opacity: 0 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.22, y: 0 }}
        transition={{ duration: 1.8, delay: 0.3 }}
      />

      {/* Sparkles */}
      {[
        { x: 10, y: 15, d: 0.6 }, { x: 85, y: 10, d: 1.0 }, { x: 20, y: 65, d: 1.4 },
        { x: 75, y: 60, d: 0.8 }, { x: 50, y: 6, d: 1.7 }, { x: 92, y: 40, d: 1.1 },
        { x: 6, y: 45, d: 2.0 }, { x: 62, y: 78, d: 0.5 }, { x: 42, y: 28, d: 2.2 },
      ].map((s, i) => (
        <Sparkle key={i} x={s.x} y={s.y} delay={s.d} size={i % 3 === 0 ? 4 : 2} />
      ))}

      {/* ── Scene 2 (2–4s): Sport elements enter ── */}

      {/* ⚽ Football from left */}
      <motion.div
        className="absolute text-7xl select-none"
        style={{ top: "38%", left: "18%" }}
        initial={{ x: -300, rotate: 0, opacity: 0 }}
        animate={{ x: 0, rotate: 540, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.4, delay: 2, ease: [0.34, 1.2, 0.64, 1], times: [0, 0.3, 0.7, 1] }}
      >
        ⚽
      </motion.div>

      {/* 🏸 Padel from right */}
      <motion.div
        className="absolute text-6xl select-none"
        style={{ top: "36%", right: "16%" }}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1.2, delay: 2.4, ease: [0.34, 1.4, 0.64, 1], times: [0, 0.3, 0.7, 1] }}
      >
        🏸
      </motion.div>

      {/* 📍 Pin from above */}
      <motion.div
        className="absolute text-6xl select-none"
        style={{ top: "28%", left: "50%", transform: "translateX(-50%)" }}
        initial={{ y: -300, opacity: 0 }}
        animate={{ y: 0, opacity: [0, 1, 1, 0] }}
        transition={{ duration: 1, delay: 2.8, ease: [0.22, 1.4, 0.36, 1], times: [0, 0.3, 0.7, 1] }}
      >
        📍
      </motion.div>

      {/* ── Scene 3+4 (4.5–8s): Logo + text ── */}
      <motion.div
        className="flex flex-col items-center gap-6 relative z-10 px-8 w-full"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 4.5, ease: [0.34, 1.2, 0.64, 1] }}
      >
        {/* Glow */}
        <motion.div
          className="absolute rounded-full pointer-events-none"
          style={{
            width: 240, height: 240,
            background: "radial-gradient(circle, rgba(76,175,80,0.25) 0%, transparent 70%)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2, delay: 4.8 }}
        />

        {/* Logo */}
        <motion.img
          src={LOGO_URL}
          alt="Se Juega"
          className="w-40 h-40 drop-shadow-2xl relative z-10"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 2.5, delay: 6, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Ring sparkles */}
        {[...Array(10)].map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 100;
          return (
            <motion.div
              key={`ring-${i}`}
              className="absolute w-1.5 h-1.5 bg-white rounded-full pointer-events-none"
              style={{
                left: `calc(50% + ${Math.cos(angle) * r}px)`,
                top: `calc(50% + ${Math.sin(angle) * r - 20}px)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
              transition={{ duration: 0.5, delay: 5.2 + i * 0.08 }}
            />
          );
        })}

        {/* Text */}
        <motion.div
          className="relative z-10 text-center w-full"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 5.8 }}
        >
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl">
            Se Juega
          </h1>
          <motion.p
            className="text-base text-white/80 mt-2 font-medium tracking-widest uppercase"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 6.4 }}
          >
            Encontrá tu partido
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Fade to app */}
      <motion.div
        className="absolute inset-0 bg-[#1E90FF] pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.8, delay: 7.2, times: [0, 0.4, 1] }}
      />
    </div>
  );
}