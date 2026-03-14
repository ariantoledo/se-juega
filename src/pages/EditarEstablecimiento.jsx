import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
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