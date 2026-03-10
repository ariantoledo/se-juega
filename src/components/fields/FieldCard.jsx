import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function FieldCard({ field }) {
  return (
    <Link to={createPageUrl("FieldDetail") + `?id=${field.id}`}>
      <Card className="border-border/50 hover:border-primary/40 hover:shadow-md transition-all cursor-pointer overflow-hidden">
        <CardContent className="p-0">
          {field.images?.[0] ? (
            <div className="h-40 overflow-hidden">
              <img src={field.images[0]} alt={field.name} className="w-full h-full object-cover" />
            </div>
          ) : (
            <div className="h-40 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
              <span className="text-5xl">⚽</span>
            </div>
          )}
          <div className="p-4">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-foreground text-lg leading-tight">{field.name}</h3>
              {field.price_per_hour > 0 && (
                <span className="text-primary font-bold text-sm whitespace-nowrap ml-2">
                  ${field.price_per_hour}/h
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-3">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{field.address}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {field.field_types?.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs">
                  Fútbol {t}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}