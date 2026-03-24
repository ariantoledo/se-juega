import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/mobile-select";
import { toast } from "sonner";
import { Upload, X, MapPin } from "lucide-react";

export default function RegistrarCancha() {
  const urlParams = new URLSearchParams(window.location.search);
  const establishmentId = urlParams.get("establishment_id");
  const formRef = useRef(null);

  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    field_type: "futbol5",
    description: "",
    address: "",
    precio_total: "",
    precio_sena: "",
    images: []
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: establishment } = useQuery({
    queryKey: ["establishment", establishmentId],
    queryFn: async () => {
      const all = await base44.entities.Establishment.list();
      return all.find(e => e.id === establishmentId);
    },
    enabled: !!establishmentId
  });

  const createFieldMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.FieldNew.create({
        establishment_id: establishmentId,
        name: formData.name,
        field_type: formData.field_type,
        description: formData.description,
        address: formData.address || establishment.address,
        precio_total: parseFloat(formData.precio_total),
        precio_sena: parseFloat(formData.precio_sena),
        images: formData.images,
        owner_email: user.email,
        is_active: true,
        // Hereda las coordenadas del establecimiento
        latitude: establishment.latitude,
        longitude: establishment.longitude,
      });
    },
    onSuccess: () => {
      toast.success("Cancha creada exitosamente");
      window.location.href = createPageUrl("MisCanchas");
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, images: [...formData.images, file_url] });
      toast.success("Imagen subida");
    } catch (error) {
      toast.error("Error al subir imagen");
    }
    setUploading(false);
  };

  const removeImage = (index) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index)
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name || !formData.precio_total || !formData.precio_sena) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    createFieldMutation.mutate();
  };

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
        <h1 className="text-3xl font-bold mb-2">Registrar Cancha</h1>
        <p className="text-muted-foreground mb-4">Establecimiento: {establishment.name}</p>

        {/* Info de coordenadas heredadas */}
        <div className={`mb-4 p-3 rounded-xl border flex items-start gap-2 ${
          establishment.latitude ? "border-primary/30 bg-primary/5" : "border-accent/30 bg-accent/5"
        }`}>
          <MapPin className={`w-4 h-4 shrink-0 mt-0.5 ${establishment.latitude ? "text-primary" : "text-accent"}`} />
          <p className="text-xs text-muted-foreground">
            {establishment.latitude
              ? `Esta cancha heredará las coordenadas GPS del establecimiento (${establishment.latitude.toFixed(4)}, ${establishment.longitude.toFixed(4)}). Aparecerá en búsquedas por cercanía.`
              : "El establecimiento no tiene coordenadas GPS. Esta cancha no aparecerá en búsquedas por cercanía. Para habilitarlo, editá el establecimiento desde un dispositivo con ubicación activa."}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de la cancha</CardTitle>
          </CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" onFocus={(e) => {
              if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
              }
            }}>
              <div>
                <Label>Nombre de la cancha *</Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Ej: Cancha 1 - Techada"
                  required
                />
              </div>

              <div>
                <Label htmlFor="field-type">Tipo de cancha *</Label>
                <MobileSelect value={formData.field_type} onValueChange={(value) => setFormData({...formData, field_type: value})} id="field-type">
                  <option value="futbol5">Fútbol 5</option>
                  <option value="futbol7">Fútbol 7</option>
                  <option value="futbol11">Fútbol 11</option>
                  <option value="padel">Pádel</option>
                </MobileSelect>
              </div>

              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Características de la cancha"
                  rows={3}
                />
              </div>

              <div>
                <Label>Dirección (opcional)</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder={establishment.address}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Si está vacío, se usará la dirección del establecimiento
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio total por hora *</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.precio_total}
                    onChange={(e) => setFormData({...formData, precio_total: e.target.value})}
                    placeholder="40000"
                    required
                  />
                </div>
                <div>
                  <Label>Precio seña *</Label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={formData.precio_sena}
                    onChange={(e) => setFormData({...formData, precio_sena: e.target.value})}
                    placeholder="9000"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>Imágenes</Label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt={`Cancha ${idx + 1}`} className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        aria-label={`Eliminar imagen ${idx + 1}`}
                        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="flex items-center justify-center gap-2 border-2 border-dashed rounded-lg p-4 cursor-pointer hover:bg-secondary transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">{uploading ? "Subiendo..." : "Subir imagen"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <a href={createPageUrl("MisCanchas")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1" disabled={createFieldMutation.isPending}>
                  {createFieldMutation.isPending ? "Creando..." : "Crear cancha"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}