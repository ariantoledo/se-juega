import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { goBack } from "@/lib/nav-history";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function EditarEstablecimiento() {
  const urlParams = new URLSearchParams(window.location.search);
  const establishmentId = urlParams.get("id");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    images: []
  });

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: establishment, isLoading } = useQuery({
    queryKey: ["establishment", establishmentId],
    queryFn: async () => {
      const all = await base44.entities.Establishment.list();
      return all.find(e => e.id === establishmentId);
    },
    enabled: !!establishmentId
  });

  useEffect(() => {
    if (establishment) {
      setFormData({
        name: establishment.name || "",
        description: establishment.description || "",
        address: establishment.address || "",
        phone: establishment.phone || "",
        images: establishment.images || []
      });
    }
  }, [establishment]);

  const updateEstablishmentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Establishment.update(establishmentId, formData);
    },
    onMutate: async () => {
      const prev = queryClient?.getQueryData(["establishment", establishmentId]);
      queryClient?.setQueryData(["establishment", establishmentId], (old) => old ? { ...old, ...formData } : old);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient?.setQueryData(["establishment", establishmentId], ctx?.prev);
      toast.error("Error al actualizar establecimiento");
    },
    onSuccess: () => {
      toast.success("Establecimiento actualizado exitosamente");
      window.location.href = createPageUrl("MisCanchas");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    updateEstablishmentMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Cargando...</div>
      </div>
    );
  }

  if (!establishment) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Establecimiento no encontrado</h2>
          <Button asChild>
            <a href={createPageUrl("MisCanchas")}>Volver</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => goBack(navigate)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4 transition-colors min-h-[44px]"
          aria-label="Volver"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Volver
        </button>
        <h1 className="text-3xl font-bold mb-6">Editar Establecimiento</h1>

        <Card>
          <CardHeader>
            <CardTitle>Información del establecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: El Italiano"
                  required
                />
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Descripción del establecimiento"
                  rows={3}
                />
              </div>

              <div>
                <Label>Dirección *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="Dirección completa"
                  required
                />
              </div>

              <div>
                <Label>Teléfono</Label>
                <Input
                  type="tel"
                  inputMode="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+54 11 1234 5678"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <a href={createPageUrl("MisCanchas")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1" disabled={updateEstablishmentMutation.isPending}>
                  {updateEstablishmentMutation.isPending ? "Actualizando..." : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}