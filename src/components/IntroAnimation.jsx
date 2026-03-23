import React, { useEffect } from "react";
import { motion } from "framer-motion";

const LOGO_URL = "https://media.base44.com/images/public/69af676714ee0899079240af/514321eb2_Logodeportivoconp.png";

// Sparkle dot component
function Sparkle({ x, y, delay, size = 3 }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
      transition={{ duration: 0.8, delay, repeat: Infinity, repeatDelay: 2 }}
    />
  );
}

// Audience silhouette row
function Audience() {
  return (
    <motion.div
      className="absolute bottom-0 left-0 right-0 flex items-end justify-center overflow-hidden"
      initial={{ opacity: 0, y: 60 }}
      animate={{ opacity: 0.35, y: 0 }}
      transition={{ duration: 1.5, delay: 0.3, ease: "easeOut" }}
    >
      <svg viewBox="0 0 400 120" className="w-full" fill="black">
        {/* Crowd silhouettes */}
        {[20,50,80,110,140,170,200,230,260,290,320,350,380].map((x, i) => (
          <g key={i} transform={`translate(${x}, ${i % 2 === 0 ? 20 : 35})`}>
            <ellipse cx="10" cy="80" rx="12" ry="40" />
            <circle cx="10" cy="28" r="10" />
            {i % 3 === 0 && (
              <>
                <line x1="10" y1="40" x2="-8" y2="20" stroke="black" strokeWidth="5" strokeLinecap="round"/>
                <line x1="10" y1="40" x2="28" y2="18" stroke="black" strokeWidth="5" strokeLinecap="round"/>
              </>
            )}
          </g>
        ))}
        <rect x="0" y="100" width="400" height="20" />
      </svg>
    </motion.div>
  );
}

export default function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0D3B5C 0%, #1565C0 35%, #1B8A3E 75%, #0D5C2A 100%)" }}
    >
      {/* ── Escena 1: Light sweep (0–2s) ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%)" }}
        initial={{ x: "-120%" }}
        animate={{ x: "220%" }}
        transition={{ duration: 2.2, ease: "easeInOut", delay: 0 }}
      />

      {/* Audience */}
      <Audience />

      {/* Background sparkles (scattered) */}
      {[
        {x:15,y:20,d:0.5},{x:85,y:15,d:0.8},{x:30,y:70,d:1.2},{x:70,y:65,d:0.6},
        {x:50,y:10,d:1.5},{x:90,y:50,d:0.9},{x:10,y:50,d:1.8},{x:60,y:80,d:0.4},
        {x:40,y:35,d:2.0},{x:75,y:30,d:1.1},
      ].map((s,i) => <Sparkle key={i} x={s.x} y={s.y} delay={s.d} size={i%3===0?4:2} />)}

      {/* ── Escena 2: Elementos deportivos (2–4s) ── */}

      {/* ⚽ Pelota fútbol - entra desde izquierda */}
      <motion.div
        className="absolute text-6xl select-none"
        style={{ top: "52%", left: 0 }}
        initial={{ x: -120, rotate: 0, opacity: 0 }}
        animate={{ x: [-120, 0, -60], rotate: [0, -360, -360], opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: 2, ease: "easeInOut" }}
      >
        ⚽
      </motion.div>

      {/* 🎾 Paleta pádel - entra desde derecha */}
      <motion.div
        className="absolute text-5xl select-none"
        style={{ top: "50%", right: 0 }}
        initial={{ x: 120, opacity: 0 }}
        animate={{ x: [120, 0, 60], opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: 2.3, ease: "easeInOut" }}
      >
        🎾
      </motion.div>

      {/* 📍 Pin - cae desde arriba */}
      <motion.div
        className="absolute text-5xl select-none"
        style={{ top: 0, left: "50%", transform: "translateX(-50%)" }}
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: [-100, 0, -40], opacity: [0, 1, 0] }}
        transition={{ duration: 2, delay: 2.6, ease: "easeOut" }}
      >
        📍
      </motion.div>

      {/* ── Escena 3 + 4: Logo completo + texto (4–8s) ── */}
      <motion.div
        className="relative z-10 flex flex-col items-center"
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: [0.5, 1.08, 1] }}
        transition={{ duration: 1.2, delay: 4, ease: "easeOut" }}
      >
        {/* Glow behind logo */}
        <motion.div
          className="absolute rounded-full"
          style={{
            width: 220, height: 220,
            background: "radial-gradient(circle, rgba(255,255,255,0.18) 0%, transparent 70%)",
            top: "50%", left: "50%", transform: "translate(-50%,-50%)"
          }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: [0, 1, 0.6], scale: [0.5, 1.3, 1.1] }}
          transition={{ duration: 1.5, delay: 4.2 }}
        />

        <motion.img
          src={LOGO_URL}
          alt="Se Juega"
          className="w-44 h-44 drop-shadow-2xl relative z-10"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 2.5, delay: 5.5, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Destellos alrededor del logo */}
        {[...Array(10)].map((_, i) => {
          const angle = (i / 10) * Math.PI * 2;
          const r = 110;
          return (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `calc(50% + ${Math.cos(angle) * r}px)`,
                top: `calc(50% + ${Math.sin(angle) * r}px)`,
              }}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: [0, 1, 0], scale: [0, 1.4, 0] }}
              transition={{ duration: 0.7, delay: 5 + i * 0.1 }}
            />
          );
        })}

        {/* Texto "Se Juega" */}
        <motion.div
          className="mt-6 text-center relative z-10"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 5.5 }}
        >
          <h1 className="text-5xl font-black text-white tracking-tight drop-shadow-xl">
            Se Juega
          </h1>
          <motion.p
            className="text-lg text-white/85 mt-2 font-semibold tracking-wide"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 6.1 }}
          >
            Encontrá tu partido
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Fade out final */}
      <motion.div
        className="absolute inset-0 bg-background pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0, 1] }}
        transition={{ duration: 1, delay: 7, times: [0, 0.5, 0.7, 1] }}
      />
    </div>
  );
}