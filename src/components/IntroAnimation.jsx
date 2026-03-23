import React, { useEffect } from "react";
import { motion } from "framer-motion";

function Sparkle({ x, y, delay, size = 3 }) {
  return (
    <motion.div
      className="absolute rounded-full bg-white/80"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
      transition={{ duration: 0.9, delay, repeat: 2, repeatDelay: 1.8 }}
    />
  );
}

function Audience() {
  return (
    <motion.svg
      viewBox="0 0 400 100"
      className="absolute bottom-0 left-0 right-0 w-full opacity-0"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 0.25, y: 0 }}
      transition={{ duration: 1.8, delay: 0.3, ease: "easeOut" }}
      preserveAspectRatio="none"
    >
      {[15,45,75,105,135,165,195,225,255,285,315,345,375].map((x, i) => (
        <g key={i} transform={`translate(${x}, ${i % 2 === 0 ? 10 : 25})`}>
          <ellipse cx="10" cy="70" rx="12" ry="35" fill="black" />
          <circle cx="10" cy="25" r="9" fill="black" />
          {i % 3 === 0 && (
            <>
              <line x1="10" y1="35" x2="-6" y2="15" stroke="black" strokeWidth="5" strokeLinecap="round" />
              <line x1="10" y1="35" x2="26" y2="13" stroke="black" strokeWidth="5" strokeLinecap="round" />
            </>
          )}
        </g>
      ))}
      <rect x="0" y="85" width="400" height="15" fill="black" />
    </motion.svg>
  );
}

// SVG sport elements for crisp rendering
function Football({ className, ...props }) {
  return (
    <motion.svg viewBox="0 0 64 64" className={className} width="72" height="72" {...props}>
      <circle cx="32" cy="32" r="30" fill="white" stroke="#333" strokeWidth="1.5" />
      <path d="M32 2 L38 15 L52 15 L41 24 L45 38 L32 29 L19 38 L23 24 L12 15 L26 15Z" fill="#333" />
      <path d="M32 62 L38 49 L52 49 L41 40 L45 26 L32 35 L19 26 L23 40 L12 49 L26 49Z" fill="#333" opacity="0.5" />
    </motion.svg>
  );
}

function PadelRacket({ className, ...props }) {
  return (
    <motion.svg viewBox="0 0 64 80" className={className} width="60" height="75" {...props}>
      <rect x="26" y="48" width="12" height="28" rx="4" fill="#1565C0" />
      <ellipse cx="32" cy="28" rx="22" ry="28" fill="#1E88E5" stroke="#0D47A1" strokeWidth="1.5" />
      <circle cx="24" cy="20" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="32" cy="18" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="40" cy="20" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="24" cy="30" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="32" cy="28" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="40" cy="30" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="28" cy="38" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="36" cy="38" r="2" fill="#0D47A1" opacity="0.4" />
      <circle cx="50" cy="10" r="6" fill="#C6FF00" stroke="#8BC34A" strokeWidth="1" />
    </motion.svg>
  );
}

function LocationPin({ className, ...props }) {
  return (
    <motion.svg viewBox="0 0 48 64" className={className} width="56" height="74" {...props}>
      <path d="M24 0 C10.7 0 0 10.7 0 24 C0 42 24 64 24 64 C24 64 48 42 48 24 C48 10.7 37.3 0 24 0Z" fill="#4CAF50" />
      <polygon points="24,12 27,20 36,20 29,25.5 31.5,34 24,28.5 16.5,34 19,25.5 12,20 21,20" fill="white" />
    </motion.svg>
  );
}

export default function IntroAnimation({ onComplete }) {
  useEffect(() => {
    const timer = setTimeout(() => onComplete?.(), 8000);
    return () => clearTimeout(timer);
  }, [onComplete]);

  // Center reference point
  const centerY = "42%";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0D3B5C 0%, #1565C0 35%, #1B8A3E 75%, #0D5C2A 100%)" }}
    >
      {/* ── Scene 1 (0-2s): Background, sweep, audience ── */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.12), transparent)" }}
        initial={{ x: "-100%" }}
        animate={{ x: "200%" }}
        transition={{ duration: 2, ease: "easeInOut" }}
      />

      <Audience />

      {/* Sparkles scattered */}
      {[
        { x: 12, y: 18, d: 0.5 }, { x: 88, y: 12, d: 0.9 }, { x: 25, y: 72, d: 1.3 },
        { x: 72, y: 68, d: 0.7 }, { x: 50, y: 8, d: 1.6 }, { x: 92, y: 45, d: 1.0 },
        { x: 8, y: 48, d: 1.9 }, { x: 65, y: 82, d: 0.4 }, { x: 38, y: 32, d: 2.1 },
      ].map((s, i) => (
        <Sparkle key={i} x={s.x} y={s.y} delay={s.d} size={i % 3 === 0 ? 4 : 2} />
      ))}

      {/* ── Scene 2 (2-4s): Sport elements enter individually ── */}

      {/* ⚽ Football rolls from left */}
      <motion.div
        className="absolute"
        style={{ top: centerY, left: "50%", marginLeft: -110 }}
        initial={{ x: -300, rotate: 0, opacity: 0 }}
        animate={{ x: 0, rotate: 720, opacity: 1 }}
        transition={{ duration: 1.2, delay: 2, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <Football />
      </motion.div>

      {/* 🎾 Padel racket bounces from right */}
      <motion.div
        className="absolute"
        style={{ top: centerY, left: "50%", marginLeft: 40 }}
        initial={{ x: 300, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1, delay: 2.4, ease: [0.34, 1.56, 0.64, 1] }}
      >
        <PadelRacket />
      </motion.div>

      {/* 📍 Pin drops from above */}
      <motion.div
        className="absolute"
        style={{ top: centerY, left: "50%", marginLeft: -28, marginTop: -60 }}
        initial={{ y: -400, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, delay: 2.8, ease: [0.22, 1, 0.36, 1] }}
      >
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.3, delay: 3.7 }}
        >
          <LocationPin />
        </motion.div>
      </motion.div>

      {/* ── Scene 3 (4-5.5s): Elements glow together ── */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: 280, height: 280,
          top: centerY, left: "50%",
          marginLeft: -140, marginTop: -80,
          background: "radial-gradient(circle, rgba(76,175,80,0.2) 0%, transparent 70%)"
        }}
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: [0.6, 1.15, 1] }}
        transition={{ duration: 1.2, delay: 4 }}
      />

      {/* Ring of sparkles around assembled elements */}
      {[...Array(12)].map((_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const r = 130;
        return (
          <motion.div
            key={`ring-${i}`}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `calc(50% + ${Math.cos(angle) * r}px)`,
              top: `calc(${centerY} + ${Math.sin(angle) * r - 40}px)`,
            }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0], scale: [0, 1.3, 0] }}
            transition={{ duration: 0.6, delay: 4.5 + i * 0.08 }}
          />
        );
      })}

      {/* ── Scene 4 (5.5-8s): "Se Juega" text ── */}
      <motion.div
        className="absolute z-20 text-center"
        style={{ top: "68%", left: "50%", transform: "translateX(-50%)" }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 5.5 }}
      >
        <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight drop-shadow-xl whitespace-nowrap">
          Se Juega
        </h1>
        <motion.p
          className="text-lg text-white/80 mt-2 font-semibold tracking-wide"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 6.2 }}
        >
          Encontrá tu partido
        </motion.p>
      </motion.div>

      {/* Zoom-out + fade to app */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        initial={{ scale: 1 }}
        animate={{ scale: [1, 1, 1.05] }}
        transition={{ duration: 1, delay: 7 }}
      />
      <motion.div
        className="absolute inset-0 bg-background pointer-events-none"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 1] }}
        transition={{ duration: 0.8, delay: 7.2, times: [0, 0.3, 1] }}
      />
    </div>
  );
}