import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, DollarSign, Clock, Ban, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function GestionarCancha() {
  const urlParams = new URLSearchParams(window.location.search);
  const fieldId = urlParams.get("id");

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({ start_time: "", end_time: "" });
  const [blockSlot, setBlockSlot] = useState(null);

  const queryClient = useQueryClient();

  const { data: field } = useQuery({
    queryKey: ["fieldnew", fieldId],
    queryFn: async () => {
      const fields = await base44.entities.FieldNew.list();
      return fields.find(f => f.id === fieldId);
    },
    enabled: !!fieldId
  });

  const { data: reservations = [] } = useQuery({
    queryKey: ["field-reservations", fieldId],
    queryFn: async () => {
      const all = await base44.entities.FieldNewReservation.list();
      return all.filter(r => r.field_new_id === fieldId);
    },
    enabled: !!fieldId
  });

  const { data: slots = [] } = useQuery({
    queryKey: ["field-slots", fieldId, selectedDate],
    queryFn: async () => {
      const all = await base44.entities.FieldNewTimeSlot.list();
      const dateStr = format(selectedDate, "yyyy-MM-dd");
      return all.filter(s => s.field_new_id === fieldId && s.date === dateStr);
    },
    enabled: !!fieldId
  });

  const addSlotMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FieldNewTimeSlot.create({
        field_new_id: fieldId,
        date: format(selectedDate, "yyyy-MM-dd"),
        start_time: newSlot.start_time,
        end_time: newSlot.end_time,
        status: "available"
      });
    },
    onSuccess: () => {
      toast.success("Horario agregado");
      queryClient.invalidateQueries(["field-slots"]);
      setShowAddSlotDialog(false);
      setNewSlot({ start_time: "", end_time: "" });
    }
  });

  const blockSlotMutation = useMutation({
    mutationFn: async (slotId) => {
      await base44.entities.FieldNewTimeSlot.update(slotId, { status: "blocked" });
    },
    onSuccess: () => {
      toast.success("Horario bloqueado");
      queryClient.invalidateQueries(["field-slots"]);
      setShowBlockDialog(false);
    }
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (slotId) => {
      await base44.entities.FieldNewTimeSlot.delete(slotId);
    },
    onSuccess: () => {
      toast.success("Horario eliminado");
      queryClient.invalidateQueries(["field-slots"]);
    }
  });

  const confirmReservationMutation = useMutation({
    mutationFn: async (reservationId) => {
      await base44.entities.FieldNewReservation.update(reservationId, {
        reservation_status: "confirmed"
      });
    },
    onSuccess: () => {
      toast.success("Reserva confirmada");
      queryClient.invalidateQueries(["field-reservations"]);
    }
  });

  const cancelReservationMutation = useMutation({
    mutationFn: async (reservationId) => {
      const reservation = reservations.find(r => r.id === reservationId);
      await base44.entities.FieldNewReservation.update(reservationId, {
        reservation_status: "cancelled"
      });
      await base44.entities.FieldNewTimeSlot.update(reservation.timeslot_id, {
        status: "available"
      });
    },
    onSuccess: () => {
      toast.success("Reserva cancelada");
      queryClient.invalidateQueries(["field-reservations"]);
      queryClient.invalidateQueries(["field-slots"]);
    }
  });

  const pendingReservations = reservations.filter(r => r.reservation_status === "pending");
  const confirmedReservations = reservations.filter(r => r.reservation_status === "confirmed");
  const totalIncome = reservations
    .filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.owner_amount || 0), 0);

  if (!field) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Cancha no encontrada</h2>
          <Button asChild>
            <a href={createPageUrl("MisCanchas")}>Volver</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">{field.field_type}</p>
          </div>
          <Button variant="outline" asChild>
            <a href={createPageUrl("MisCanchas")}>Volver</a>
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservas pendientes</p>
                  <p className="text-2xl font-bold">{pendingReservations.length}</p>
                </div>
                <Clock className="w-8 h-8 text-accent" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservas confirmadas</p>
                  <p className="text-2xl font-bold">{confirmedReservations.length}</p>
                </div>
                <CheckCircle2 className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos totales</p>
                  <p className="text-2xl font-bold">${totalIncome.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="reservas">
          <TabsList>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="calendario">Calendario</TabsTrigger>
            <TabsTrigger value="horarios">Horarios</TabsTrigger>
          </TabsList>

          <TabsContent value="reservas" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reservas pendientes</CardTitle>
              </CardHeader>
              <CardContent>
                {pendingReservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay reservas pendientes</p>
                ) : (
                  <div className="space-y-3">
                    {pendingReservations.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                        <div>
                          <p className="font-semibold">{res.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(res.date), "PPP", { locale: es })} • {res.start_time} - {res.end_time}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ${res.amount_paid.toLocaleString()} ({res.payment_type === "sena" ? "Seña" : "Total"})
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => confirmReservationMutation.mutate(res.id)}>
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => cancelReservationMutation.mutate(res.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Rechazar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Reservas confirmadas</CardTitle>
              </CardHeader>
              <CardContent>
                {confirmedReservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay reservas confirmadas</p>
                ) : (
                  <div className="space-y-3">
                    {confirmedReservations.map(res => (
                      <div key={res.id} className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                        <div>
                          <p className="font-semibold">{res.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(res.date), "PPP", { locale: es })} • {res.start_time} - {res.end_time}
                          </p>
                          <p className="text-sm font-medium mt-1">
                            ${res.amount_paid.toLocaleString()}
                          </p>
                        </div>
                        <Badge>Confirmada</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calendario">
            <Card>
              <CardContent className="pt-6">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  locale={es}
                  className="rounded-md border mx-auto"
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="horarios">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>
                  Horarios - {format(selectedDate, "PPP", { locale: es })}
                </CardTitle>
                <Button onClick={() => setShowAddSlotDialog(true)}>
                  Agregar horario
                </Button>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay horarios para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {slots.map(slot => (
                      <div
                        key={slot.id}
                        className={`p-3 rounded-lg border-2 ${
                          slot.status === "available"
                            ? "border-primary bg-primary/10"
                            : slot.status === "reserved"
                            ? "border-accent bg-accent/10"
                            : "border-destructive bg-destructive/10"
                        }`}
                      >
                        <div className="text-sm font-medium mb-1">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <Badge variant={slot.status === "available" ? "default" : "secondary"} className="mb-2">
                          {slot.status === "available" ? "Disponible" : slot.status === "reserved" ? "Reservado" : "Bloqueado"}
                        </Badge>
                        {slot.status === "available" && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs"
                              onClick={() => {
                                setBlockSlot(slot);
                                setShowBlockDialog(true);
                              }}
                            >
                              <Ban className="w-3 h-3 mr-1" />
                              Bloquear
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-xs text-destructive"
                              onClick={() => deleteSlotMutation.mutate(slot.id)}
                            >
                              Eliminar
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Add Slot Dialog */}
      <Dialog open={showAddSlotDialog} onOpenChange={setShowAddSlotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar horario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Fecha seleccionada</Label>
              <p className="text-sm text-muted-foreground">
                {format(selectedDate, "PPP", { locale: es })}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Hora inicio</Label>
                <Input
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                />
              </div>
              <div>
                <Label>Hora fin</Label>
                <Input
                  type="time"
                  value={newSlot.end_time}
                  onChange={(e) => setNewSlot({ ...newSlot, end_time: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSlotDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={() => addSlotMutation.mutate()}>
              Agregar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Block Dialog */}
      <Dialog open={showBlockDialog} onOpenChange={setShowBlockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bloquear horario</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Estás seguro que deseas bloquear el horario {blockSlot?.start_time} - {blockSlot?.end_time}?
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBlockDialog(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={() => blockSlotMutation.mutate(blockSlot.id)}>
              Bloquear
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}