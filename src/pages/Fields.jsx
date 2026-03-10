import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Plus, Loader2 } from "lucide-react";
import FieldCard from "../components/fields/FieldCard";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function Fields() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fields"],
    queryFn: () => base44.entities.Field.list(),
  });

  const filtered = fields.filter((f) => {
    const matchSearch =
      !search ||
      f.name?.toLowerCase().includes(search.toLowerCase()) ||
      f.address?.toLowerCase().includes(search.toLowerCase());
    const matchType =
      typeFilter === "all" || f.field_types?.includes(typeFilter);
    return matchSearch && matchType && f.is_active !== false;
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-24 md:pb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight">Canchas</h1>
          <p className="text-muted-foreground text-sm mt-1">Encontrá y reservá tu cancha</p>
        </div>
        <Link to={createPageUrl("FieldOwnerDashboard")}>
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Mi cancha</span>
          </Button>
        </Link>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nombre o dirección..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {["all", "5", "7", "11"].map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
              typeFilter === t
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {t === "all" ? "Todas" : `Fútbol ${t}`}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-semibold text-lg mb-1">No hay canchas disponibles</p>
          <p className="text-muted-foreground text-sm mb-6">Sé el primero en registrar tu cancha</p>
          <Link to={createPageUrl("FieldOwnerDashboard")}>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Registrar cancha
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((field) => (
            <FieldCard key={field.id} field={field} />
          ))}
        </div>
      )}
    </div>
  );
}