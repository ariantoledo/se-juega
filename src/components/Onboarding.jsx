import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, PlusCircle, MapPin, User, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const STEPS = [
  {
    icon: Search,
    color: "from-primary to-primary/70",
    bg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Encontrá tu partido",
    description: "Explorá partidos cercanos, filtrá por tipo de fútbol y sumate al equipo que necesita jugadores.",
  },
  {
    icon: PlusCircle,
    color: "from-accent to-accent/70",
    bg: "bg-accent/10",
    iconColor: "text-accent",
    title: "Creá tu propio partido",
    description: "Organizá un partido, elegí cuántos jugadores necesitás y qué posiciones faltan. Fácil y rápido.",
  },
  {
    icon: MapPin,
    color: "from-primary to-accent",
    bg: "bg-primary/10",
    iconColor: "text-primary",
    title: "Reservá una cancha",
    description: "Al crear el partido, reservá la cancha directamente y pagá la seña o el total con Mercado Pago.",
  },
  {
    icon: User,
    color: "from-accent to-primary",
    bg: "bg-accent/10",
    iconColor: "text-accent",
    title: "Tu perfil de jugador",
    description: "Llevá el registro de tus partidos, tu confiabilidad y tus posiciones favoritas en tu perfil.",
  },
];

export default function Onboarding({ onClose }) {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const goNext = () => {
    if (step < STEPS.length - 1) {
      setDirection(1);
      setStep(s => s + 1);
    } else {
      onClose();
    }
  };

  const goPrev = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm">
        {/* Skip button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-lg hover:bg-secondary"
          >
            <X className="w-4 h-4" />
            Saltar
          </button>
        </div>

        {/* Card */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-border shadow-2xl min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              initial={{ opacity: 0, x: direction * 60 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction * -60 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="flex flex-col items-center text-center p-8 flex-1"
            >
              {/* Icon */}
              <div className={`w-24 h-24 rounded-3xl ${current.bg} flex items-center justify-center mb-6 shadow-sm`}>
                <Icon className={`w-12 h-12 ${current.iconColor}`} />
              </div>

              {/* Step indicator */}
              <div className="flex gap-1.5 mb-5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === step ? "w-6 bg-primary" : "w-1.5 bg-border"
                    }`}
                  />
                ))}
              </div>

              <h2 className="text-2xl font-bold text-foreground mb-3">{current.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{current.description}</p>
            </motion.div>
          </AnimatePresence>

          {/* Actions */}
          <div className="px-8 pb-8 flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={goPrev} className="flex-1">
                Anterior
              </Button>
            )}
            <Button onClick={goNext} className="flex-1 bg-primary hover:bg-primary/90">
              {step < STEPS.length - 1 ? (
                <>
                  Siguiente
                  <ChevronRight className="w-4 h-4" />
                </>
              ) : (
                "¡Empezar!"
              )}
            </Button>
          </div>
        </div>

        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <img
            src="https://media.base44.com/images/public/69af676714ee0899079240af/b369c31da_fc25c6634_logo.png"
            alt="Se Juega"
            className="w-7 h-7 rounded-xl object-cover"
          />
          <span className="font-bold text-foreground">Se Juega</span>
        </div>
      </div>
    </div>
  );
}