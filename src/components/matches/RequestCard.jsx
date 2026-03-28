import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, User, ChevronRight } from "lucide-react";
import PlayerProfileDrawer from "./PlayerProfileDrawer";

const RequestCard = React.memo(function RequestCard({ request, onAccept, onReject, loading }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <Card className="p-4 border-border/50">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowProfile(true)}
            className="flex items-center gap-3 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
            aria-label={`Ver perfil de ${request.player_name}`}
          >
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
              <User className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground text-sm truncate">{request.player_name}</p>
              <Badge variant="outline" className="text-xs mt-0.5">{request.position}</Badge>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>

          {request.status === "pending" && (
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(request)}
                disabled={loading}
                aria-label={`Rechazar solicitud de ${request.player_name}`}
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={() => onAccept(request)}
                disabled={loading}
                aria-label={`Aceptar solicitud de ${request.player_name}`}
                className="bg-primary hover:bg-primary/90"
              >
                <Check className="w-4 h-4" />
              </Button>
            </div>
          )}
          {request.status === "accepted" && (
            <Badge className="bg-primary/10 text-primary border-0 shrink-0">Aceptado</Badge>
          )}
          {request.status === "rejected" && (
            <Badge className="bg-destructive/10 text-destructive border-0 shrink-0">Rechazado</Badge>
          )}
        </div>
      </Card>

      <PlayerProfileDrawer
        playerEmail={request.player_email}
        playerName={request.player_name}
        open={showProfile}
        onClose={setShowProfile}
      />
    </>
  );
});

export default RequestCard;