import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { MapPin, Clock, Users, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const typeLabels = { "5": "Fútbol 5", "7": "Fútbol 7", "11": "Fútbol 11" };

export default function MatchCard({ match }) {
  const spotsLeft = match.players_needed - (match.current_players || 0);
  const matchDate = new Date(match.date);
  const isPast = matchDate < new Date();

  return (
    <Link to={createPageUrl("MatchDetail") + `?id=${match.id}`}>
      <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden border-border/50 hover:border-primary/30">
        <div className="p-5">
          {/* Top row */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {match.field_name}
              </h3>
              <div className="flex items-center gap-1.5 text-muted-foreground text-sm mt-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[200px]">{match.address}</span>
              </div>
            </div>
            <Badge className="bg-primary/10 text-primary border-0 font-semibold">
              {typeLabels[match.football_type] || match.football_type}
            </Badge>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{format(matchDate, "EEE d MMM, HH:mm", { locale: es })}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <DollarSign className="w-3.5 h-3.5" />
              <span>${match.cost_per_player || 0}</span>
            </div>
            <div className={`flex items-center gap-1.5 font-medium ${spotsLeft <= 2 ? "text-accent" : "text-primary"}`}>
              <Users className="w-3.5 h-3.5" />
              <span>{spotsLeft > 0 ? `${spotsLeft} lugares` : "Completo"}</span>
            </div>
          </div>

          {/* Missing positions */}
          {match.missing_positions?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {match.missing_positions.map((pos, i) => (
                <Badge key={i} variant="outline" className="text-xs border-border bg-secondary/50">
                  Falta {pos}
                </Badge>
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${((match.current_players || 0) / match.players_needed) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {match.current_players || 0} / {match.players_needed} jugadores
            </p>
          </div>

          {/* Match type badge */}
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="text-xs capitalize">
              {match.match_type}
            </Badge>
            {isPast && (
              <Badge variant="outline" className="text-xs text-muted-foreground">
                Finalizado
              </Badge>
            )}
          </div>
        </div>
      </Card>
    </Link>
  );
}