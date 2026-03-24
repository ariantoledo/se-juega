import React from "react";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Banknote } from "lucide-react";

const typeLabels = {
  futbol5: "Fútbol 5",
  futbol7: "Fútbol 7",
  futbol11: "Fútbol 11"
};

const CanchaCard = React.memo(function CanchaCard({ field }) {
  return (
    <a href={createPageUrl(`CanchaDetail?id=${field.id}`)} aria-label={`Ver detalles de ${field.name}`}>
      <Card className="hover:shadow-lg transition-all duration-300 cursor-pointer h-full">
        <CardHeader className="p-0">
          {field.images && field.images.length > 0 ? (
            <img 
              src={field.images[0]} 
              alt={field.name}
              className="w-full h-48 object-cover rounded-t-xl"
            />
          ) : (
            <div className="w-full h-48 bg-primary/10 rounded-t-xl flex items-center justify-center">
              <span className="text-6xl">⚽</span>
            </div>
          )}
        </CardHeader>
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg">{field.name}</h3>
            <Badge variant="secondary">{typeLabels[field.field_type]}</Badge>
          </div>
          
          {field.address && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
              <MapPin className="w-4 h-4" />
              <span className="truncate">{field.address}</span>
            </div>
          )}

          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <Banknote className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">
                ${field.precio_total.toLocaleString()}
              </span>
              <span className="text-muted-foreground">/hora</span>
            </div>
            <div className="text-muted-foreground">
              Seña: ${field.precio_sena.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </a>
  );
});

export default CanchaCard;