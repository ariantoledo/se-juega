import React, { useEffect } from "react";
import { motion } from "framer-motion";

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
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 0.2, y: 0 }}
        transition={{ duration: 1.8, delay: 0.3 }}
      >
        <svg viewBox="0 0 400 80" className="w-full" preserveAspectRatio="none">
          {[20,55,90,125,160,195,230,265,300,335,370].map((x, i) => (
            <g key={i} transform={`translate(${x}, ${i % 2 === 0 ? 5 : 18})`}>
              <ellipse cx="10" cy="68" rx="10" ry="32" fill="black" />
              <circle cx="10" cy="28" r="9" fill="black" />
              {i % 3 === 0 && (
                <line x1="10" y1="38" x2="26" y2="18" stroke="black" strokeWidth="5" strokeLinecap="round" />
              )}
            </g>
          ))}
        </svg>
      </motion.div>

      {/* Sparkles */}
      {[
        { x: 10, y: 15, d: 0.6 }, { x: 85, y: 10, d: 1.0 }, { x: 20, y: 65, d: 1.4 },
        { x: 75, y: 55, d: 0.8 }, { x: 50, y: 6,  d: 1.7 }, { x: 92, y: 40, d: 1.1 },
        { x: 6,  y: 45, d: 2.0 }, { x: 62, y: 72, d: 0.5 }, { x: 42, y: 25, d: 2.2 },
      ].map((s, i) => (
        <Sparkle key={i} x={s.x} y={s.y} delay={s.d} size={i % 3 === 0 ? 4 : 2} />
      ))}

      {/* ── Elementos deportivos (2–4.5s): entran y se quedan ── */}

      {/* ⚽ Pelota desde la izquierda */}
      <motion.div
        className="absolute select-none"
        style={{ top: "38%", left: "15%" }}
        initial={{ x: -280, rotate: 0, opacity: 0 }}
        animate={{ x: 0, rotate: 540, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2, ease: [0.34, 1.2, 0.64, 1] }}
      >
        <span style={{ fontSize: 72 }}>⚽</span>
      </motion.div>

      {/* 🏸 Paleta desde la derecha */}
      <motion.div
        className="absolute select-none"
        style={{ top: "36%", right: "12%" }}
        initial={{ x: 280, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1.1, delay: 2.5, ease: [0.34, 1.4, 0.64, 1] }}
      >
        <span style={{ fontSize: 64 }}>🏸</span>
      </motion.div>

      {/* 📍 Pin desde arriba, al centro */}
      <motion.div
        className="absolute select-none"
        style={{ top: "22%", left: "50%", transform: "translateX(-50%)" }}
        initial={{ y: -280, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 3, ease: [0.22, 1.4, 0.36, 1] }}
      >
        <span style={{ fontSize: 72 }}>📍</span>
      </motion.div>

      {/* ── Glow central (4s+) ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280, height: 280,
          top: "50%", left: "50%",
          transform: "translate(-50%, -50%)",
          background: "radial-gradient(circle, rgba(76,175,80,0.22) 0%, transparent 70%)",
        }}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, delay: 4 }}
      />

      {/* Destellos orbitales */}
      {[...Array(10)].map((_, i) => {
        const angle = (i / 10) * Math.PI * 2;
        const r = 110;
        return (
          <motion.div
            key={`ring-${i}`}
            className="absolute w-1.5 h-1.5 bg-white rounded-full pointer-events-none"
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(50% + ${Math.sin(angle) * r}px)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0] }}
            transition={{ duration: 0.5, delay: 4.5 + i * 0.08 }}
          />
        );
      })}

      {/* ── Texto "Se Juega" (5.5s+) ── */}
      <motion.div
        className="absolute flex flex-col items-center text-center px-6 w-full"
        style={{ bottom: "18%" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 5.5 }}
      >
        <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl">
          Se Juega
        </h1>
        <motion.p
          className="text-base text-white/75 mt-2 font-medium tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 6.2 }}
        >
          Encontrá tu partido
        </motion.p>
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