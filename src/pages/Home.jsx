import React, { useState, useEffect } from "react";
import Onboarding from "../components/Onboarding";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Search, PlusCircle, CalendarDays, Filter } from "lucide-react";
import MatchCard from "../components/matches/MatchCard";
import PullToRefresh from "../components/PullToRefresh";
import EmptyState from "../components/matches/EmptyState";

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [genderFilter, setGenderFilter] = useState("all");
  const [showFilterSheet, setShowFilterSheet] = useState(false);

  useEffect(() => {
    const seen = localStorage.getItem("onboarding_seen");
    if (!seen) setShowOnboarding(true);
  }, []);

  const handleCloseOnboarding = () => {
    localStorage.setItem("onboarding_seen", "1");
    setShowOnboarding(false);
  };

  const { data: matches = [], isLoading, refetch } = useQuery({
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
    <>
      {showOnboarding && <Onboarding onClose={handleCloseOnboarding} />}
      <PullToRefresh onRefresh={refetch}>
        <div className="max-w-5xl mx-auto px-4 py-6 pb-24 md:pb-6" style={{ overscrollBehavior: "none" }}>
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
            <button
              onClick={() => setShowFilterSheet(true)}
              className="flex items-center gap-2 px-4 h-9 rounded-md border border-input bg-background text-sm font-medium hover:bg-secondary transition-colors"
            >
              <Filter className="w-4 h-4" />
              Filtros
              {(typeFilter !== "all" || genderFilter !== "all") && (
                <span className="ml-1 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                  {[typeFilter !== "all", genderFilter !== "all"].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          <Drawer open={showFilterSheet} onOpenChange={setShowFilterSheet}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Filtrar partidos</DrawerTitle>
              </DrawerHeader>
              <div className="px-4 pb-10 space-y-6">
                <div>
                  <p className="text-sm font-semibold mb-3">Tipo de fútbol</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[["all","Todos"],["5","Fútbol 5"],["7","Fútbol 7"],["11","Fútbol 11"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setTypeFilter(val)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          typeFilter === val ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold mb-3">Tipo de partido</p>
                  <div className="grid grid-cols-3 gap-2">
                    {[["all","Todos"],["hombres","Hombres"],["mixto","Mixto"]].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setGenderFilter(val)}
                        className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                          genderFilter === val ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/30"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <Button className="w-full" onClick={() => setShowFilterSheet(false)}>Ver resultados</Button>
              </div>
            </DrawerContent>
          </Drawer>

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
      </PullToRefresh>
    </>
  );
}