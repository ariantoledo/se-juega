import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import MobileSelect from "@/components/ui/mobile-select";
import { MapPin, Search } from "lucide-react";
import CanchaCard from "../components/canchas/CanchaCard";

export default function Canchas() {
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [localidadFilter, setLocalidadFilter] = useState("");

  const { data: fields = [], isLoading } = useQuery({
    queryKey: ["fieldsnew"],
    queryFn: () => base44.entities.FieldNew.list(),
  });

  const { data: establishments = [] } = useQuery({
    queryKey: ["establishments"],
    queryFn: () => base44.entities.Establishment.list(),
  });

  const establishmentMap = Object.fromEntries(establishments.map(e => [e.id, e.name]));

  const localidades = [...new Set(fields.filter(f => f.localidad).map(f => f.localidad))].sort();

  const activeFields = fields.filter(f => f.is_active);

  const filteredFields = activeFields.filter(field => {
    const matchesSearch =
      field.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      field.localidad?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === "all" || field.field_type === typeFilter;
    const matchesLocalidad = !localidadFilter || field.localidad === localidadFilter;
    return matchesSearch && matchesType && matchesLocalidad;
  });

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-foreground mb-2">Canchas Disponibles</h1>
          <p className="text-muted-foreground">Encuentra y reserva tu cancha de fútbol</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, localidad o dirección..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Buscar canchas"
            />
          </div>
          <MobileSelect value={typeFilter} onValueChange={setTypeFilter} id="cancha-type-filter" className="w-full md:w-48" placeholder="Todos los tipos">
            <option value="all">Todos los tipos</option>
            <option value="futbol5">Fútbol 5</option>
            <option value="futbol7">Fútbol 7</option>
            <option value="futbol11">Fútbol 11</option>
            <option value="padel">Pádel</option>
            <option value="tenis">Tenis</option>
            <option value="ping_pong">Ping Pong</option>
          </MobileSelect>
          <MobileSelect value={localidadFilter} onValueChange={setLocalidadFilter} id="localidad-filter" className="w-full md:w-48" placeholder="Todas las localidades">
            <option value="">Todas las localidades</option>
            {localidades.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </MobileSelect>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="h-72 bg-muted animate-pulse rounded-xl" />
            ))}
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No se encontraron canchas</h3>
            <p className="text-muted-foreground">Intenta con otros filtros de búsqueda</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredFields.map(field => (
              <CanchaCard key={field.id} field={field} establishmentName={establishmentMap[field.establishment_id]} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}