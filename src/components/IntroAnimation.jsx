import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactDOM from "react-dom";

// Crowd silhouette SVG path
const CrowdSilhouette = ({ flip = false, className = "" }) => (
  <svg
    viewBox="0 0 800 180"
    className={`absolute bottom-0 w-full ${className}`}
    style={{ transform: flip ? "scaleX(-1)" : undefined }}
    preserveAspectRatio="xMidYMax meet"
  >
    <path
      d="M0 180 L0 120 Q20 100 40 115 Q60 130 80 110 Q100 90 120 105 Q140 120 160 100
         Q180 80 200 95 Q220 110 240 90 Q260 70 280 88 Q300 106 320 85
         Q340 64 360 80 Q380 96 400 78 Q420 60 440 76 Q460 92 480 72
         Q500 52 520 70 Q540 88 560 68 Q580 48 600 65 Q620 82 640 62
         Q660 42 680 60 Q700 78 720 58 Q740 38 760 56 Q780 74 800 55
         L800 180 Z"
      fill="rgba(0,20,60,0.85)"
    />
    {/* Raised arms */}
    {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x, i) => (
      <g key={i}>
        <line x1={x} y1={i % 2 === 0 ? 105 : 90} x2={x - 15} y2={i % 2 === 0 ? 75 : 62} stroke="rgba(0,20,60,0.85)" strokeWidth="6" strokeLinecap="round" />
        <line x1={x} y1={i % 2 === 0 ? 105 : 90} x2={x + 15} y2={i % 2 === 0 ? 80 : 68} stroke="rgba(0,20,60,0.85)" strokeWidth="6" strokeLinecap="round" />
      </g>
    ))}
  </svg>
);

// Sparkle dots
const Sparkles = () => (
  <>
    {[
      { cx: "15%", cy: "20%" }, { cx: "80%", cy: "15%" }, { cx: "50%", cy: "10%" },
      { cx: "30%", cy: "35%" }, { cx: "70%", cy: "30%" }, { cx: "90%", cy: "45%" },
      { cx: "10%", cy: "55%" }, { cx: "60%", cy: "18%" }, { cx: "40%", cy: "45%" },
      { cx: "85%", cy: "60%" }, { cx: "25%", cy: "60%" },
    ].map((s, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full bg-white"
        style={{ left: s.cx, top: s.cy, width: i % 3 === 0 ? 3 : 2, height: i % 3 === 0 ? 3 : 2 }}
        animate={{ opacity: [0.1, 0.9, 0.1], scale: [1, 1.6, 1] }}
        transition={{ duration: 1.8 + (i % 4) * 0.4, repeat: Infinity, delay: i * 0.25 }}
      />
    ))}
  </>
);

// Grass glow at bottom
const GrassGlow = () => (
  <div
    className="absolute bottom-0 left-0 right-0 h-24"
    style={{
      background: "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(34,197,94,0.28) 0%, transparent 80%)",
    }}
  />
);

export default function IntroAnimation({ onComplete }) {
  const [scene, setScene] = useState(0);
  // scene 0 = dark bg
  // scene 1 = ball rolls in
  // scene 2 = padel enters
  // scene 3 = pin drops
  // scene 4 = all group center
  // scene 5 = "Se Juega" text + zoom out → done

  useEffect(() => {
    const timings = [600, 1000, 1000, 900, 900, 1800];
    let t = 0;
    const timers = timings.map((delay, i) => {
      t += delay;
      return setTimeout(() => setScene(i + 1), t);
    });
    const exit = setTimeout(onComplete, t + 200);
    return () => { timers.forEach(clearTimeout); clearTimeout(exit); };
  }, []);

  const showBall = scene >= 1;
  const showPadel = scene >= 2;
  const showPin = scene >= 3;
  const grouped = scene >= 4;
  const showText = scene >= 5;
  const zoomOut = scene >= 5;

  return ReactDOM.createPortal(
    <motion.div
      className="fixed inset-0 z-[9999] overflow-hidden flex items-center justify-center"
      style={{
        background: "linear-gradient(160deg, #0a1a3a 0%, #0d2b4a 40%, #0a3320 100%)",
      }}
      animate={zoomOut ? { scale: 1.08, opacity: 0 } : { scale: 1, opacity: 1 }}
      transition={zoomOut ? { duration: 1.6, ease: "easeInOut" } : { duration: 0.3 }}
    >
      <Sparkles />
      <GrassGlow />
      <CrowdSilhouette />

      {/* Stage area */}
      <div className="relative w-full max-w-lg h-64 flex items-end justify-center pb-8">

        {/* ⚽ Soccer Ball */}
        <AnimatePresence>
          {showBall && (
            <motion.div
              className="absolute text-7xl select-none"
              initial={grouped ? undefined : { x: -320, rotate: -360 }}
              animate={
                grouped
                  ? { x: -90, y: 0, rotate: 0, scale: 1 }
                  : { x: -90, rotate: 0, scale: 1 }
              }
              transition={
                grouped
                  ? { duration: 0.7, ease: "easeInOut" }
                  : { duration: 0.9, ease: [0.25, 0.46, 0.45, 0.94] }
              }
              style={{ bottom: 0 }}
            >
              ⚽
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎾 Padel Racket */}
        <AnimatePresence>
          {showPadel && (
            <motion.div
              className="absolute text-6xl select-none"
              initial={grouped ? undefined : { x: 340, rotate: 30 }}
              animate={
                grouped
                  ? { x: 90, y: 0, rotate: -15, scale: 1 }
                  : { x: 90, rotate: -15, scale: 1 }
              }
              transition={
                grouped
                  ? { duration: 0.7, ease: "easeInOut" }
                  : {
                      x: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
                      rotate: { duration: 0.7 },
                    }
              }
              style={{ bottom: 0 }}
            >
              🎾
            </motion.div>
          )}
        </AnimatePresence>

        {/* 📍 Green Pin with Star */}
        <AnimatePresence>
          {showPin && (
            <motion.div
              className="absolute text-6xl select-none"
              initial={grouped ? undefined : { y: -300, scale: 1.4 }}
              animate={
                grouped
                  ? { x: 0, y: -60, scale: 1.1 }
                  : { x: 0, y: -60, scale: 1.1 }
              }
              transition={
                grouped
                  ? { duration: 0.7, ease: "easeInOut" }
                  : {
                      y: { duration: 0.6, ease: [0.34, 1.56, 0.64, 1] },
                      scale: { duration: 0.6 },
                    }
              }
              style={{ bottom: 0 }}
            >
              📍
            </motion.div>
          )}
        </AnimatePresence>

        {/* Green glow pulse when grouped */}
        <AnimatePresence>
          {grouped && (
            <motion.div
              className="absolute inset-0 rounded-full pointer-events-none"
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: [0, 0.35, 0], scale: [0.5, 1.5, 2] }}
              transition={{ duration: 1, ease: "easeOut" }}
              style={{
                background: "radial-gradient(circle, rgba(74,222,128,0.5) 0%, transparent 70%)",
                bottom: 0,
                top: "auto",
                height: 160,
              }}
            />
          )}
        </AnimatePresence>
      </div>

      {/* "Se Juega" Text */}
      <AnimatePresence>
        {showText && (
          <motion.div
            className="absolute"
            style={{ bottom: "22%" }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <h1
              className="text-5xl md:text-6xl font-black tracking-wide text-white"
              style={{
                textShadow: "0 0 40px rgba(74,222,128,0.7), 0 2px 12px rgba(0,0,0,0.8)",
                letterSpacing: "0.06em",
              }}
            >
              Se Juega
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>,
    document.body
  );
}