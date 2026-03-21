import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, Loader2, Clock, AlertCircle, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];
const ALLOWED_LABELS = "JPG, PNG, WEBP, PDF";

function FileItem({ file, onRemove }) {
  const isImage = file.type?.startsWith("image/");
  return (
    <div className="flex items-center gap-3 p-3 bg-secondary rounded-lg">
      {file.status === "uploading" && <Loader2 className="w-5 h-5 shrink-0 animate-spin text-primary" />}
      {file.status === "done" && <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />}
      {file.status === "error" && <AlertCircle className="w-5 h-5 shrink-0 text-destructive" />}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{file.name}</p>
        {file.status === "uploading" && <p className="text-xs text-muted-foreground">Subiendo...</p>}
        {file.status === "done" && <p className="text-xs text-primary">Subido correctamente</p>}
        {file.status === "error" && <p className="text-xs text-destructive">{file.error}</p>}
      </div>

      {file.url && isImage && (
        <img src={file.url} alt={file.name} className="w-12 h-12 object-cover rounded shrink-0" />
      )}

      {file.status !== "uploading" && (
        <button type="button" onClick={() => onRemove(file.id)} className="p-1 hover:bg-border rounded shrink-0">
          <X className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

export default function RegistrarDueno() {
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    establishment_name: "",
    address: "",
    phone: "",
    document_info: ""
  });

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  if (user?.role === "dueño_pendiente") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Clock className="w-16 h-16 text-accent mx-auto" />
            <h2 className="text-2xl font-bold">Solicitud en revisión</h2>
            <p className="text-muted-foreground">
              Tu solicitud está siendo revisada. Te notificaremos por email cuando sea aprobada.
            </p>
            <Button asChild className="w-full"><a href={createPageUrl("Home")}>Volver al inicio</a></Button>
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
                Nuestro equipo revisará tu información. Mientras tanto tu cuenta queda en estado pendiente.
              </p>
            </div>
            <Button asChild className="w-full"><a href={createPageUrl("Home")}>Entendido, volver al inicio</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const uploadFile = async (rawFile) => {
    // Validate type
    if (!ALLOWED_TYPES.includes(rawFile.type)) {
      return { status: "error", error: `Formato no permitido. Usa ${ALLOWED_LABELS}` };
    }
    // Validate size
    if (rawFile.size > MAX_SIZE_MB * 1024 * 1024) {
      return { status: "error", error: `El archivo es demasiado grande (máx ${MAX_SIZE_MB}MB)` };
    }
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: rawFile });
      if (!file_url) throw new Error("No se recibió URL");
      return { status: "done", url: file_url };
    } catch {
      return { status: "error", error: "Error al subir el archivo, intenta nuevamente" };
    }
  };

  const handleFilesSelected = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    e.target.value = "";

    const newFiles = selected.map((f) => ({
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      name: f.name,
      type: f.type,
      status: "uploading",
      url: null,
      error: null
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Upload each file
    await Promise.all(
      selected.map(async (rawFile, idx) => {
        const fileId = newFiles[idx].id;
        const result = await uploadFile(rawFile);
        setFiles(prev =>
          prev.map(f => f.id === fileId ? { ...f, ...result } : f)
        );
        if (result.status === "error") {
          toast.error(result.error);
        }
      })
    );
  };

  const removeFile = (id) => setFiles(prev => prev.filter(f => f.id !== id));

  const isUploading = files.some(f => f.status === "uploading");
  const hasErrors = files.some(f => f.status === "error");
  const doneFiles = files.filter(f => f.status === "done");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.establishment_name || !formData.address || !formData.phone || !formData.document_info) {
      toast.error("Completa todos los campos obligatorios");
      return;
    }
    if (isUploading) {
      toast.error("Espera a que terminen de subir los archivos");
      return;
    }
    if (hasErrors) {
      toast.error("Hay archivos con error. Elimínalos antes de continuar");
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
        evidence_url: doneFiles.map(f => f.url).join(","),
        status: "pending"
      });
      await base44.auth.updateMe({ role: "dueño_pendiente" });
      setSubmitted(true);
    } catch {
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
          <CardHeader><CardTitle>Información del establecimiento</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nombre del establecimiento *</Label>
                <Input
                  value={formData.establishment_name}
                  onChange={(e) => setFormData(p => ({ ...p, establishment_name: e.target.value }))}
                  placeholder="Ej: Complejo Deportivo El Italiano"
                  required
                />
              </div>
              <div>
                <Label>Dirección *</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))}
                  placeholder="Dirección completa"
                  required
                />
              </div>
              <div>
                <Label>Teléfono *</Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+54 9 11 1234-5678"
                  required
                />
              </div>
              <div>
                <Label>Documento / Identificación *</Label>
                <Input
                  value={formData.document_info}
                  onChange={(e) => setFormData(p => ({ ...p, document_info: e.target.value }))}
                  placeholder="DNI, CUIT o número de identificación"
                  required
                />
              </div>

              {/* Multi-file upload */}
              <div>
                <Label>
                  Evidencias{" "}
                  <span className="text-muted-foreground text-xs">(foto del local, habilitación, etc.) — {ALLOWED_LABELS}, máx {MAX_SIZE_MB}MB c/u</span>
                </Label>

                {/* File list */}
                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map(f => (
                      <FileItem key={f.id} file={f} onRemove={removeFile} />
                    ))}
                  </div>
                )}

                {/* Upload button */}
                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-5 mt-2 transition-colors ${isUploading ? "opacity-60 cursor-not-allowed" : "cursor-pointer hover:bg-secondary active:bg-secondary"}`}>
                  <ImagePlus className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {files.length > 0 ? "Agregar más archivos" : "Seleccionar imágenes o PDF"}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    Podés elegir varios archivos a la vez • Cámara, galería o archivos
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                    multiple
                    capture={false}
                    onChange={handleFilesSelected}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {hasErrors && (
                  <Alert className="mt-2 border-destructive/50 bg-destructive/10">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <AlertDescription className="text-destructive">
                      Hay archivos con error. Eliminados antes de enviar o intenta subirlos nuevamente.
                    </AlertDescription>
                  </Alert>
                )}
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" asChild>
                  <a href={createPageUrl("Profile")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1" disabled={submitting || isUploading || hasErrors}>
                  {submitting
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Enviando...</>
                    : isUploading
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Subiendo archivos...</>
                    : "Enviar solicitud"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}