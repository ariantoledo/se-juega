import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { MapPin, AlertTriangle } from "lucide-react";

export default function RegistrarEstablecimiento() {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: "",
    phone: "",
    images: []
  });

  const [user, setUser] = useState(null);
  const [coords, setCoords] = useState(null);
  const [geoStatus, setGeoStatus] = useState("pending"); // pending | granted | denied

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    // Capturar GPS automáticamente al abrir la página
    if (navigator.geolocation) {
      setGeoStatus("pending");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
          setGeoStatus("granted");
        },
        () => setGeoStatus("denied")
      );
    } else {
      setGeoStatus("denied");
    }
  }, []);

  const createEstablishmentMutation = useMutation({
    mutationFn: async () => {
      const created = await base44.entities.Establishment.create({
        ...formData,
        owner_email: user.email,
        is_active: true,
        latitude: coords?.latitude,
        longitude: coords?.longitude,
      });
      return created;
    },
    onSuccess: (created) => {
      toast.success("Establecimiento creado exitosamente");
      window.location.href = createPageUrl(`RegistrarCancha?establishment_id=${created.id}`);
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

        {/* Recordatorio de ubicación GPS */}
        <div className={`mb-4 p-4 rounded-xl border-2 flex items-start gap-3 ${
          geoStatus === "granted" ? "border-primary/40 bg-primary/5" :
          geoStatus === "denied" ? "border-destructive/40 bg-destructive/5" :
          "border-accent/40 bg-accent/5"
        }`}>
          {geoStatus === "granted" ? (
            <MapPin className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-accent shrink-0 mt-0.5" />
          )}
          <div>
            <p className="text-sm font-semibold">
              {geoStatus === "granted" ? "✅ Ubicación GPS capturada" :
               geoStatus === "denied" ? "⚠️ Ubicación no disponible" :
               "📍 Capturando tu ubicación..."}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {geoStatus === "granted"
                ? `La ubicación actual de tu dispositivo se guardará como las coordenadas del establecimiento. Asegurate de estar físicamente en el lugar al registrarlo.`
                : geoStatus === "denied"
                ? "No pudimos obtener tu ubicación GPS. El establecimiento no tendrá coordenadas y no aparecerá en búsquedas por cercanía. Podés habilitarlas desde la configuración de tu navegador."
                : "Por favor esperá mientras obtenemos tu ubicación GPS actual..."}
            </p>
          </div>
        </div>

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
                <Button type="submit" className="flex-1" disabled={createEstablishmentMutation.isPending}>
                  {createEstablishmentMutation.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creando...</>
                    : "Crear establecimiento"}
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
            <p className="text-sm text-muted-foreground mb-4">
              Una vez creado el establecimiento, te redirigiremos automáticamente para agregar tu primera cancha.
            </p>
            <p className="text-xs text-muted-foreground">
              Los pagos se procesarán mediante Mercado Pago en pesos argentinos.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}