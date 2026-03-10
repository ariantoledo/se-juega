import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";
import {
  MapPin, Phone, Clock, ArrowLeft, Calendar, Loader2, CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

export default function FieldDetail() {
  const navigate = useNavigate();
  const params = new URLSearchParams(window.location.search);
  const fieldId = params.get("id");

  const [user, setUser] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [booking, setBooking] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: field, isLoading: loadingField } = useQuery({
    queryKey: ["field", fieldId],
    queryFn: async () => {
      const all = await base44.entities.Field.list();
      return all.find((f) => f.id === fieldId) || null;
    },
    enabled: !!fieldId,
  });

  const { data: timeSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["timeslots", fieldId, selectedDate],
    queryFn: () =>
      base44.entities.FieldTimeSlot.filter({ field_id: fieldId, date: selectedDate }),
    enabled: !!fieldId && !!selectedDate,
  });

  const calcPrice = (slot) => {
    if (!field?.price_per_hour || !slot) return 0;
    const [sh, sm] = slot.start_time.split(":").map(Number);
    const [eh, em] = slot.end_time.split(":").map(Number);
    const hours = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
    return hours * field.price_per_hour;
  };

  const handleBook = async () => {
    if (!user || !selectedSlot) return;
    setBooking(true);

    await base44.entities.FieldReservation.create({
      user_email: user.email,
      user_name: user.full_name,
      field_id: fieldId,
      field_name: field?.name,
      timeslot_id: selectedSlot.id,
      date: selectedDate,
      start_time: selectedSlot.start_time,
      end_time: selectedSlot.end_time,
      total_price: calcPrice(selectedSlot),
      reservation_status: "pending",
      payment_status: "unpaid",
    });

    await base44.entities.FieldTimeSlot.update(selectedSlot.id, { status: "reserved" });
    queryClient.invalidateQueries({ queryKey: ["timeslots", fieldId, selectedDate] });

    setConfirmOpen(false);
    setSelectedSlot(null);
    setBooking(false);
    toast.success("¡Reserva solicitada! El dueño la confirmará en breve.");
  };

  if (loadingField) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }
  if (!field) {
    return <div className="text-center py-12 text-muted-foreground">Cancha no encontrada</div>;
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Image */}
      {field.images?.[0] ? (
        <div className="rounded-2xl overflow-hidden h-52 mb-6">
          <img src={field.images[0]} alt={field.name} className="w-full h-full object-cover" />
        </div>
      ) : (
        <div className="rounded-2xl h-52 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
          <span className="text-7xl">⚽</span>
        </div>
      )}

      {/* Info */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-2">
          <h1 className="text-2xl font-bold text-foreground">{field.name}</h1>
          {field.price_per_hour > 0 && (
            <span className="text-primary font-bold text-xl">${field.price_per_hour}/h</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
          <MapPin className="w-4 h-4 flex-shrink-0" />
          {field.address}
        </div>
        {field.contact_phone && (
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
            <Phone className="w-4 h-4" />
            {field.contact_phone}
          </div>
        )}
        <div className="flex flex-wrap gap-1.5 mb-3">
          {field.field_types?.map((t) => (
            <Badge key={t} className="bg-primary/10 text-primary border-0">Fútbol {t}</Badge>
          ))}
        </div>
        {field.description && (
          <p className="text-muted-foreground text-sm">{field.description}</p>
        )}
      </div>

      {/* Date selector */}
      <Card className="border-border/50 mb-4">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-primary" />
            <Label className="font-semibold">Seleccioná una fecha</Label>
          </div>
          <Input
            type="date"
            value={selectedDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Time slots */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            Horarios disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingSlots ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            </div>
          ) : timeSlots.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No hay horarios cargados para esta fecha</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {timeSlots.map((slot) => (
                <button
                  key={slot.id}
                  disabled={slot.status === "reserved"}
                  onClick={() => {
                    setSelectedSlot(slot);
                    setConfirmOpen(true);
                  }}
                  className={`p-3 rounded-xl border text-sm font-medium transition-all ${
                    slot.status === "reserved"
                      ? "border-border bg-muted text-muted-foreground cursor-not-allowed opacity-60"
                      : "border-border hover:border-primary hover:bg-primary/5 text-foreground"
                  }`}
                >
                  <div className="font-bold">{slot.start_time} - {slot.end_time}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {slot.status === "reserved" ? "Reservado" : `$${calcPrice(slot).toFixed(0)}`}
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirmation dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar reserva</DialogTitle>
          </DialogHeader>
          {selectedSlot && (
            <div className="space-y-3 py-2">
              <div className="p-3 bg-secondary rounded-xl">
                <p className="font-semibold text-foreground">{field.name}</p>
                <p className="text-sm text-muted-foreground">{field.address}</p>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-0.5">Fecha</p>
                  <p className="font-semibold">{selectedDate}</p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-muted-foreground text-xs mb-0.5">Horario</p>
                  <p className="font-semibold">{selectedSlot.start_time} - {selectedSlot.end_time}</p>
                </div>
              </div>
              {calcPrice(selectedSlot) > 0 && (
                <div className="p-3 bg-primary/10 rounded-xl flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Total estimado</span>
                  <span className="font-bold text-primary text-lg">${calcPrice(selectedSlot).toFixed(0)}</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                La reserva quedará pendiente hasta que el dueño la confirme.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
            <Button onClick={handleBook} disabled={booking} className="bg-primary hover:bg-primary/90">
              {booking
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <CheckCircle2 className="w-4 h-4 mr-2" />}
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}