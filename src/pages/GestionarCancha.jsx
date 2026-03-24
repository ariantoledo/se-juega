import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { goBack } from "@/lib/nav-history";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Calendar as CalendarIcon, DollarSign, Clock, Ban, CheckCircle2, XCircle, Copy, Loader2, FileDown, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { exportFieldDayStats } from "@/utils/excelExport";

export default function GestionarCancha() {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const fieldId = urlParams.get("id");
  const dialogInputRef = useRef(null);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddSlotDialog, setShowAddSlotDialog] = useState(false);
  const [showBlockDialog, setShowBlockDialog] = useState(false);
  const [newSlot, setNewSlot] = useState({ start_time: "", end_time: "" });
  const [blockSlot, setBlockSlot] = useState(null);
  const [isExporting, setIsExporting] = useState(false);

  const queryClient = useQueryClient();

  const { data: field } = useQuery({
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
      const all = await base44.entities.Establishment.list();
      return all.find(e => e.id === field.establishment_id);
    },
    enabled: !!field?.establishment_id
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
    onMutate: async () => {
      await queryClient.cancelQueries(["field-slots"]);
      const prev = queryClient.getQueryData(["field-slots", fieldId, selectedDate]);
      const optimistic = { id: "opt-" + Date.now(), field_new_id: fieldId, date: format(selectedDate, "yyyy-MM-dd"), start_time: newSlot.start_time, end_time: newSlot.end_time, status: "available" };
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], (old = []) => [...old, optimistic]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], ctx?.prev);
      toast.error("Error al agregar horario");
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
    onMutate: async (slotId) => {
      await queryClient.cancelQueries(["field-slots"]);
      const prev = queryClient.getQueryData(["field-slots", fieldId, selectedDate]);
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], (old = []) =>
        old.map(s => s.id === slotId ? { ...s, status: "blocked" } : s)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], ctx?.prev);
      toast.error("Error al bloquear horario");
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
    onMutate: async (slotId) => {
      await queryClient.cancelQueries(["field-slots"]);
      const prev = queryClient.getQueryData(["field-slots", fieldId, selectedDate]);
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], (old = []) =>
        old.filter(s => s.id !== slotId)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], ctx?.prev);
      toast.error("Error al eliminar horario");
    },
    onSuccess: () => {
      toast.success("Horario eliminado");
      queryClient.invalidateQueries(["field-slots"]);
    }
  });

  const repeatYesterdayMutation = useMutation({
    mutationFn: async () => {
      const yesterday = new Date(selectedDate);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = format(yesterday, "yyyy-MM-dd");
      const todayStr = format(selectedDate, "yyyy-MM-dd");

      const all = await base44.entities.FieldNewTimeSlot.list();
      const yesterdaySlots = all.filter(
        s => s.field_new_id === fieldId && s.date === yesterdayStr && s.status !== "blocked"
      );

      if (yesterdaySlots.length === 0) {
        throw new Error("No hay horarios en el día anterior para copiar.");
      }

      const existingToday = all.filter(s => s.field_new_id === fieldId && s.date === todayStr);
      const existingTimes = new Set(existingToday.map(s => `${s.start_time}-${s.end_time}`));

      const toCreate = yesterdaySlots.filter(
        s => !existingTimes.has(`${s.start_time}-${s.end_time}`)
      );

      await Promise.all(toCreate.map(s =>
        base44.entities.FieldNewTimeSlot.create({
          field_new_id: fieldId,
          date: todayStr,
          start_time: s.start_time,
          end_time: s.end_time,
          status: "available"
        })
      ));

      return toCreate.length;
    },
    onSuccess: (count) => {
      toast.success(`${count} horario${count !== 1 ? "s" : ""} copiado${count !== 1 ? "s" : ""} del día anterior`);
      queryClient.invalidateQueries(["field-slots"]);
    },
    onError: (err) => {
      toast.error(err.message || "Error al copiar horarios");
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FieldNew.delete(fieldId);
    },
    onSuccess: () => {
      toast.success("Cancha eliminada");
      window.location.href = createPageUrl("MisCanchas");
    }
  });

  const confirmReservationMutation = useMutation({
    mutationFn: async (reservationId) => {
      const reservation = reservations.find(r => r.id === reservationId);
      
      await base44.entities.FieldNewReservation.update(reservationId, {
        reservation_status: "confirmed"
      });

      // Send confirmation email to user
      await base44.integrations.Core.SendEmail({
        to: reservation.user_email,
        subject: `Reserva confirmada en ${reservation.field_name}`,
        body: `¡Tu reserva ha sido confirmada!

Cancha: ${reservation.field_name}
Fecha: ${reservation.date}
Horario: ${reservation.start_time} - ${reservation.end_time}
Monto pagado: $${reservation.amount_paid.toLocaleString()}

¡Nos vemos en la cancha!`
      });
    },
    onMutate: async (reservationId) => {
      await queryClient.cancelQueries(["field-reservations"]);
      const prev = queryClient.getQueryData(["field-reservations", fieldId]);
      queryClient.setQueryData(["field-reservations", fieldId], (old = []) =>
        old.map(r => r.id === reservationId ? { ...r, reservation_status: "confirmed" } : r)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["field-reservations", fieldId], ctx?.prev);
      toast.error("Error al confirmar reserva");
    },
    onSuccess: () => {
      toast.success("Reserva confirmada y notificación enviada");
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

      // Send cancellation email to user
      await base44.integrations.Core.SendEmail({
        to: reservation.user_email,
        subject: `Reserva cancelada en ${reservation.field_name}`,
        body: `Tu reserva ha sido cancelada.

Cancha: ${reservation.field_name}
Fecha: ${reservation.date}
Horario: ${reservation.start_time} - ${reservation.end_time}

Si pagaste, el reembolso será procesado en los próximos días.`
      });
    },
    onMutate: async (reservationId) => {
      await queryClient.cancelQueries(["field-reservations"]);
      await queryClient.cancelQueries(["field-slots"]);
      const prevRes = queryClient.getQueryData(["field-reservations", fieldId]);
      const prevSlots = queryClient.getQueryData(["field-slots", fieldId, selectedDate]);
      queryClient.setQueryData(["field-reservations", fieldId], (old = []) =>
        old.map(r => r.id === reservationId ? { ...r, reservation_status: "cancelled" } : r)
      );
      return { prevRes, prevSlots };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["field-reservations", fieldId], ctx?.prevRes);
      queryClient.setQueryData(["field-slots", fieldId, selectedDate], ctx?.prevSlots);
      toast.error("Error al cancelar reserva");
    },
    onSuccess: () => {
      toast.success("Reserva cancelada y notificación enviada");
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

  if (establishment && !establishment.mercadopago_account_id) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          <div className="p-6 bg-destructive/10 border border-destructive/30 rounded-xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Mercado Pago no conectado</h2>
            <p className="text-muted-foreground text-sm">Para gestionar este establecimiento, primero conecte una cuenta de Mercado Pago.</p>
            <div className="flex flex-col gap-2">
              <Button asChild>
                <a href={createPageUrl("ConfigurarStripe")}>Conectar Mercado Pago</a>
              </Button>
              <Button variant="outline" onClick={() => goBack(navigate)}>Volver</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">{field.name}</h1>
            <p className="text-muted-foreground">{field.field_type}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" className="flex-1 sm:flex-initial" onClick={() => goBack(navigate)}>
              Volver
            </Button>
            <Button 
              variant="destructive" 
              className="flex-1 sm:flex-initial"
              onClick={() => {
                if (confirm("¿Estás seguro de eliminar esta cancha? Esta acción no se puede deshacer.")) {
                  deleteFieldMutation.mutate();
                }
              }}
            >
              Eliminar cancha
            </Button>
          </div>
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
                      <div key={res.id} className="p-4 bg-secondary rounded-lg space-y-3">
                        <div>
                          <p className="font-semibold">{res.user_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(res.date), "PPP", { locale: es })}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {res.start_time} - {res.end_time}
                          </p>
                          <p className="text-sm font-medium mt-2">
                            ${res.amount_paid.toLocaleString()} ({res.payment_type === "sena" ? "Seña" : "Total"})
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => confirmReservationMutation.mutate(res.id)}
                          >
                            <CheckCircle2 className="w-4 h-4 mr-1" />
                            Confirmar
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive" 
                            className="flex-1"
                            onClick={() => cancelReservationMutation.mutate(res.id)}
                          >
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
                      <div key={res.id} className="p-4 bg-primary/10 rounded-lg space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{res.user_name}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(res.date), "PPP", { locale: es })}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {res.start_time} - {res.end_time}
                            </p>
                            <p className="text-sm font-medium mt-1">
                              ${res.amount_paid.toLocaleString()}
                            </p>
                          </div>
                          <Badge className="shrink-0">Confirmada</Badge>
                        </div>
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
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
               <CardTitle>
                 Horarios - {format(selectedDate, "PPP", { locale: es })}
               </CardTitle>
               <div className="flex gap-2 flex-col sm:flex-row">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={async () => {
                     setIsExporting(true);
                     try {
                       await exportFieldDayStats(field, selectedDate, reservations);
                       toast.success("Excel descargado");
                     } catch (err) {
                       toast.error("Error al exportar");
                     }
                     setIsExporting(false);
                   }}
                   disabled={isExporting}
                 >
                   {isExporting
                     ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                     : <FileDown className="w-4 h-4 mr-1" />}
                   Descargar
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => repeatYesterdayMutation.mutate()}
                   disabled={repeatYesterdayMutation.isPending}
                 >
                   {repeatYesterdayMutation.isPending
                     ? <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                     : <Copy className="w-4 h-4 mr-1" />}
                   Repetir día anterior
                 </Button>
                 <Button onClick={() => setShowAddSlotDialog(true)}>
                   Agregar horario
                 </Button>
               </div>
              </CardHeader>
              <CardContent>
                {slots.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay horarios para esta fecha</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {slots.map(slot => (
                      <div
                        key={slot.id}
                        className={`p-4 rounded-lg border-2 ${
                          slot.status === "available"
                            ? "border-primary bg-primary/10"
                            : slot.status === "reserved"
                            ? "border-accent bg-accent/10"
                            : "border-destructive bg-destructive/10"
                        }`}
                      >
                        <div className="text-base font-semibold mb-2">
                          {slot.start_time} - {slot.end_time}
                        </div>
                        <Badge 
                          variant={slot.status === "available" ? "default" : "secondary"} 
                          className="mb-3 w-full justify-center"
                        >
                          {slot.status === "available" ? "Disponible" : slot.status === "reserved" ? "Reservado" : "Bloqueado"}
                        </Badge>
                        {slot.status === "available" && (
                          <div className="space-y-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full h-8 text-xs"
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
                              className="w-full h-8 text-xs text-destructive hover:bg-destructive/10"
                              onClick={() => {
                                if (confirm("¿Eliminar este horario?")) {
                                  deleteSlotMutation.mutate(slot.id);
                                }
                              }}
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
        <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
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
                  ref={dialogInputRef}
                  type="time"
                  value={newSlot.start_time}
                  onChange={(e) => setNewSlot({ ...newSlot, start_time: e.target.value })}
                  onFocus={() => setTimeout(() => dialogInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100)}
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