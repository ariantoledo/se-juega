import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function RegistrarEstablecimiento() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    images: []
  });

  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const createEstablishmentMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Establishment.create({
        ...formData,
        owner_email: user.email,
        is_active: true
      });
    },
    onSuccess: () => {
      toast.success("Establecimiento creado exitosamente");
      window.location.href = createPageUrl("MisCanchas");
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.address) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    createEstablishmentMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Registrar Establecimiento</h1>

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
                  placeholder="+56 9 1234 5678"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <a href={createPageUrl("MisCanchas")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1">
                  Crear establecimiento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Próximo paso</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Una vez creado el establecimiento, podrás agregar canchas y configurar horarios de disponibilidad.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}