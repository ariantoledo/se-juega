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
import { Loader2, ArrowLeft, Building2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import PositionSelector from "../components/matches/PositionSelector";

export default function CreateMatch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [reserveField, setReserveField] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState("");

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

  const { data: fields = [] } = useQuery({
    queryKey: ["fields"],
    queryFn: () => base44.entities.Field.list(),
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
      current_players: 1, // creator counts
      status: "open",
      creator_email: user?.email,
      creator_name: user?.full_name,
    };

    const created = await base44.entities.Match.create(matchData);

    // Add creator as player
    await base44.entities.MatchPlayer.create({
      match_id: created.id,
      player_email: user?.email,
      player_name: user?.full_name,
      position: form.missing_positions[0] || "Sin definir",
    });

    // If reserving a field, create reservation linked to the match
    if (reserveField && selectedFieldId && form.date) {
      const field = fields.find((f) => f.id === selectedFieldId);
      const matchDate = new Date(form.date);
      const dateStr = matchDate.toISOString().split("T")[0];
      const startHour = matchDate.getHours().toString().padStart(2, "0");
      const startMin = matchDate.getMinutes().toString().padStart(2, "0");
      const endDate = new Date(matchDate.getTime() + 2 * 60 * 60 * 1000);
      const endHour = endDate.getHours().toString().padStart(2, "0");
      const endMin = endDate.getMinutes().toString().padStart(2, "0");

      await base44.entities.FieldReservation.create({
        user_email: user?.email,
        user_name: user?.full_name,
        field_id: selectedFieldId,
        field_name: field?.name || "",
        date: dateStr,
        start_time: `${startHour}:${startMin}`,
        end_time: `${endHour}:${endMin}`,
        total_price: (field?.price_per_hour || 0) * 2,
        reservation_status: "pending",
        payment_status: "unpaid",
        match_id: created.id,
      });
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
                  min="2"
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
            <div className="border border-border rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Reservar cancha</p>
                    <p className="text-xs text-muted-foreground">Vincular una reserva a este partido</p>
                  </div>
                </div>
                <Switch checked={reserveField} onCheckedChange={setReserveField} />
              </div>
              {reserveField && (
                <div className="space-y-2">
                  <Label>Seleccioná la cancha</Label>
                  <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Elegir cancha..." />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((f) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.name} — {f.address}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fields.length === 0 && (
                    <p className="text-xs text-muted-foreground">No hay canchas registradas aún.</p>
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