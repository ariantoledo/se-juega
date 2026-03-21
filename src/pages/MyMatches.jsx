import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Plus } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";
import PullToRefresh from "../components/PullToRefresh";
import EmptyState from "../components/matches/EmptyState";

export default function MyMatches() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: allMatches = [], refetch: refetchMatches } = useQuery({
    queryKey: ["all_matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  const { data: myPlayers = [], refetch: refetchPlayers } = useQuery({
    queryKey: ["my_players", user?.email],
    queryFn: () => base44.entities.MatchPlayer.filter({ player_email: user?.email }),
    enabled: !!user?.email,
  });

  const handleRefresh = async () => {
    await Promise.all([refetchMatches(), refetchPlayers()]);
  };

  const createdMatches = allMatches.filter((m) => m.creator_email === user?.email);
  const joinedMatchIds = myPlayers.map((p) => p.match_id);
  const joinedMatches = allMatches.filter(
    (m) => joinedMatchIds.includes(m.id) && m.creator_email !== user?.email
  );

  return (
    <PullToRefresh onRefresh={handleRefresh}>
      <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
        <h1 className="text-3xl font-bold text-foreground tracking-tight mb-6">
          Mis Partidos
        </h1>

        <Tabs defaultValue="created" className="w-full">
          <TabsList className="w-full mb-6">
            <TabsTrigger value="created" className="flex-1 select-none">Creados ({createdMatches.length})</TabsTrigger>
            <TabsTrigger value="joined" className="flex-1 select-none">Me uní ({joinedMatches.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="created">
            {createdMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {createdMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={CalendarDays}
                title="No creaste ningún partido"
                description="Armá un equipo y organizá tu próximo partido"
              />
            )}
          </TabsContent>

          <TabsContent value="joined">
            {joinedMatches.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2">
                {joinedMatches.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Plus}
                title="No te uniste a ningún partido"
                description="Explorá partidos disponibles en la pantalla principal"
              />
            )}
          </TabsContent>
        </Tabs>
      </div>
    </PullToRefresh>
  );
}