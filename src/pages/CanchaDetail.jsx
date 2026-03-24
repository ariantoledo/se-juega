import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { goBack } from "@/lib/nav-history";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Phone, Clock, Banknote, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeLabels = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11",
  padel: "Pádel"
};

export default function CanchaDetail() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const fieldId = urlParams.get("id");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentType, setPaymentType] = useState("sena");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const queryClient = useQueryClient();

  const { data: field, isLoading } = useQuery({
    queryKey: ["fieldnew", fieldId],
    queryFn: async () => {
      const fields = await base44.entities.FieldNew.list();
      return fields.find(f => f.id === fieldId);
    },
    enabled: !!fieldId
  });

  const { data: establishment } = useQuery({
    queryKey: ["establishment", field?.establishment_id],
    queryFn: async () => {
      const establishments = await base44.entities.Establishment.list();
      return establishments.find(e => e.id === field.establishment_id);
    },
    enabled: !!field?.establishment_id
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["fieldnew-slots", fieldId, selectedDate],
    queryFn: async () => {
      const allSlots = await base44.entities.FieldNewTimeSlot.list();
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return allSlots.filter(s => s.field_new_id === fieldId && s.date === dateStr);
    },
    enabled: !!fieldId
  });

  const createReservationMutation = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke("createMPPayment", {
        field: { id: fieldId, ...field },
        slot: selectedSlot,
        payment_type: paymentType,
        app_base_url: window.location.origin
      });
      return res.data;
    },
    onSuccess: (data) => {
      setShowConfirmDialog(false);
      toast.success("Redirigiendo a Mercado Pago...");
      setTimeout(() => {
        window.location.href = data.init_point;
      }, 800);
    },
    onError: (err) => {
      toast.error(err?.response?.data?.error || "Error al crear el pago. Intentá de nuevo.");
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cancha no encontrada</h2>
          <a href="/Canchas" className="text-primary hover:underline">Volver a canchas</a>
        </div>
      </div>
    );
  }

  const availableSlots = slots.filter(s => s.status === "available");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-28 md:pb-6">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => goBack(navigate)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors min-h-[44px]"
          aria-label="Volver"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
        {/* Header */}
        <div className="mb-6">
          <Badge variant="secondary" className="mb-3">{typeLabels[field.field_type]}</Badge>
          <h1 className="text-3xl font-bold mb-2">{field.name}</h1>
          {establishment && (
            <p className="text-lg text-muted-foreground">{establishment.name}</p>
          )}
        </div>

        {/* Images */}
        {field.images && field.images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
            {field.images.map((img, idx) => (
              <img 
                key={idx}
                src={img}
                alt={`${field.name} ${idx + 1}`}
                className="w-full h-48 object-cover rounded-lg"
              />
            ))}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Info */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Información</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {field.description && (
                  <p className="text-muted-foreground">{field.description}</p>
                )}
                {field.address && (
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 mt-1 text-muted-foreground" />
                    <span>{field.address}</span>
                  </div>
                )}
                {establishment?.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{establishment.phone}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Precios</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg">
                  <span className="font-medium">Precio Total</span>
                  <span className="text-xl font-bold text-primary">
                    ARS ${field.precio_total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-medium">Seña</span>
                  <span className="text-lg font-semibold">
                    ARS ${field.precio_sena.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Reservar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="booking-calendar" className="mb-2 block">Fecha</Label>
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    locale={es}
                    className="rounded-md border"
                    disabled={(date) => date < new Date()}
                  />
                </div>

                <div>
                  <Label className="mb-2 block">Horarios disponibles</Label>
                  {availableSlots.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      No hay horarios disponibles para esta fecha
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {availableSlots.map(slot => (
                        <Button
                          key={slot.id}
                          variant={selectedSlot?.id === slot.id ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedSlot(slot)}
                          className="text-xs"
                        >
                          {slot.start_time} - {slot.end_time}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {establishment && !establishment.mercadopago_account_id && (
                  <div className="p-3 bg-destructive/10 rounded-lg border border-destructive/20">
                    <p className="text-sm font-medium text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      Reservas no disponibles
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">El dueño aún no configuró su cuenta de Mercado Pago.</p>
                  </div>
                )}
                {selectedSlot && establishment?.mercadopago_account_id && (
                  <Button
                    className="w-full"
                    onClick={() => setShowConfirmDialog(true)}
                  >
                    Continuar con la reserva
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-secondary p-4 rounded-lg space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cancha</span>
                <span className="font-medium">{field.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fecha</span>
                <span className="font-medium">
                  {selectedSlot && format(new Date(selectedSlot.date), "PPP", { locale: es })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Horario</span>
                <span className="font-medium">
                  {selectedSlot?.start_time} - {selectedSlot?.end_time}
                </span>
              </div>
            </div>

            <div>
              <Label className="mb-3 block">Tipo de pago</Label>
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentType("sena")}
                  aria-label={`Pagar seña: ARS ${field.precio_sena.toLocaleString()}`}
                  aria-pressed={paymentType === "sena"}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    paymentType === "sena"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-semibold">Pagar seña</div>
                      <div className="text-sm text-muted-foreground">
                        Reserva con ARS ${field.precio_sena.toLocaleString()}
                      </div>
                    </div>
                    {paymentType === "sena" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentType("total")}
                  aria-label={`Pagar total: ARS ${field.precio_total.toLocaleString()}`}
                  aria-pressed={paymentType === "total"}
                  className={`w-full p-4 rounded-lg border-2 transition-all ${
                    paymentType === "total"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <div className="font-semibold">Pagar total</div>
                      <div className="text-sm text-muted-foreground">
                        ARS ${field.precio_total.toLocaleString()} completo
                      </div>
                    </div>
                    {paymentType === "total" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t pt-4 space-y-3">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total a pagar</span>
                <span className="text-primary">
                  ARS ${(paymentType === "sena" ? field.precio_sena : field.precio_total).toLocaleString()}
                </span>
              </div>
              <div className="bg-primary/5 border border-primary/20 p-3 rounded-lg">
                <p className="text-sm font-medium mb-1">Tu reserva será confirmada al completar el pago.</p>
                <p className="text-xs text-muted-foreground">Si cancelas la reserva, el pago no será reembolsado.</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={() => createReservationMutation.mutate()}
              disabled={createReservationMutation.isPending}
            >
              {createReservationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Redirigiendo a Mercado Pago...
                </>
              ) : (
                "Confirmar y pagar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}