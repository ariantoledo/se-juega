import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  ArrowLeft, MapPin, Clock, Users, DollarSign, User,
  Loader2, Send, CheckCircle2, XCircle
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import RequestCard from "../components/matches/RequestCard";
import PlayerList from "../components/matches/PlayerList";

const typeLabels = { "5": "Fútbol 5", "7": "Fútbol 7", "11": "Fútbol 11" };

export default function MatchDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const matchId = urlParams.get("id");

  const [user, setUser] = useState(null);
  const [selectedPosition, setSelectedPosition] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: match, isLoading: matchLoading } = useQuery({
    queryKey: ["match", matchId],
    queryFn: async () => {
      const all = await base44.entities.Match.list();
      return all.find((m) => m.id === matchId);
    },
    enabled: !!matchId,
  });

  const { data: players = [] } = useQuery({
    queryKey: ["match_players", matchId],
    queryFn: () => base44.entities.MatchPlayer.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["match_requests", matchId],
    queryFn: () => base44.entities.MatchRequest.filter({ match_id: matchId }),
    enabled: !!matchId,
  });

  if (matchLoading || !match) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  const isCreator = user?.email === match.creator_email;
  const isPlayer = players.some((p) => p.player_email === user?.email);
  const hasRequested = requests.some(
    (r) => r.player_email === user?.email && r.status === "pending"
  );
  const spotsLeft = match.players_needed - (match.current_players || 0);
  const isPast = new Date(match.date) < new Date();
  const pendingRequests = requests.filter((r) => r.status === "pending");

  const handleJoinRequest = async () => {
    if (!selectedPosition) {
      toast.error("Elegí una posición");
      return;
    }
    setActionLoading(true);
    try {
      await base44.entities.MatchRequest.create({
        match_id: matchId,
        player_email: user.email,
        player_name: user.full_name,
        position: selectedPosition,
        status: "pending",
      });
      queryClient.invalidateQueries({ queryKey: ["match_requests", matchId] });
      toast.success("¡Solicitud enviada! El organizador recibirá tu pedido.");
      setSelectedPosition("");
    } catch (error) {
      toast.error("Error al enviar solicitud. Intentá de nuevo.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAccept = async (request) => {
    setActionLoading(true);
    await base44.entities.MatchRequest.update(request.id, { status: "accepted" });
    await base44.entities.MatchPlayer.create({
      match_id: matchId,
      player_email: request.player_email,
      player_name: request.player_name,
      position: request.position,
    });
    const newCount = (match.current_players || 0) + 1;
    const updateData = { current_players: newCount };
    if (newCount >= match.players_needed) {
      updateData.status = "full";
    }
    // Remove accepted position from missing
    if (match.missing_positions?.includes(request.position)) {
      updateData.missing_positions = match.missing_positions.filter(p => p !== request.position);
    }
    await base44.entities.Match.update(matchId, updateData);
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    queryClient.invalidateQueries({ queryKey: ["match_players", matchId] });
    queryClient.invalidateQueries({ queryKey: ["match_requests", matchId] });
    toast.success("Jugador aceptado");
    setActionLoading(false);
  };

  const handleReject = async (request) => {
    setActionLoading(true);
    await base44.entities.MatchRequest.update(request.id, { status: "rejected" });
    queryClient.invalidateQueries({ queryKey: ["match_requests", matchId] });
    toast.info("Solicitud rechazada");
    setActionLoading(false);
  };

  const handleMarkAttendance = async (player, attended) => {
    setActionLoading(true);
    await base44.entities.MatchPlayer.update(player.id, { attended });
    queryClient.invalidateQueries({ queryKey: ["match_players", matchId] });
    setActionLoading(false);
  };

  const handleFinishMatch = async () => {
    setActionLoading(true);
    await base44.entities.Match.update(matchId, { status: "played" });
    queryClient.invalidateQueries({ queryKey: ["match", matchId] });
    toast.success("Partido marcado como jugado");
    setActionLoading(false);
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver
      </button>

      {/* Match info card */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{match.field_name}</CardTitle>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                <MapPin className="w-4 h-4" />
                {match.address}
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 font-semibold text-base">
              {typeLabels[match.football_type]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <InfoBlock icon={Clock} label="Fecha" value={format(new Date(match.date), "EEE d MMM, HH:mm", { locale: es })} />
            <InfoBlock icon={DollarSign} label="Costo" value={`$${match.cost_per_player || 0}`} />
            <InfoBlock icon={Users} label="Jugadores" value={`${match.current_players || 0}/${match.players_needed}`} />
            <InfoBlock icon={User} label="Tipo" value={match.match_type} />
          </div>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${((match.current_players || 0) / match.players_needed) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {spotsLeft > 0 ? `Faltan ${spotsLeft} jugadores` : "¡Equipo completo!"}
            </p>
          </div>

          {/* Missing positions */}
          {match.missing_positions?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium text-foreground mb-2">Posiciones que faltan:</p>
              <div className="flex flex-wrap gap-2">
                {match.missing_positions.map((pos, i) => (
                  <Badge key={i} variant="outline" className="bg-accent/10 text-accent border-accent/20">
                    {pos}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Organizer */}
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground">Organizador</p>
            <p className="text-sm font-medium text-foreground">{match.creator_name}</p>
          </div>
        </CardContent>
      </Card>

      {/* Join request section */}
      {!isCreator && !isPlayer && !hasRequested && spotsLeft > 0 && !isPast && user && (
        <Card className="border-border/50 mb-6">
          <CardContent className="pt-6">
            <h3 className="font-semibold text-foreground mb-3">Completar el equipo</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Seleccioná tu posición para unirte al partido
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={selectedPosition} onValueChange={setSelectedPosition}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Elegí tu posición" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arquero">Arquero</SelectItem>
                  <SelectItem value="Defensor">Defensor</SelectItem>
                  <SelectItem value="Mediocampista">Mediocampista</SelectItem>
                  <SelectItem value="Delantero">Delantero</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleJoinRequest} 
                disabled={actionLoading || !selectedPosition} 
                className="bg-primary hover:bg-primary/90 sm:min-w-[180px]"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Solicitud
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {hasRequested && (
        <Card className="border-accent/30 bg-accent/5 mb-6">
          <CardContent className="pt-6 text-center">
            <p className="text-accent font-medium">Tu solicitud está pendiente de aprobación</p>
          </CardContent>
        </Card>
      )}

      {/* Players list */}
      <Card className="border-border/50 mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Jugadores ({players.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {players.length > 0 ? (
            <>
              <PlayerList players={players} creatorEmail={match.creator_email} />
              {/* Attendance marking for creator after match */}
              {isCreator && isPast && match.status !== "played" && (
                <div className="mt-6 pt-4 border-t border-border">
                  <h4 className="font-medium text-foreground mb-3">Marcar asistencia</h4>
                  <div className="space-y-2">
                    {players.map((p) => (
                      <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/30">
                        <span className="text-sm font-medium">{p.player_name}</span>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant={p.attended === "yes" ? "default" : "outline"}
                            onClick={() => handleMarkAttendance(p, "yes")}
                            disabled={actionLoading}
                            className={p.attended === "yes" ? "bg-primary" : ""}
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant={p.attended === "no" ? "destructive" : "outline"}
                            onClick={() => handleMarkAttendance(p, "no")}
                            disabled={actionLoading}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={handleFinishMatch}
                    className="w-full mt-4 bg-primary hover:bg-primary/90"
                    disabled={actionLoading}
                  >
                    Finalizar partido y registrar asistencia
                  </Button>
                </div>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-4">
              Aún no hay jugadores confirmados
            </p>
          )}
        </CardContent>
      </Card>

      {/* Requests section for creator */}
      {isCreator && pendingRequests.length > 0 && (
        <Card className="border-border/50 mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              Solicitudes
              <Badge className="bg-accent text-accent-foreground">{pendingRequests.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  onAccept={handleAccept}
                  onReject={handleReject}
                  loading={actionLoading}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoBlock({ icon: Icon, label, value }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-secondary/40">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-sm font-semibold text-foreground capitalize">{value}</p>
    </div>
  );
}