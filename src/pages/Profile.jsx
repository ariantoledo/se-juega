import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { safeArray } from "@/lib/safeArray";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User as UserIcon, Phone, Mail, Shield, Trophy, CalendarDays,
  CheckCircle2, XCircle, Loader2, LogOut, Save, Camera, Building2, Clock, Settings, Trash2
} from "lucide-react";
import PositionSelector from "../components/matches/PositionSelector";
import DeleteAccountModal from "../components/DeleteAccountModal";
import AvailabilityEditor from "../components/availability/AvailabilityEditor";
import { CalendarClock } from "lucide-react";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editing, setEditing] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [savingAvail, setSavingAvail] = useState(false);
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [phone, setPhone] = useState("");
  const [positions, setPositions] = useState([]);
  const [avatarUrl, setAvatarUrl] = useState("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  useEffect(() => {
    base44.auth.me().then((u) => {
      setUser(u);
      setPhone(u.phone || "");
      setPositions(u.positions || []);
      setAvatarUrl(u.avatar_url || "");
    });
  }, []);

  const { data: myAvailability } = useQuery({
    queryKey: ["my_availability", user?.email],
    queryFn: async () => {
      const all = await base44.entities.PlayerAvailability.list();
      return all.find(a => a.user_email === user.email) || null;
    },
    enabled: !!user?.email,
  });

  const handleSaveAvailability = async (slots, notify_enabled) => {
    setSavingAvail(true);
    if (myAvailability?.id) {
      await base44.entities.PlayerAvailability.update(myAvailability.id, { slots, notify_enabled });
    } else {
      await base44.entities.PlayerAvailability.create({
        user_email: user.email,
        user_name: user.full_name,
        slots,
        notify_enabled,
      });
    }
    queryClient.invalidateQueries(["my_availability", user.email]);
    setSavingAvail(false);
    const { toast } = await import("sonner");
    toast.success("Disponibilidad guardada");
  };

  const { data: myPlayers = [] } = useQuery({
    queryKey: ["profile_players", user?.email],
    queryFn: async () => safeArray(await base44.entities.MatchPlayer.filter({ player_email: user?.email })),
    enabled: !!user?.email,
  });

  const { data: myCreatedMatches = [] } = useQuery({
    queryKey: ["profile_created", user?.email],
    queryFn: async () => {
      const all = safeArray(await base44.entities.Match.list());
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

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingAvatar(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setAvatarUrl(file_url);
    await base44.auth.updateMe({ avatar_url: file_url });
    setUser((prev) => ({ ...prev, avatar_url: file_url }));
    setUploadingAvatar(false);
    toast.success("Foto de perfil actualizada");
    e.target.value = "";
  };

  const saveProfileMutation = useMutation({
    mutationFn: () => base44.auth.updateMe({ phone, positions, avatar_url: avatarUrl }),
    onMutate: () => {
      // Optimistic: update local user state immediately
      setUser(prev => ({ ...prev, phone, positions, avatar_url: avatarUrl }));
      setEditing(false);
    },
    onError: () => {
      // Rollback: re-fetch real user state
      base44.auth.me().then(setUser);
      setEditing(true);
      toast.error("Error al guardar perfil");
    },
    onSuccess: () => {
      toast.success("Perfil actualizado");
    },
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">Mi Perfil</h1>

      {/* Profile card */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4 mb-6">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={user.full_name}
                  className="w-16 h-16 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <UserIcon className="w-8 h-8 text-primary" />
                </div>
              )}
              <label
                aria-label="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center cursor-pointer shadow-md hover:bg-primary/90 transition-colors">
                {uploadingAvatar
                  ? <Loader2 className="w-3 h-3 text-white animate-spin" />
                  : <Camera className="w-3 h-3 text-white" />}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </label>
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
                <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">
                  Cancelar
                </Button>
                <Button onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending} className="flex-1 bg-primary hover:bg-primary/90">
                  {saveProfileMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  {phone}
                </div>
              )}
              {positions?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {positions.map((p) => (
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

      {/* Availability */}
      <Card className="border-border/50 mb-6">
        <CardContent className="pt-5 pb-5">
          <button
            aria-label={showAvailability ? "Cerrar disponibilidad" : "Ver o editar disponibilidad"}
            className="flex items-center justify-between w-full"
            onClick={() => setShowAvailability(v => !v)}
          >
            <div className="flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Mi Disponibilidad</span>
            </div>
            <span className="text-xs text-muted-foreground">{showAvailability ? "Cerrar" : "Ver / Editar"}</span>
          </button>
          {!showAvailability && myAvailability?.slots?.length > 0 && (
            <p className="text-xs text-muted-foreground mt-2">{myAvailability.slots.length} horario{myAvailability.slots.length !== 1 ? "s" : ""} cargado{myAvailability.slots.length !== 1 ? "s" : ""}</p>
          )}
          {showAvailability && (
            <div className="mt-4">
              <AvailabilityEditor
                initialSlots={myAvailability?.slots || []}
                notifyEnabled={myAvailability?.notify_enabled !== false}
                onSave={handleSaveAvailability}
                saving={savingAvail}
              />
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

      {/* Owner / Admin section */}
      {(user.role === "dueño_verificado" || user.role === "admin") && (
        <Card className="border-border/50 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">Gestión de Estadios</span>
            </div>
            <a href={createPageUrl("Estadios")} className="block">
              <Button className="w-full" size="sm">Ir a Mis Estadios</Button>
            </a>
          </CardContent>
        </Card>
      )}

      {user.role === "admin" && (
        <Card className="border-border/50 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-5 h-5 text-accent" />
              <span className="font-semibold text-foreground">Administración</span>
            </div>
            <a href={createPageUrl("AdminPanel")} className="block">
              <Button variant="outline" className="w-full" size="sm">Panel de administración</Button>
            </a>
          </CardContent>
        </Card>
      )}

      {user.role === "usuario_normal" || (!user.role || user.role === "user") ? (
        <Card className="border-border/50 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-muted-foreground" />
              <span className="font-semibold text-foreground">¿Tenés una cancha?</span>
            </div>
            <p className="text-xs text-muted-foreground mb-3">Registrate como dueño para gestionar tu establecimiento.</p>
            <a href={createPageUrl("RegistrarDueno")} className="block">
              <Button variant="outline" className="w-full" size="sm">Registrarme como dueño</Button>
            </a>
          </CardContent>
        </Card>
      ) : user.role === "dueño_pendiente" ? (
        <Card className="border-border/50 mb-4">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-accent" />
              <div>
                <p className="font-medium text-sm">Solicitud en revisión</p>
                <p className="text-xs text-muted-foreground">Te notificaremos cuando sea aprobada</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Delete account */}
      <Button
        variant="ghost"
        className="w-full mt-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 text-sm"
        onClick={() => setShowDeleteModal(true)}
      >
        <Trash2 className="w-4 h-4 mr-2" />
        Eliminar cuenta
      </Button>

      <DeleteAccountModal
        open={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        loading={deletingAccount}
        onConfirm={async () => {
          setDeletingAccount(true);
          try { await base44.auth.updateMe({ role: "deleted" }); } catch {}
          base44.auth.logout();
        }}
      />

      {/* Logout */}
      <Button
        variant="outline"
        className="w-full border-destructive/30 text-destructive hover:bg-destructive/10 mt-2"
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