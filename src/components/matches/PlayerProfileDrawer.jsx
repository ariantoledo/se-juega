import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { safeArray } from "@/lib/safeArray";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { User, Shield, Trophy, CheckCircle2, XCircle, Mail } from "lucide-react";

export default function PlayerProfileDrawer({ playerEmail, playerName, open, onClose }) {
  const { data: players = [] } = useQuery({
    queryKey: ["player_profile", playerEmail],
    queryFn: async () => safeArray(await base44.entities.MatchPlayer.filter({ player_email: playerEmail })),
    enabled: open && !!playerEmail,
  });

  const { data: users = [] } = useQuery({
    queryKey: ["user_data", playerEmail],
    queryFn: async () => safeArray(await base44.entities.User.list()),
    enabled: open && !!playerEmail,
  });

  const userData = users.find(u => u.email === playerEmail);

  const safePlayers = safeArray(players);
  const matchesPlayed = safePlayers.filter(p => p.attended === "yes").length;
  const noShows = safePlayers.filter(p => p.attended === "no").length;
  const confirmed = safePlayers.filter(p => p.attended !== undefined && p.attended !== null && p.attended !== "pending").length;
  const reliability = confirmed > 0 ? Math.round((matchesPlayed / confirmed) * 100) : 100;

  const positions = [...new Set(safePlayers.map(p => p.position).filter(Boolean))];

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>Perfil del jugador</DrawerTitle>
        </DrawerHeader>
        <div className="px-4 pb-10 space-y-5">
          {/* Avatar + nombre */}
          <div className="flex items-center gap-4">
            {userData?.avatar_url ? (
              <img src={userData.avatar_url} alt={playerName} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
            )}
            <div>
              <p className="text-lg font-bold text-foreground">{playerName}</p>
              {playerEmail && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Mail className="w-3 h-3" /> {playerEmail}
                </p>
              )}
            </div>
          </div>

          {/* Posiciones habituales */}
          {positions.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Posiciones habituales</p>
              <div className="flex flex-wrap gap-2">
                {positions.map(pos => (
                  <Badge key={pos} className="bg-primary/10 text-primary border-0">{pos}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-secondary/60 text-center">
              <Trophy className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{matchesPlayed}</p>
              <p className="text-xs text-muted-foreground">Jugados</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/60 text-center">
              <CheckCircle2 className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-xl font-bold">{safePlayers.length}</p>
              <p className="text-xs text-muted-foreground">Partidos</p>
            </div>
            <div className="p-3 rounded-xl bg-secondary/60 text-center">
              <XCircle className="w-4 h-4 text-destructive mx-auto mb-1" />
              <p className="text-xl font-bold">{noShows}</p>
              <p className="text-xs text-muted-foreground">Faltas</p>
            </div>
          </div>

          {/* Confiabilidad */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-foreground">Confiabilidad</span>
              </div>
              <span className={`text-lg font-bold ${reliability >= 80 ? "text-primary" : reliability >= 50 ? "text-accent" : "text-destructive"}`}>
                {reliability}%
              </span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${reliability >= 80 ? "bg-primary" : reliability >= 50 ? "bg-accent" : "bg-destructive"}`}
                style={{ width: `${reliability}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">Basado en historial de asistencia</p>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}