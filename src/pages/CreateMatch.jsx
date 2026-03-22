import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import PositionSelector from "../components/matches/PositionSelector";

export default function CreateMatch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reserveField, setReserveField] = useState(false);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState("");
  const [slotDate, setSlotDate] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);

  const [form, setForm] = useState({
    football_type: "5",
    date: "",
    cost_per_player: 0,
    field_name: "",
    address: "",
    players_needed: 10,
    match_type: "hombres",
    missing_positions: [],
  });

  const { data: establishments = [] } = useQuery({
    queryKey: ["establishments"],
    queryFn: () => base44.entities.Establishment.list(),
  });

  const { data: allFields = [] } = useQuery({
    queryKey: ["fieldsnew"],
    queryFn: () => base44.entities.FieldNew.list(),
  });

  const fieldsForEstablishment = allFields.filter(
    (f) => f.establishment_id === selectedEstablishmentId && f.is_active !== false
  );

  const { data: availableSlots = [] } = useQuery({
    queryKey: ["slots", selectedFieldId, slotDate],
    queryFn: async () => {
      const all = await base44.entities.FieldNewTimeSlot.list();
      return all.filter(
        (s) => s.field_new_id === selectedFieldId && s.date === slotDate && s.status === "available"
      );
    },
    enabled: !!selectedFieldId && !!slotDate,
  });

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const matchData = {
      ...form,
      cost_per_player: Number(form.cost_per_player),
      players_needed: Number(form.players_needed),
      current_players: 0,
      status: "open",
      creator_email: user?.email,
      creator_name: user?.full_name,
    };

    const created = await base44.entities.Match.create(matchData);

    if (reserveField && selectedSlot) {
      const field = allFields.find((f) => f.id === selectedFieldId);

      // Initiate Mercado Pago payment — redirect user to checkout
      const res = await base44.functions.invoke("createMPPayment", {
        field: { id: selectedFieldId, ...field },
        slot: selectedSlot,
        payment_type: "sena",
        app_base_url: window.location.origin,
        match_id: created.id,
      });

      if (res.data?.init_point) {
        window.location.href = res.data.init_point;
        return;
      }
    }

    navigate(createPageUrl("MatchDetail") + `?id=${created.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Partido</CardTitle>
          <p className="text-muted-foreground text-sm">
            Completá los datos y armá tu equipo
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de fútbol</Label>
                <Select value={form.football_type} onValueChange={(v) => handleChange("football_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">Fútbol 5</SelectItem>
                    <SelectItem value="7">Fútbol 7</SelectItem>
                    <SelectItem value="11">Fútbol 11</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tipo de partido</Label>
                <Select value={form.match_type} onValueChange={(v) => handleChange("match_type", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hombres">Hombres</SelectItem>
                    <SelectItem value="mixto">Mixto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={(e) => handleChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre de la cancha</Label>
              <Input
                value={form.field_name}
                onChange={(e) => handleChange("field_name", e.target.value)}
                placeholder="Ej: Cancha Los Amigos"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={(e) => handleChange("address", e.target.value)}
                placeholder="Ej: Av. Libertador 1234"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Jugadores necesarios</Label>
                <Input
                  type="number"
                  min="1"
                  max="22"
                  value={form.players_needed}
                  onChange={(e) => handleChange("players_needed", e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Costo por jugador ($)</Label>
                <Input
                  type="number"
                  min="0"
                  value={form.cost_per_player}
                  onChange={(e) => handleChange("cost_per_player", e.target.value)}
                />
              </div>
            </div>

            <PositionSelector
              selected={form.missing_positions}
              onChange={(v) => handleChange("missing_positions", v)}
              max={6}
              label="Posiciones que necesitás"
            />

            {/* Reserve field toggle */}
            <div className="border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Reservar cancha</p>
                    <p className="text-xs text-muted-foreground">Elegí establecimiento, cancha y horario</p>
                  </div>
                </div>
                <Switch checked={reserveField} onCheckedChange={(v) => { setReserveField(v); setSelectedEstablishmentId(""); setSelectedFieldId(""); setSlotDate(""); setSelectedSlot(null); }} />
              </div>

              {reserveField && (
                <div className="space-y-3">
                  {/* Step 1: Establishment */}
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">1. Establecimiento</Label>
                    <Select value={selectedEstablishmentId} onValueChange={(v) => { setSelectedEstablishmentId(v); setSelectedFieldId(""); setSlotDate(""); setSelectedSlot(null); }}>
                      <SelectTrigger><SelectValue placeholder="Elegir establecimiento..." /></SelectTrigger>
                      <SelectContent>
                        {establishments.map((e) => (
                          <SelectItem key={e.id} value={e.id}>{e.name} — {e.address}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Step 2: Field */}
                  {selectedEstablishmentId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">2. Cancha</Label>
                      <Select value={selectedFieldId} onValueChange={(v) => { setSelectedFieldId(v); setSlotDate(""); setSelectedSlot(null); }}>
                        <SelectTrigger><SelectValue placeholder="Elegir cancha..." /></SelectTrigger>
                        <SelectContent>
                          {fieldsForEstablishment.length === 0 ? (
                            <SelectItem value="__none" disabled>Sin canchas disponibles</SelectItem>
                          ) : fieldsForEstablishment.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Step 3: Date */}
                  {selectedFieldId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">3. Fecha</Label>
                      <Input
                        type="date"
                        value={slotDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={(e) => { setSlotDate(e.target.value); setSelectedSlot(null); }}
                      />
                    </div>
                  )}

                  {/* Step 4: Time slot */}
                  {slotDate && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">4. Horario disponible</Label>
                      {availableSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No hay horarios disponibles para esta fecha.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map((slot) => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot);
                                // Auto-fill match date
                                const dt = `${slot.date}T${slot.start_time}`;
                                handleChange("date", dt);
                                // Auto-fill field name/address
                                const field = allFields.find((f) => f.id === selectedFieldId);
                                const est = establishments.find((e) => e.id === selectedEstablishmentId);
                                if (field) handleChange("field_name", field.name);
                                if (est) handleChange("address", est.address);
                              }}
                              className={`p-2.5 rounded-lg border-2 text-xs font-medium transition-all flex items-center justify-center gap-1 ${
                                selectedSlot?.id === slot.id
                                  ? "border-primary bg-primary/10 text-primary"
                                  : "border-border hover:border-primary/40"
                              }`}
                            >
                              {selectedSlot?.id === slot.id && <CheckCircle2 className="w-3 h-3" />}
                              {slot.start_time} - {slot.end_time}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-base" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Partido
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}