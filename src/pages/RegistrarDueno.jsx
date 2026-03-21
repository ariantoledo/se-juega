import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, Loader2, Clock, AlertCircle, X } from "lucide-react";
import { toast } from "sonner";

export default function RegistrarDueno() {
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
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

  // If already pending or verified, show appropriate screen
  if (user?.role === "dueño_pendiente") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Clock className="w-16 h-16 text-accent mx-auto" />
            <h2 className="text-2xl font-bold">Solicitud en revisión</h2>
            <p className="text-muted-foreground">
              Tu solicitud está siendo revisada por nuestro equipo. Te notificaremos por email cuando sea aprobada.
            </p>
            <Button asChild className="w-full">
              <a href={createPageUrl("Home")}>Volver al inicio</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">¡Solicitud enviada!</h2>
            <div className="p-4 bg-primary/10 rounded-lg text-left space-y-2">
              <p className="font-medium text-sm">Tu solicitud fue enviada correctamente y está en revisión.</p>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo revisará tu información y te notificará por email. Mientras tanto, tu cuenta estará en estado pendiente.
              </p>
            </div>
            <Button asChild className="w-full">
              <a href={createPageUrl("Home")}>Entendido, volver al inicio</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Reset error state
    setUploadError(null);
    setUploading(true);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      if (!file_url) throw new Error("No se recibió URL del archivo");
      setFormData(prev => ({ ...prev, evidence_url: file_url }));
      toast.success("Imagen subida correctamente");
    } catch (err) {
      setUploadError("Error al subir la imagen. Intenta nuevamente.");
      toast.error("Error al subir la imagen. Intenta nuevamente.");
      // Reset file input
      e.target.value = "";
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.establishment_name || !formData.address || !formData.phone || !formData.document_info) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }

    if (uploading) {
      toast.error("Espera a que termine de subir la imagen");
      return;
    }

    setSubmitting(true);
    try {
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
      setSubmitted(true);
    } catch (err) {
      toast.error("Error al enviar la solicitud. Intenta nuevamente.");
    } finally {
      setSubmitting(false);
    }
  };

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
                  onChange={(e) => setFormData(prev => ({ ...prev, establishment_name: e.target.value }))}
                  placeholder="Ej: Complejo Deportivo El Italiano"
                  required
                />
              </div>
              <div>
                <Label>Dirección *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Dirección completa"
                  required
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>
              <div>
                <Label>Documento / Identificación *</Label>
                <Input
                  value={formData.document_info}
                  onChange={(e) => setFormData(prev => ({ ...prev, document_info: e.target.value }))}
                  placeholder="DNI, CUIT o número de identificación"
                  required
                />
              </div>

              {/* Evidence upload */}
              <div>
                <Label>Evidencia <span className="text-muted-foreground text-xs">(foto del local, habilitación, etc.)</span></Label>

                {uploadError && (
                  <Alert className="mt-2 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <AlertDescription className="text-destructive flex items-center justify-between">
                      {uploadError}
                      <button type="button" onClick={() => setUploadError(null)}>
                        <X className="w-4 h-4 ml-2" />
                      </button>
                    </AlertDescription>
                  </Alert>
                )}

                {formData.evidence_url ? (
                  <div className="mt-2 space-y-2">
                    <div className="relative">
                      <img
                        src={formData.evidence_url}
                        alt="Evidencia"
                        className="w-full max-h-48 object-cover rounded-lg border"
                      />
                      <div className="absolute top-2 right-2">
                        <div className="bg-primary text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Subida
                        </div>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, evidence_url: "" }));
                        setUploadError(null);
                      }}
                    >
                      Cambiar imagen
                    </Button>
                  </div>
                ) : (
                  <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-6 mt-2 transition-colors ${uploading ? "opacity-70 cursor-not-allowed" : "cursor-pointer hover:bg-secondary"}`}>
                    {uploading ? (
                      <>
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        <span className="text-sm font-medium">Subiendo imagen...</span>
                        <span className="text-xs text-muted-foreground">Por favor espera</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-muted-foreground" />
                        <span className="text-sm font-medium">Toca para subir imagen o PDF</span>
                        <span className="text-xs text-muted-foreground">Foto del local, habilitación municipal, etc.</span>
                      </>
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
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={submitting || uploading}
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Enviando...</>
                  ) : uploading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Esperando imagen...</>
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