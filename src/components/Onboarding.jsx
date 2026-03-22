import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, MapPin, User, ChevronRight, X, ArrowRight } from "lucide-react";

const STEPS = [
  {
    type: "welcome",
    bg: "from-primary to-[#1B5EA8]",
    title: "Bienvenido a\nSe Juega",
    subtitle: "Encontrá partido, armá tu equipo\ny reservá tu cancha.",
  },
  {
    type: "feature",
    icon: Search,
    accent: "bg-primary/15",
    iconColor: "text-primary",
    illustrationBg: "bg-primary",
    title: "Encontrá tu partido",
    description: "Explorá partidos abiertos cerca tuyo, filtrá por tipo de fútbol y sumate al equipo que necesita jugadores.",
    tag: "BUSCAR",
  },
  {
    type: "feature",
    icon: PlusCircle,
    accent: "bg-accent/15",
    iconColor: "text-accent",
    illustrationBg: "bg-accent",
    title: "Creá tu partido",
    description: "Organizá un partido en minutos. Definí cuántos jugadores necesitás y qué posiciones faltan.",
    tag: "CREAR",
  },
  {
    type: "feature",
    icon: MapPin,
    accent: "bg-primary/15",
    iconColor: "text-primary",
    illustrationBg: "bg-primary",
    title: "Reservá la cancha",
    description: "Buscá canchas disponibles y pagá la seña o el total con Mercado Pago de forma segura.",
    tag: "RESERVAR",
  },
  {
    type: "feature",
    icon: User,
    accent: "bg-accent/15",
    iconColor: "text-accent",
    illustrationBg: "bg-accent",
    title: "Tu perfil de jugador",
    description: "Seguí tus partidos, tu índice de confiabilidad y tus posiciones favoritas en tu perfil.",
    tag: "PERFIL",
  },
];

const FeatureIllustration = ({ step }) => {
  const Icon = step.icon;
  return (
    <div className={`relative w-full h-44 rounded-2xl ${step.accent} flex items-center justify-center overflow-hidden`}>
      {/* Decorative circles */}
      <div className={`absolute -top-8 -right-8 w-32 h-32 rounded-full ${step.illustrationBg} opacity-10`} />
      <div className={`absolute -bottom-6 -left-6 w-24 h-24 rounded-full ${step.illustrationBg} opacity-10`} />
      <motion.div
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4, ease: "backOut" }}
        className={`w-20 h-20 rounded-3xl ${step.illustrationBg} flex items-center justify-center shadow-lg`}
      >
        <Icon className="w-10 h-10 text-white" />
      </motion.div>
      {/* Tag */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.3 }}
        className={`absolute top-4 right-4 px-2.5 py-1 rounded-full ${step.illustrationBg} text-white text-[10px] font-bold tracking-widest`}
      >
        {step.tag}
      </motion.div>
    </div>
  );
};

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);

  const total = STEPS.length;
  const current = STEPS[step];
  const isWelcome = current.type === "welcome";
  const isLast = step === total - 1;

  const next = () => {
    if (isLast) { onClose(); return; }
    setDir(1);
    setStep(s => s + 1);
  };

  const prev = () => {
    if (step === 0) return;
    setDir(-1);
    setStep(s => s - 1);
  };

  // Welcome screen
  if (isWelcome) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-sm flex flex-col items-center text-center"
        >
          {/* Logo */}
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="mb-6"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-[#1B5EA8] flex items-center justify-center shadow-2xl shadow-primary/30 mb-4 mx-auto">
              <img
                src="https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png"
                alt="Se Juega"
                className="w-16 h-16 rounded-2xl object-cover"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.25, duration: 0.4 }}
          >
            <h1 className="text-4xl font-extrabold text-foreground leading-tight whitespace-pre-line mb-3">
              {current.title}
            </h1>
            <p className="text-muted-foreground text-base leading-relaxed mb-10">
              {current.subtitle}
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.35 }}
            className="w-full space-y-3"
          >
            <button
              onClick={next}
              className="w-full h-12 rounded-2xl bg-primary text-white font-semibold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary/25 hover:bg-primary/90 transition-colors"
            >
              Comenzar el tour
              <ArrowRight className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="w-full h-10 rounded-xl text-muted-foreground text-sm hover:text-foreground transition-colors"
            >
              Ya conozco la app, entrar directo
            </button>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Feature steps
  const featureIndex = step - 1; // 0..3
  const featureTotal = total - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-1.5">
            {Array.from({ length: featureTotal }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === featureIndex ? "w-6 bg-primary" : i < featureIndex ? "w-3 bg-primary/40" : "w-3 bg-border"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <X className="w-3.5 h-3.5" />
            Saltar
          </button>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-3xl shadow-xl overflow-hidden">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={step}
              custom={dir}
              initial={{ opacity: 0, x: dir * 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: dir * -50 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="p-6"
            >
              <FeatureIllustration step={current} />

              <div className="mt-5">
                <h2 className="text-2xl font-bold text-foreground mb-2">{current.title}</h2>
                <p className="text-muted-foreground leading-relaxed text-sm">{current.description}</p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 1 && (
              <button
                onClick={prev}
                className="flex-1 h-11 rounded-xl border border-border text-sm font-medium hover:bg-secondary transition-colors"
              >
                Anterior
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 h-11 rounded-xl bg-primary text-white text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
            >
              {isLast ? "¡Empezar!" : (
                <>Siguiente <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}