import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function NotifyPlayersCard({ matchId }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [customMsg, setCustomMsg] = useState("");
  const [showMsg, setShowMsg] = useState(false);
  const [notifiedCount, setNotifiedCount] = useState(0);

  const handleSend = async () => {
    setSending(true);
    const res = await base44.functions.invoke("notifyAvailablePlayers", {
      match_id: matchId,
      custom_message: customMsg.trim() || undefined,
    });
    setSending(false);
    if (res.data?.sent === 0) {
      toast.info(res.data.message || "No hay jugadores disponibles para este horario");
    } else {
      toast.success(`Aviso enviado a ${res.data?.sent} jugador${res.data?.sent !== 1 ? "es" : ""}`);
      setSent(true);
      setNotifiedCount(res.data?.sent || 0);
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5 mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-primary" />
          Avisar a jugadores disponibles
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          El sistema identifica jugadores cuya disponibilidad coincide con la fecha y hora del partido.
        </p>
      </CardHeader>

      <CardContent className="space-y-3">
        {sent ? (
          <div className="flex items-center gap-2 text-primary text-sm font-medium py-2">
            <CheckCircle2 className="w-4 h-4" />
            Avisos enviados correctamente ({notifiedCount} jugadores notificados)
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setShowMsg(v => !v)}
              className="text-xs text-primary hover:underline"
            >
              {showMsg ? "Usar mensaje predeterminado" : "Personalizar mensaje"}
            </button>

            {showMsg && (
              <Textarea
                value={customMsg}
                onChange={e => setCustomMsg(e.target.value)}
                placeholder="¡Hay un partido disponible en tu horario! Unite ahora"
                rows={2}
                className="resize-none text-sm"
              />
            )}
          </>
        )}
      </CardContent>

      {!sent && (
        <CardFooter>
          <Button
            onClick={handleSend}
            disabled={sending || sent}
            aria-label="Enviar aviso a jugadores disponibles"
            className="w-full bg-primary hover:bg-primary/90"
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Enviar aviso
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}