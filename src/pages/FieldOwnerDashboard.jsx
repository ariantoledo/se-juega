import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import {
  Building2, Clock, Calendar, CheckCircle2, XCircle,
  Plus, Loader2, Trash2
} from "lucide-react";

export default function FieldOwnerDashboard() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myField, isLoading: loadingField, refetch: refetchField } = useQuery({
    queryKey: ["my_field", user?.email],
    queryFn: async () => {
      const fields = await base44.entities.Field.filter({ owner_email: user?.email });
      return fields[0] || null;
    },
    enabled: !!user?.email,
  });

  // Field form state
  const [fieldForm, setFieldForm] = useState({
    name: "", address: "", latitude: "", longitude: "",
    field_types: [], price_per_hour: "", description: "",
    images: [], contact_phone: "", is_active: true,
  });
  const [savingField, setSavingField] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  useEffect(() => {
    if (myField) {
      setFieldForm({
        name: myField.name || "",
        address: myField.address || "",
        latitude: myField.latitude || "",
        longitude: myField.longitude || "",
        field_types: myField.field_types || [],
        price_per_hour: myField.price_per_hour || "",
        description: myField.description || "",
        images: myField.images || [],
        contact_phone: myField.contact_phone || "",
        is_active: myField.is_active !== false,
      });
    }
  }, [myField]);

  // Slot form state
  const [slotForm, setSlotForm] = useState({ date: "", start_time: "", end_time: "" });
  const [savingSlot, setSavingSlot] = useState(false);
  const [slotViewDate, setSlotViewDate] = useState(new Date().toISOString().split("T")[0]);

  const { data: slots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ["owner_slots", myField?.id, slotViewDate],
    queryFn: () =>
      base44.entities.FieldTimeSlot.filter({ field_id: myField?.id, date: slotViewDate }),
    enabled: !!myField?.id,
  });

  const { data: reservations = [], isLoading: loadingReservations } = useQuery({
    queryKey: ["owner_reservations", myField?.id],
    queryFn: () => base44.entities.FieldReservation.filter({ field_id: myField?.id }),
    enabled: !!myField?.id,
  });

  const setFF = (key, val) => setFieldForm((p) => ({ ...p, [key]: val }));

  const toggleFieldType = (type) => {
    setFF(
      "field_types",
      fieldForm.field_types.includes(type)
        ? fieldForm.field_types.filter((t) => t !== type)
        : [...fieldForm.field_types, type]
    );
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFF("images", [...fieldForm.images, file_url]);
    setUploadingImage(false);
    toast.success("Imagen subida");
    e.target.value = "";
  };

  const handleRemoveImage = (idx) => {
    setFF("images", fieldForm.images.filter((_, i) => i !== idx));
  };

  const handleSaveField = async () => {
    if (!fieldForm.name || !fieldForm.address) {
      toast.error("Completá nombre y dirección");
      return;
    }
    setSavingField(true);
    const data = {
      ...fieldForm,
      price_per_hour: Number(fieldForm.price_per_hour) || 0,
      latitude: Number(fieldForm.latitude) || 0,
      longitude: Number(fieldForm.longitude) || 0,
      owner_email: user.email,
    };
    if (myField) {
      await base44.entities.Field.update(myField.id, data);
    } else {
      await base44.entities.Field.create(data);
    }
    await refetchField();
    queryClient.invalidateQueries({ queryKey: ["fields"] });
    setSavingField(false);
    toast.success("Cancha guardada exitosamente");
  };

  const handleAddSlot = async () => {
    if (!slotForm.date || !slotForm.start_time || !slotForm.end_time) {
      toast.error("Completá todos los campos del horario");
      return;
    }
    setSavingSlot(true);
    await base44.entities.FieldTimeSlot.create({
      field_id: myField.id,
      date: slotForm.date,
      start_time: slotForm.start_time,
      end_time: slotForm.end_time,
      status: "available",
    });
    queryClient.invalidateQueries({ queryKey: ["owner_slots", myField.id, slotForm.date] });
    queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    setSlotForm((p) => ({ ...p, start_time: "", end_time: "" }));
    setSavingSlot(false);
    toast.success("Horario agregado");
  };

  const handleDeleteSlot = async (slotId) => {
    await base44.entities.FieldTimeSlot.delete(slotId);
    queryClient.invalidateQueries({ queryKey: ["owner_slots"] });
    toast.success("Horario eliminado");
  };

  const handleReservationAction = async (reservation, status) => {
    await base44.entities.FieldReservation.update(reservation.id, { reservation_status: status });
    if (status === "cancelled" && reservation.timeslot_id) {
      await base44.entities.FieldTimeSlot.update(reservation.timeslot_id, { status: "available" });
    }
    queryClient.invalidateQueries({ queryKey: ["owner_reservations", myField?.id] });
    queryClient.invalidateQueries({ queryKey: ["timeslots"] });
    toast.success(status === "confirmed" ? "Reserva confirmada" : "Reserva rechazada");
  };

  const pendingCount = reservations.filter((r) => r.reservation_status === "pending").length;

  if (!user) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight">Mi Cancha</h1>
        <p className="text-muted-foreground text-sm mt-1">Gestioná tu espacio deportivo</p>
      </div>

      <Tabs defaultValue="cancha">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="cancha" className="flex-1">Cancha</TabsTrigger>
          <TabsTrigger value="horarios" className="flex-1" disabled={!myField}>Horarios</TabsTrigger>
          <TabsTrigger value="reservas" className="flex-1 relative" disabled={!myField}>
            Reservas
            {pendingCount > 0 && (
              <span className="ml-1.5 inline-flex w-4 h-4 rounded-full bg-accent text-accent-foreground text-[10px] font-bold items-center justify-center">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── CANCHA TAB ── */}
        <TabsContent value="cancha">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary" />
                {myField ? "Editar cancha" : "Registrar cancha"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input value={fieldForm.name} onChange={(e) => setFF("name", e.target.value)} placeholder="Ej: Cancha Los Amigos" />
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={fieldForm.address} onChange={(e) => setFF("address", e.target.value)} placeholder="Ej: Av. Libertador 1234" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Latitud</Label>
                  <Input type="number" step="any" value={fieldForm.latitude} onChange={(e) => setFF("latitude", e.target.value)} placeholder="-34.6037" />
                </div>
                <div className="space-y-2">
                  <Label>Longitud</Label>
                  <Input type="number" step="any" value={fieldForm.longitude} onChange={(e) => setFF("longitude", e.target.value)} placeholder="-58.3816" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tipos de fútbol</Label>
                <div className="flex gap-2">
                  {["5", "7", "11"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => toggleFieldType(t)}
                      className={`flex-1 py-2 rounded-xl border text-sm font-semibold transition-all ${
                        fieldForm.field_types.includes(t)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/50"
                      }`}
                    >
                      F{t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Precio por hora ($)</Label>
                  <Input type="number" min="0" value={fieldForm.price_per_hour} onChange={(e) => setFF("price_per_hour", e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Teléfono</Label>
                  <Input value={fieldForm.contact_phone} onChange={(e) => setFF("contact_phone", e.target.value)} placeholder="+54 11 ..." />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={fieldForm.description} onChange={(e) => setFF("description", e.target.value)} placeholder="Instalaciones, vestuarios, estacionamiento..." rows={3} />
              </div>

              {/* Images */}
              <div className="space-y-2">
                <Label>Fotos</Label>
                <div className="grid grid-cols-3 gap-2">
                  {fieldForm.images.map((img, idx) => (
                    <div key={idx} className="relative group h-24 rounded-xl overflow-hidden">
                      <img src={img} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-xl"
                      >
                        <Trash2 className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  ))}
                  <label className="h-24 border-2 border-dashed border-border rounded-xl flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/30">
                    {uploadingImage
                      ? <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      : <Plus className="w-5 h-5 text-muted-foreground" />}
                    <input type="file" accept="image/*" className="hidden" onChange={handleUploadImage} />
                  </label>
                </div>
              </div>

              <Button onClick={handleSaveField} disabled={savingField} className="w-full bg-primary hover:bg-primary/90 h-11">
                {savingField && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {myField ? "Guardar cambios" : "Registrar cancha"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── HORARIOS TAB ── */}
        <TabsContent value="horarios">
          <Card className="border-border/50 mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" />
                Agregar horario disponible
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={slotForm.date} min={new Date().toISOString().split("T")[0]} onChange={(e) => setSlotForm((p) => ({ ...p, date: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hora inicio</Label>
                  <Input type="time" value={slotForm.start_time} onChange={(e) => setSlotForm((p) => ({ ...p, start_time: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Hora fin</Label>
                  <Input type="time" value={slotForm.end_time} onChange={(e) => setSlotForm((p) => ({ ...p, end_time: e.target.value }))} />
                </div>
              </div>
              <Button onClick={handleAddSlot} disabled={savingSlot} className="w-full bg-primary hover:bg-primary/90">
                {savingSlot ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Agregar horario
              </Button>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Ver horarios del día
                </CardTitle>
                <Input type="date" value={slotViewDate} onChange={(e) => setSlotViewDate(e.target.value)} className="w-auto text-sm" />
              </div>
            </CardHeader>
            <CardContent>
              {loadingSlots ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
              ) : slots.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No hay horarios para esta fecha</p>
              ) : (
                <div className="space-y-2">
                  {slots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 rounded-xl border border-border">
                      <div className="flex items-center gap-3">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium text-sm">{slot.start_time} - {slot.end_time}</span>
                        <Badge variant={slot.status === "reserved" ? "default" : "secondary"} className="text-xs">
                          {slot.status === "reserved" ? "Reservado" : "Disponible"}
                        </Badge>
                      </div>
                      {slot.status === "available" && (
                        <button onClick={() => handleDeleteSlot(slot.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── RESERVAS TAB ── */}
        <TabsContent value="reservas">
          {loadingReservations ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No hay reservas todavía</p>
            </div>
          ) : (
            <div className="space-y-3">
              {[...reservations]
                .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
                .map((res) => (
                  <Card key={res.id} className="border-border/50">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-semibold text-foreground">{res.user_name}</p>
                          <p className="text-xs text-muted-foreground">{res.user_email}</p>
                        </div>
                        <Badge className={
                          res.reservation_status === "confirmed"
                            ? "bg-primary/10 text-primary border-0"
                            : res.reservation_status === "cancelled"
                            ? "bg-destructive/10 text-destructive border-0"
                            : "bg-accent/20 text-accent-foreground border-0"
                        }>
                          {res.reservation_status === "confirmed" ? "Confirmada"
                            : res.reservation_status === "cancelled" ? "Cancelada"
                            : "Pendiente"}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" />{res.date}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />{res.start_time} - {res.end_time}</span>
                      </div>
                      {res.total_price > 0 && (
                        <p className="text-sm font-semibold text-primary mb-3">Total: ${res.total_price}</p>
                      )}
                      {res.reservation_status === "pending" && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1 border-destructive/30 text-destructive hover:bg-destructive/10"
                            onClick={() => handleReservationAction(res, "cancelled")}
                          >
                            <XCircle className="w-3.5 h-3.5 mr-1.5" />
                            Rechazar
                          </Button>
                          <Button
                            size="sm"
                            className="flex-1 bg-primary hover:bg-primary/90"
                            onClick={() => handleReservationAction(res, "confirmed")}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                            Confirmar
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}