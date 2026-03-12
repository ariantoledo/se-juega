import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Phone, Clock, Banknote, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeLabels = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11"
};

export default function CanchaDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const fieldId = urlParams.get("id");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [paymentType, setPaymentType] = useState("sena");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

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
      const user = await base44.auth.me();
      
      const amount = paymentType === "sena" ? field.precio_sena : field.precio_total;
      const commissionAmount = field.precio_total * 0.10;
      const ownerAmount = field.precio_total * 0.90;

      const reservation = await base44.entities.FieldNewReservation.create({
        user_email: user.email,
        user_name: user.full_name,
        field_new_id: fieldId,
        field_name: field.name,
        establishment_id: field.establishment_id,
        timeslot_id: selectedSlot.id,
        date: selectedSlot.date,
        start_time: selectedSlot.start_time,
        end_time: selectedSlot.end_time,
        payment_type: paymentType,
        amount_paid: amount,
        precio_total: field.precio_total,
        commission_amount: commissionAmount,
        owner_amount: ownerAmount,
        reservation_status: "pending",
        payment_status: "pending"
      });

      await base44.entities.FieldNewTimeSlot.update(selectedSlot.id, {
        status: "reserved"
      });

      // Send notification to owner
      if (establishment?.owner_email) {
        await base44.integrations.Core.SendEmail({
          to: establishment.owner_email,
          subject: `Nueva reserva en ${field.name}`,
          body: `Tienes una nueva reserva pendiente:
          
Cancha: ${field.name}
Cliente: ${user.full_name} (${user.email})
Fecha: ${selectedSlot.date}
Horario: ${selectedSlot.start_time} - ${selectedSlot.end_time}
Monto: $${amount.toLocaleString()} (${paymentType === "sena" ? "Seña" : "Total"})

Ingresa a la aplicación para confirmar o rechazar la reserva.`
        });
      }
    },
    onSuccess: () => {
      toast.success("¡Reserva creada exitosamente! El dueño recibirá una notificación.");
      queryClient.invalidateQueries(["fieldnew-slots"]);
      setShowConfirmDialog(false);
      setSelectedSlot(null);
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
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
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
                    ${field.precio_total.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <span className="font-medium">Seña</span>
                  <span className="text-lg font-semibold">
                    ${field.precio_sena.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Booking */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Reservar
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Fecha</label>
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
                  <label className="text-sm font-medium mb-2 block">
                    Horarios disponibles
                  </label>
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

                {selectedSlot && (
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
              <label className="text-sm font-medium mb-3 block">Tipo de pago</label>
              <div className="space-y-2">
                <button
                  onClick={() => setPaymentType("sena")}
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
                        Reserva con ${field.precio_sena.toLocaleString()}
                      </div>
                    </div>
                    {paymentType === "sena" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>

                <button
                  onClick={() => setPaymentType("total")}
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
                        ${field.precio_total.toLocaleString()} completo
                      </div>
                    </div>
                    {paymentType === "total" && <CheckCircle2 className="w-5 h-5 text-primary" />}
                  </div>
                </button>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between text-lg font-semibold">
                <span>Total a pagar</span>
                <span className="text-primary">
                  ${(paymentType === "sena" ? field.precio_sena : field.precio_total).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => createReservationMutation.mutate()}>
              Confirmar y pagar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}