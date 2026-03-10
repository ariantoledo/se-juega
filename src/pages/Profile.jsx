import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Phone, Mail, Shield, Trophy, CalendarDays,
  CheckCircle2, XCircle, Loader2, LogOut, Save
} from "lucide-react";
import PositionSelector from "../components/matches/PositionSelector";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [positions, setPositions] = useState([]);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setPhone(u.phone || "");
      setPositions(u.positions || []);
    });
  }, []);

  // Compute stats from match players
  const { data: myPlayers = [] } = useQuery({
    queryKey: ["profile_players", user?.email],
    queryFn: () => base44.entities.MatchPlayer.filter({ player_email: user?.email }),
    enabled: !!user?.email,
  });

  const { data: myCreatedMatches = [] } = useQuery({
    queryKey: ["profile_created", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Match.list();
      return all.filter((m) => m.creator_email === user?.email);
    },
    enabled: !!user?.email,
  });

  const matchesPlayed = myPlayers.filter((p) => p.attended === "yes").length;
  const noShows = myPlayers.filter((p) => p.attended === "no").length;
  const confirmedMatches = myPlayers.filter((p) => p.attended !== "pending").length;
  const reliability = confirmedMatches > 0
    ? Math.round((matchesPlayed / confirmedMatches) * 100)
    : 100;

  const handleSave = async () => {
    setSaving(true);
    await base44.auth.updateMe({ phone, positions });
    setUser((prev) => ({ ...prev, phone, positions }));
    setEditing(false);
    setSaving(false);
    toast.success("Perfil actualizado");
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">
        Mi Perfil
      </h1>

      {/* Profile card */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">{user.full_name}</h2>
              <p className="text-muted-foreground text-sm flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" />
                {user.email}
              </p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Teléfono</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Tu número de teléfono"
                />
              </div>
              <PositionSelector
                selected={positions}
                onChange={setPositions}
                max={2}
                label="Posiciones en las que jugás"
              />
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setEditing(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 bg-primary hover:bg-primary/90"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {(user.phone || phone) && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {user.phone || phone}
                </div>
              )}
              {(user.positions || positions)?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {(user.positions || positions).map((p) => (
                    <Badge key={p} className="bg-primary/10 text-primary border-0">{p}</Badge>
                  ))}
                </div>
              )}
              <Button variant="outline" onClick={() => setEditing(true)} className="mt-2">
                Editar perfil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats */}
      <h2 className="text-lg font-semibold text-foreground mb-3">Estadísticas</h2>
      <div className="grid grid-cols-2 gap-3 mb-6">
        <StatCard icon={Trophy} label="Partidos jugados" value={matchesPlayed} />
        <StatCard icon={CalendarDays} label="Partidos creados" value={myCreatedMatches.length} />
        <StatCard icon={CheckCircle2} label="Asistencias" value={matchesPlayed} color="text-primary" />
        <StatCard icon={XCircle} label="Inasistencias" value={noShows} color="text-destructive" />
      </div>

      {/* Reliability */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Confiabilidad</span>
            </div>
            <span className={`text-2xl font-bold ${reliability >= 80 ? "text-primary" : reliability >= 50 ? "text-accent" : "text-destructive"}`}>
              {reliability}%
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${reliability >= 80 ? "bg-primary" : reliability >= 50 ? "bg-accent" : "bg-destructive"}`}
              style={{ width: `${reliability}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Basado en tu historial de asistencia a partidos confirmados
          </p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
        onClick={() => base44.auth.logout()}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Cerrar sesión
      </Button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = "text-foreground" }) {
  return (
    <Card className="border-border/50">
      <CardContent className="pt-4 pb-4">
        <Icon className={`w-5 h-5 ${color} mb-2`} />
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}