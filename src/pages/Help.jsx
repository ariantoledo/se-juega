import React, { useState, useEffect } from "react";
import Onboarding from "../components/Onboarding";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BookOpen, Star, MessageSquare, ChevronDown, ChevronUp,
  PlusCircle, CalendarDays, Users, CheckCircle2, MapPin, Loader2
} from "lucide-react";

const TUTORIAL_STEPS = [
  {
    icon: PlusCircle,
    title: "Crear un partido",
    description: "Andá a 'Crear Partido', completá el tipo de fútbol, fecha, cancha y cuántos jugadores necesitás. Podés elegir posiciones faltantes para que los jugadores sepan dónde jugar.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: MapPin,
    title: "Reservar una cancha",
    description: "Al crear el partido, activá 'Reservar cancha'. Elegí el establecimiento, la cancha y el horario disponible. El sistema te llevará al pago directamente.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: Users,
    title: "Sumar jugadores",
    description: "Una vez creado el partido, otros jugadores pueden enviar solicitudes para unirse. Como organizador, aceptás o rechazás cada pedido desde el detalle del partido.",
    color: "bg-primary/10 text-primary",
  },
  {
    icon: CalendarDays,
    title: "Seguir tus partidos",
    description: "En 'Mis Partidos' podés ver todos los partidos donde participás o creaste. Filtrá entre próximos, organizados y pasados.",
    color: "bg-accent/10 text-accent",
  },
  {
    icon: CheckCircle2,
    title: "Finalizar y registrar asistencia",
    description: "Después del partido, el organizador puede marcarlo como jugado y registrar quién asistió. Esto ayuda a calcular la confiabilidad de cada jugador.",
    color: "bg-primary/10 text-primary",
  },
];

const FEEDBACK_TYPES = [
  { value: "suggestion", label: "Sugerencia" },
  { value: "bug", label: "Error / Bug" },
  { value: "other", label: "Otro" },
];

export default function Help() {
  const [user, setUser] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [openStep, setOpenStep] = useState(0);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedbackType, setFeedbackType] = useState("suggestion");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleSubmit = async () => {
    if (!comment.trim() && !rating) {
      toast.error("Dejá una valoración o un comentario");
      return;
    }
    setSubmitting(true);
    await base44.entities.AppFeedback.create({
      user_email: user?.email || "anonimo",
      user_name: user?.full_name || "Anónimo",
      rating: rating || null,
      comment: comment.trim() || null,
      type: rating && !comment.trim() ? "rating" : feedbackType,
    });
    setSubmitted(true);
    setSubmitting(false);
    toast.success("¡Gracias por tu opinión!");
  };

  return (
    <>
    {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)} />}
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Centro de Ayuda</h1>
        <p className="text-muted-foreground mt-1">Tutorial, valoraciones y sugerencias</p>
        <button
          onClick={() => setShowOnboarding(true)}
          className="mt-3 text-sm text-primary hover:underline font-medium"
        >
          Ver introducción nuevamente →
        </button>
      </div>

      {/* Tutorial */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Cómo usar Se Juega
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {TUTORIAL_STEPS.map((step, i) => {
            const Icon = step.icon;
            const isOpen = openStep === i;
            return (
              <button
                key={i}
                onClick={() => setOpenStep(isOpen ? -1 : i)}
                className="w-full text-left rounded-xl border border-border hover:border-primary/30 transition-all overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${step.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <span className="font-medium text-sm text-foreground">{step.title}</span>
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                </div>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1">
                    <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>
                )}
              </button>
            );
          })}
        </CardContent>
      </Card>

      {/* Rating */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-primary" />
            Valorá la app
          </CardTitle>
        </CardHeader>
        <CardContent>
          {submitted && rating > 0 ? (
            <div className="text-center py-4">
              <div className="flex justify-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} className={`w-7 h-7 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-border"}`} />
                ))}
              </div>
              <p className="text-sm font-medium text-foreground">¡Gracias por tu valoración!</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 py-2">
              <p className="text-sm text-muted-foreground">¿Qué tan buena es tu experiencia?</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setRating(s)}
                    onMouseEnter={() => setHoverRating(s)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-9 h-9 transition-colors ${
                        s <= (hoverRating || rating) ? "fill-yellow-400 text-yellow-400" : "text-border"
                      }`}
                    />
                  </button>
                ))}
              </div>
              {rating > 0 && (
                <p className="text-xs text-muted-foreground">
                  {["", "Muy malo", "Malo", "Regular", "Bueno", "¡Excelente!"][rating]}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Comments */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            Sugerencias y opiniones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {submitted && comment ? (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-accent mx-auto" />
              <p className="font-medium text-foreground">¡Tu opinión fue enviada!</p>
              <p className="text-sm text-muted-foreground">Gracias por ayudarnos a mejorar Se Juega.</p>
            </div>
          ) : (
            <>
              <div className="flex gap-2 flex-wrap">
                {FEEDBACK_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setFeedbackType(t.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border-2 transition-all ${
                      feedbackType === t.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:border-primary/30"
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <Textarea
                placeholder="Escribí tu sugerencia, opinión o reporte aquí..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="resize-none"
              />
              <Button
                onClick={handleSubmit}
                disabled={submitting || (!comment.trim() && !rating)}
                className="w-full bg-primary hover:bg-primary/90"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Enviar feedback
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}