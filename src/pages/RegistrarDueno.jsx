import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useMutation } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function RegistrarDueno() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    establishment_name: "",
    address: "",
    phone: "",
    document_info: "",
    evidence_url: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const submitMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.OwnerRequest.create({
        user_email: user.email,
        user_name: user.full_name,
        establishment_name: formData.establishment_name,
        address: formData.address,
        phone: formData.phone,
        document_info: formData.document_info,
        evidence_url: formData.evidence_url,
        status: "pending"
      });
      await base44.auth.updateMe({ role: "dueño_pendiente" });
    },
    onSuccess: () => {
      setSubmitted(true);
      toast.success("Solicitud enviada correctamente");
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setFormData({ ...formData, evidence_url: file_url });
    setUploading(false);
    toast.success("Archivo subido");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.establishment_name || !formData.address || !formData.phone || !formData.document_info) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    submitMutation.mutate();
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">Solicitud enviada</h2>
            <p className="text-muted-foreground">
              Tu solicitud está en revisión. Te notificaremos por email cuando sea aprobada o rechazada.
            </p>
            <Button asChild className="w-full">
              <a href={createPageUrl("Home")}>Volver al inicio</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Registro como Dueño</h1>
          <p className="text-muted-foreground mt-1">Completa el formulario para solicitar acceso a la sección Estadios</p>
        </div>

        <Alert className="mb-6">
          <AlertDescription>
            Tu solicitud será revisada por nuestro equipo. Una vez aprobada, podrás crear y gestionar tus establecimientos.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Información del establecimiento</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del establecimiento *</Label>
                <Input
                  value={formData.establishment_name}
                  onChange={(e) => setFormData({ ...formData, establishment_name: e.target.value })}
                  placeholder="Ej: Complejo Deportivo El Italiano"
                />
              </div>
              <div>
                <Label>Dirección *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Dirección completa"
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+54 9 11 1234-5678"
                />
              </div>
              <div>
                <Label>Documento / Identificación *</Label>
                <Input
                  value={formData.document_info}
                  onChange={(e) => setFormData({ ...formData, document_info: e.target.value })}
                  placeholder="DNI, CUIT o número de identificación"
                />
              </div>
              <div>
                <Label>Evidencia (foto del local, habilitación, etc.)</Label>
                {formData.evidence_url ? (
                  <div className="mt-2 space-y-2">
                    <img
                      src={formData.evidence_url}
                      alt="Evidencia"
                      className="w-full max-h-48 object-cover rounded-lg border"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => setFormData({ ...formData, evidence_url: "" })}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 cursor-pointer hover:bg-secondary transition-colors mt-2">
                    {uploading ? (
                      <><Loader2 className="w-6 h-6 animate-spin text-primary" /><span className="text-sm text-muted-foreground">Subiendo imagen...</span></>
                    ) : (
                      <><Upload className="w-6 h-6 text-muted-foreground" /><span className="text-sm text-muted-foreground">Toca para subir imagen o PDF</span><span className="text-xs text-muted-foreground">Foto del local, habilitación municipal, etc.</span></>
                    )}
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" className="flex-1" asChild>
                  <a href={createPageUrl("Profile")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1" disabled={submitMutation.isPending}>
                  {submitMutation.isPending ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}