import React from 'react';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export default function Onboarding({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Close Button */}
        <div className="sticky top-0 flex justify-between items-center p-6 bg-gradient-to-r from-primary to-primary/80 rounded-t-2xl">
          <h1 className="text-2xl font-bold text-white">Cómo navegar en Se Juega</h1>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-8">
          {/* Intro */}
          <div className="space-y-3">
            <p className="text-lg text-foreground leading-relaxed">
              La <span className="font-bold text-primary">barra de navegación inferior</span> es tu puerta de acceso a todas las funciones principales de la app.
            </p>
            <p className="text-sm text-muted-foreground">
              Cada ícono te lleva a una sección diferente. Conocé qué hace cada uno:
            </p>
          </div>

          {/* Navigation Items */}
          <div className="space-y-4">
            <NavItem
              icon="🏠"
              title="Inicio"
              description="Tu página principal con los partidos próximos y las canchas destacadas."
            />
            <NavItem
              icon="⚽"
              title="Crear Partido"
              description="Creá un nuevo partido de fútbol o pádel. Elegís la fecha, cancha, cantidad de jugadores y más."
            />
            <NavItem
              icon="📋"
              title="Mis Partidos"
              description="Veé todos los partidos donde participás, tanto los que creaste como los que te sumaste."
            />
            <NavItem
              icon="🏢"
              title="Canchas"
              description="Explorá y reservá canchas de fútbol y pádel en tu zona. Filtrá por tipo, precio y disponibilidad."
            />
            <NavItem
              icon="👤"
              title="Mi Perfil"
              description="Administrá tu perfil, preferencias y configuración de la app."
            />
          </div>

          {/* Mobile-specific note */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4">
            <p className="text-sm text-foreground">
              💡 <span className="font-medium">Tip:</span> En pantallas más grandes, algunos elementos pueden aparecer en una barra superior o lateral.
            </p>
          </div>

          {/* CTA */}
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Entendido, ¡a jugar!
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function NavItem({ icon, title, description }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      whileInView={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      className="flex gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
    >
      <div className="text-3xl flex-shrink-0">{icon}</div>
      <div className="flex-1">
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">{description}</p>
      </div>
    </motion.div>
  );
}