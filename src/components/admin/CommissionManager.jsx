import React from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function CommissionManager() {
  const queryClient = useQueryClient();

  const { data: establishments = [], isLoading } = useQuery({
    queryKey: ["all-establishments-admin"],
    queryFn: () => base44.entities.Establishment.list(),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, value }) => {
      await base44.entities.Establishment.update(id, { commission_enabled: value });
    },
    onMutate: async ({ id, value }) => {
      await queryClient.cancelQueries({ queryKey: ["all-establishments-admin"] });
      const prev = queryClient.getQueryData(["all-establishments-admin"]);
      queryClient.setQueryData(["all-establishments-admin"], (old = []) =>
        old.map(e => e.id === id ? { ...e, commission_enabled: value } : e)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["all-establishments-admin"], ctx?.prev);
      toast.error("Error al actualizar la comisión");
    },
    onSuccess: (_d, { value }) => {
      toast.success(value ? "Comisión activada" : "Comisión desactivada");
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (establishments.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No hay establecimientos registrados
        </CardContent>
      </Card>
    );
  }

  const active = establishments.filter(e => e.commission_enabled !== false).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {active} de {establishments.length} establecimientos con comisión activa
        </p>
      </div>

      <div className="space-y-3">
        {establishments.map(est => {
          const enabled = est.commission_enabled !== false;
          return (
            <Card key={est.id} className={`border-2 transition-colors ${enabled ? "border-primary/20" : "border-border"}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${enabled ? "bg-primary/10" : "bg-secondary"}`}>
                      <Building2 className={`w-5 h-5 ${enabled ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{est.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{est.owner_email}</p>
                      <p className="text-xs text-muted-foreground truncate">{est.address}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant={enabled ? "default" : "secondary"} className="hidden sm:inline-flex">
                      {enabled ? "Con comisión" : "Sin comisión"}
                    </Badge>
                    <Switch
                      checked={enabled}
                      aria-label={`${enabled ? 'Desactivar' : 'Activar'} comisión para ${est.name}`}
                      onCheckedChange={(val) => toggleMutation.mutate({ id: est.id, value: val })}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}