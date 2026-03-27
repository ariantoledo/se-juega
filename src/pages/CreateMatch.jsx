import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { goBack } from "@/lib/nav-history";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/mobile-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import PositionSelector from "../components/matches/PositionSelector";
import PadelPositionSelector from "../components/matches/PadelPositionSelector";

const SPORT_TABS = [
  { value: "futbol", label: "⚽ Fútbol" },
  { value: "padel", label: "🎾 Pádel" },
];

export default function CreateMatch() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [sportType, setSportType] = useState("futbol");
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
    level: "intermedio",
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  useEffect(() => {
    if (sportType === "futbol") {
      setForm(f => ({ ...f, match_type: "hombres", players_needed: 10, missing_positions: [] }));
    } else {
      setForm(f => ({ ...f, match_type: "dobles", players_needed: 4, missing_positions: [] }));
    }
    setSelectedEstablishmentId("");
    setSelectedFieldId("");
    setSlotDate("");
    setSelectedSlot(null);
    setReserveField(false);
  }, [sportType]);

  const { data: establishments = [] } = useQuery({
    queryKey: ["establishments"],
    queryFn: () => base44.entities.Establishment.list(),
  });

  const { data: allFields = [] } = useQuery({
    queryKey: ["fieldsnew"],
    queryFn: () => base44.entities.FieldNew.list(),
  });

  const fieldsForEstablishment = allFields.filter(f => {
    if (f.establishment_id !== selectedEstablishmentId) return false;
    if (f.is_active === false) return false;
    if (sportType === "padel") return f.field_type === "padel";
    return f.field_type !== "padel";
  });

  const { data: availableSlots = [] } = useQuery({
    queryKey: ["slots", selectedFieldId, slotDate],
    queryFn: async () => {
      const all = await base44.entities.FieldNewTimeSlot.list();
      return all.filter(
        s => s.field_new_id === selectedFieldId && s.date === slotDate && s.status === "available"
      );
    },
    enabled: !!selectedFieldId && !!slotDate,
  });

  const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const createMatchMutation = useMutation({
    mutationFn: async (matchData) => {
      const created = await base44.entities.Match.create(matchData);
      if (reserveField && selectedSlot) {
        const field = allFields.find(f => f.id === selectedFieldId);
        const res = await base44.functions.invoke("createMPPayment", {
          field: { id: selectedFieldId, ...field },
          slot: selectedSlot,
          payment_type: "sena",
          app_base_url: window.location.origin,
          match_id: created.id,
        });
        if (res.data?.init_point) return { redirect: res.data.init_point };
      }
      return { matchId: created.id };
    },
    onMutate: async (matchData) => {
      await queryClient.cancelQueries({ queryKey: ["matches"] });
      const prev = queryClient.getQueryData(["matches"]);
      queryClient.setQueryData(["matches"], (old = []) => [
        { id: "optimistic-" + Date.now(), ...matchData },
        ...old,
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["matches"], ctx?.prev);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      if (result.redirect) {
        window.location.href = result.redirect;
      } else {
        navigate(createPageUrl("MatchDetail") + `?id=${result.matchId}`);
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const selectedField = reserveField && selectedFieldId ? allFields.find(f => f.id === selectedFieldId) : null;
    const matchData = {
      ...form,
      sport_type: sportType,
      cost_per_player: Number(form.cost_per_player),
      players_needed: Number(form.players_needed),
      current_players: 0,
      status: "open",
      creator_email: user?.email,
      creator_name: user?.full_name,
      football_type: sportType === "futbol" ? form.football_type : undefined,
      level: sportType === "padel" ? form.level : undefined,
      field_new_id: selectedField?.id,
      latitude: selectedField?.latitude,
      longitude: selectedField?.longitude,
    };
    createMatchMutation.mutate(matchData);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button
        onClick={() => goBack(navigate)}
        aria-label="Volver"
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors min-h-[44px]"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-2xl">Crear Partido</CardTitle>
          <p className="text-muted-foreground text-sm">Completá los datos y armá tu equipo</p>

          <div className="flex gap-2 mt-3">
            {SPORT_TABS.map(tab => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setSportType(tab.value)}
                className={`flex-1 py-2.5 px-4 rounded-xl border-2 text-sm font-semibold transition-all ${
                  sportType === tab.value
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground hover:border-primary/30"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">

            {sportType === "futbol" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="football-type">Tipo de fútbol</Label>
                  <MobileSelect value={form.football_type} onValueChange={v => handleChange("football_type", v)} id="football-type">
                    <option value="5">Fútbol 5</option>
                    <option value="7">Fútbol 7</option>
                    <option value="11">Fútbol 11</option>
                  </MobileSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="match-type-futbol">Tipo de partido</Label>
                  <MobileSelect value={form.match_type} onValueChange={v => handleChange("match_type", v)} id="match-type-futbol">
                    <option value="hombres">Hombres</option>
                    <option value="mixto">Mixto</option>
                  </MobileSelect>
                </div>
              </div>
            )}

            {sportType === "padel" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="match-type-padel">Tipo de partido</Label>
                  <MobileSelect value={form.match_type} onValueChange={v => handleChange("match_type", v)} id="match-type-padel">
                    <option value="dobles">Dobles</option>
                    <option value="dobles_mixto">Dobles mixto</option>
                    <option value="singles">Singles</option>
                  </MobileSelect>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="players-needed">Jugadores necesarios</Label>
                  <MobileSelect
                    value={String(form.players_needed)}
                    onValueChange={v => handleChange("players_needed", Number(v))}
                    id="players-needed"
                  >
                    <option value="2">2 jugadores</option>
                    <option value="4">4 jugadores</option>
                  </MobileSelect>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nivel de juego</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {[["principiante","Principiante"],["intermedio","Intermedio"],["avanzado","Avanzado"]].map(([val, label]) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => handleChange("level", val)}
                        className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                          form.level === val
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/30 text-muted-foreground"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Fecha y hora</Label>
              <Input
                type="datetime-local"
                value={form.date}
                onChange={e => handleChange("date", e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Nombre de la cancha</Label>
              <Input
                value={form.field_name}
                onChange={e => handleChange("field_name", e.target.value)}
                placeholder={sportType === "padel" ? "Ej: Padel Club Buenos Aires" : "Ej: Cancha Los Amigos"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={form.address}
                onChange={e => handleChange("address", e.target.value)}
                placeholder="Ej: Av. Libertador 1234"
                required
              />
            </div>

            {sportType === "futbol" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Jugadores necesarios</Label>
                  <Input
                    type="number"
                    min="1"
                    max="22"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.players_needed}
                    onChange={e => handleChange("players_needed", e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Costo por jugador ($)</Label>
                  <Input
                    type="number"
                    min="0"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.cost_per_player}
                    onChange={e => handleChange("cost_per_player", e.target.value)}
                  />
                </div>
              </div>
            )}

            {sportType === "padel" && (
              <div className="space-y-2">
                <Label>Costo por jugador ($)</Label>
                <Input
                  type="number"
                  min="0"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={form.cost_per_player}
                  onChange={e => handleChange("cost_per_player", e.target.value)}
                />
              </div>
            )}

            {sportType === "futbol" && (
              <PositionSelector
                selected={form.missing_positions}
                onChange={v => handleChange("missing_positions", v)}
                max={6}
                label="Posiciones que necesitás"
              />
            )}

            {sportType === "padel" && (
              <PadelPositionSelector
                selected={form.missing_positions}
                onChange={v => handleChange("missing_positions", v)}
                matchType={form.match_type}
                playersNeeded={form.players_needed}
              />
            )}

            <div className="border border-border rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Reservar cancha</p>
                    <p className="text-xs text-muted-foreground">
                      {sportType === "padel"
                        ? "Elegí una cancha de pádel disponible"
                        : "Elegí establecimiento, cancha y horario"}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={reserveField}
                  onCheckedChange={v => {
                    setReserveField(v);
                    setSelectedEstablishmentId("");
                    setSelectedFieldId("");
                    setSlotDate("");
                    setSelectedSlot(null);
                  }}
                />
              </div>

              {reserveField && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">1. Establecimiento</Label>
                    <MobileSelect
                      value={selectedEstablishmentId}
                      onValueChange={v => { setSelectedEstablishmentId(v); setSelectedFieldId(""); setSlotDate(""); setSelectedSlot(null); }}
                      id="establishment-select"
                    >
                      <option value="">Elegir establecimiento...</option>
                      {establishments.map(e => (
                        <option key={e.id} value={e.id}>{e.name} — {e.address}</option>
                      ))}
                    </MobileSelect>
                  </div>

                  {selectedEstablishmentId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">
                        2. Cancha {sportType === "padel" ? "de pádel" : ""}
                      </Label>
                      <MobileSelect
                        value={selectedFieldId}
                        onValueChange={v => { setSelectedFieldId(v); setSlotDate(""); setSelectedSlot(null); }}
                        id="field-select"
                      >
                        <option value="">Elegir cancha...</option>
                        {fieldsForEstablishment.length === 0 ? (
                          <option disabled>Sin canchas de {sportType} disponibles</option>
                        ) : fieldsForEstablishment.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </MobileSelect>
                    </div>
                  )}

                  {selectedFieldId && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">3. Fecha</Label>
                      <Input
                        type="date"
                        value={slotDate}
                        min={new Date().toISOString().split("T")[0]}
                        onChange={e => { setSlotDate(e.target.value); setSelectedSlot(null); }}
                      />
                    </div>
                  )}

                  {slotDate && (
                    <div className="space-y-1.5">
                      <Label className="text-xs text-muted-foreground">4. Horario disponible</Label>
                      {availableSlots.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-2">No hay horarios disponibles para esta fecha.</p>
                      ) : (
                        <div className="grid grid-cols-3 gap-2">
                          {availableSlots.map(slot => (
                            <button
                              key={slot.id}
                              type="button"
                              onClick={() => {
                                setSelectedSlot(slot);
                                handleChange("date", `${slot.date}T${slot.start_time}`);
                                const field = allFields.find(f => f.id === selectedFieldId);
                                const est = establishments.find(e => e.id === selectedEstablishmentId);
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

            <Button
              type="submit"
              className="w-full bg-primary hover:bg-primary/90 h-12 text-base"
              disabled={createMatchMutation.isPending}
            >
              {createMatchMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Crear Partido
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}