import React from "react";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Banknote } from "lucide-react";
import { Button } from "@/components/ui/button";

const typeLabels = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11",
  padel: "Pádel",
  tenis: "Tenis",
  ping_pong: "Ping Pong"
};

const CanchaCard = React.memo(function CanchaCard({ field, establishmentName }) {
  return (
    <a
      href={createPageUrl(`CanchaDetail?id=${field.id}`)}
      aria-label={`Ver detalles de la cancha ${field.name}`}
      className="block h-full"
    >
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <CardHeader className="p-0">
          {field.images && field.images.length > 0 ? (
            <img
              src={field.images[0]}
              alt={`Foto de la cancha ${field.name}`}
              className="w-full h-40 sm:h-48 object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full h-40 sm:h-48 bg-primary/10 rounded-t-xl flex items-center justify-center">
              <span className="text-5xl sm:text-6xl">⚽</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="min-w-0">
              <h3 className="font-semibold text-base sm:text-lg truncate">{field.name}</h3>
              {establishmentName && (
                <p className="text-xs text-muted-foreground truncate">{establishmentName}</p>
              )}
            </div>
            <Badge variant="secondary" className="ml-2 shrink-0">{typeLabels[field.field_type] || field.field_type}</Badge>
          </div>

          {(field.localidad || field.address) && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4 shrink-0" />
              <span className="truncate">{[field.localidad, field.address].filter(Boolean).join(" — ")}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs sm:text-sm">
            <div className="flex items-center gap-1">
              <Banknote className="w-4 h-4 text-primary shrink-0" />
              <span className="font-semibold text-foreground">
                ${(field.precio_total || 0).toLocaleString()}
              </span>
              <span className="text-muted-foreground">/hora</span>
            </div>
            {field.precio_sena > 0 && (
              <div className="text-muted-foreground">
                Seña: ${(field.precio_sena || 0).toLocaleString()}
              </div>
            )}
          </div>

          {/* Botón visible en pantallas grandes */}
          <div className="hidden sm:block mt-3">
            <Button className="w-full">Reservar</Button>
          </div>
        </CardContent>
      </Card>
    </a>
  );
});

export default CanchaCard;