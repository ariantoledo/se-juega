import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Clock, Loader2 } from "lucide-react";

export default function PaymentResult() {
  const [verifying, setVerifying] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("status");
    const reservationId = params.get("reservation_id");
    // MP sends payment_id as collection_id in back_url
    const paymentId = params.get("payment_id") || params.get("collection_id");

    if (!reservationId) {
      setPaymentStatus(status || "pending");
      setVerifying(false);
      return;
    }

    base44.functions.invoke("verifyMPPayment", {
      reservation_id: reservationId,
      payment_id: paymentId || null,
      status: status || "pending"
    }).then(res => {
      setPaymentStatus(res.data.payment_status);
      setVerifying(false);
    }).catch(() => {
      // Fallback to URL status if backend fails
      const fallback = status === "success" ? "approved" : status === "failure" ? "rejected" : "pending";
      setPaymentStatus(fallback);
      setVerifying(false);
    });
  }, []);

  if (verifying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
            <h2 className="text-xl font-bold">Verificando pago...</h2>
            <p className="text-muted-foreground">Confirmando tu reserva con Mercado Pago.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center space-y-4">
          {paymentStatus === "approved" ? (
            <>
              <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">¡Pago aprobado!</h2>
              <p className="text-muted-foreground">Tu reserva fue confirmada exitosamente.</p>
              <div className="p-3 bg-primary/10 rounded-lg">
                <p className="text-sm font-medium text-primary">Reserva confirmada ✓</p>
                <p className="text-xs text-muted-foreground mt-1">Recibirás los detalles por email.</p>
              </div>
              <Button className="w-full" asChild>
                <a href={createPageUrl("Home")}>Ir al inicio</a>
              </Button>
            </>
          ) : paymentStatus === "rejected" ? (
            <>
              <AlertCircle className="w-14 h-14 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Pago rechazado</h2>
              <p className="text-muted-foreground">No se pudo procesar el pago. El turno fue liberado.</p>
              <Button className="w-full" asChild>
                <a href={createPageUrl("Canchas")}>Volver a canchas</a>
              </Button>
            </>
          ) : (
            <>
              <Clock className="w-14 h-14 text-accent mx-auto" />
              <h2 className="text-2xl font-bold">Pago pendiente</h2>
              <p className="text-muted-foreground">
                Tu pago está siendo procesado. Una vez aprobado, tu reserva se confirmará automáticamente.
              </p>
              <Button className="w-full" asChild>
                <a href={createPageUrl("Home")}>Ir al inicio</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}