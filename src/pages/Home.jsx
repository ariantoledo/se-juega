import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, PlusCircle, CalendarDays, Filter } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";
import EmptyState from "../components/matches/EmptyState";

export default function Home() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");

  const { data: matches = [], isLoading } = useQuery({
    queryKey: ["matches"],
    queryFn: () => base44.entities.Match.list("-date"),
  });

  // Filter open matches that are in the future
  const filteredMatches = matches
    .filter((m) => m.status === "open" && new Date(m.date) >= new Date())
    .filter((m) => {
      if (typeFilter !== "all" && m.football_type !== typeFilter) return false;
      if (genderFilter !== "all" && m.match_type !== genderFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        return (
          m.field_name?.toLowerCase().includes(s) ||
          m.address?.toLowerCase().includes(s)
        );
      }
      return true;
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6">
      {/* Hero section */}
      <div className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">
          Encontrá tu partido
        </h1>
        <p className="text-muted-foreground mt-1">
          Unite a un partido cerca tuyo o creá uno nuevo
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por cancha o dirección..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="5">Fútbol 5</SelectItem>
            <SelectItem value="7">Fútbol 7</SelectItem>
            <SelectItem value="11">Fútbol 11</SelectItem>
          </SelectContent>
        </Select>
        <Select value={genderFilter} onValueChange={setGenderFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Género" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="hombres">Hombres</SelectItem>
            <SelectItem value="mixto">Mixto</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Matches list */}
      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-52 rounded-xl bg-secondary animate-pulse" />
          ))}
        </div>
      ) : filteredMatches.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={CalendarDays}
          title="No hay partidos disponibles"
          description="Sé el primero en crear un partido y armá tu equipo"
          action={
            <Link to={createPageUrl("CreateMatch")}>
              <Button className="bg-primary hover:bg-primary/90">
                <PlusCircle className="w-4 h-4 mr-2" />
                Crear Partido
              </Button>
            </Link>
          }
        />
      )}
    </div>
  );
}