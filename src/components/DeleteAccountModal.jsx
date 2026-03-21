import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Trash2, Loader2 } from "lucide-react";

const STEPS = ["warning", "confirm", "final"];

export default function DeleteAccountModal({ open, onClose, onConfirm, loading }) {
  const [step, setStep] = useState(0);
  const [typed, setTyped] = useState("");

  const handleClose = () => {
    setStep(0);
    setTyped("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="w-5 h-5" />
            Eliminar cuenta
          </DialogTitle>
        </DialogHeader>

        {step === 0 && (
          <div className="space-y-4">
            <div className="p-4 bg-destructive/10 rounded-xl border border-destructive/20 space-y-2">
              <p className="font-semibold text-sm">Esta acción es permanente e irreversible.</p>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Se eliminarán todos tus datos personales</li>
                <li>Perderás tu historial de partidos</li>
                <li>Tus reservas activas serán canceladas</li>
                <li>No podrás recuperar tu cuenta</li>
              </ul>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 min-h-[44px]" onClick={handleClose}>
                Cancelar
              </Button>
              <Button variant="destructive" className="flex-1 min-h-[44px]" onClick={() => setStep(1)}>
                Continuar
              </Button>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-4 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm">Para confirmar, escribí <strong>ELIMINAR</strong> en el campo de abajo.</p>
            </div>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder="Escribí ELIMINAR"
              className="min-h-[44px]"
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 min-h-[44px]" onClick={() => setStep(0)}>
                Atrás
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[44px]"
                disabled={typed !== "ELIMINAR"}
                onClick={() => setStep(2)}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="text-center py-2">
              <Trash2 className="w-12 h-12 text-destructive mx-auto mb-3 opacity-80" />
              <p className="font-semibold">¿Estás absolutamente seguro?</p>
              <p className="text-sm text-muted-foreground mt-1">
                Esta es tu última oportunidad para cancelar.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 min-h-[44px]" onClick={handleClose}>
                No, cancelar
              </Button>
              <Button
                variant="destructive"
                className="flex-1 min-h-[44px]"
                disabled={loading}
                onClick={onConfirm}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar cuenta"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}