import React from "react";
import { Badge } from "@/components/ui/badge";
import { User, Crown } from "lucide-react";

const PlayerList = React.memo(function PlayerList({ players, creatorEmail }) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              {player.player_email === creatorEmail ? (
                <Crown className="w-4 h-4 text-accent" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{player.player_name}</p>
              <p className="text-xs text-muted-foreground">{player.position}</p>
            </div>
          </div>
          {player.player_email === creatorEmail && (
            <Badge className="bg-accent/10 text-accent border-0 text-xs">Organizador</Badge>
          )}
        </div>
      ))}
    </div>
  );
});

export default PlayerList;