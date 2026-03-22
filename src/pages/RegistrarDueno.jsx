import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, CheckCircle2, Loader2, Clock, AlertCircle, X, ImagePlus, FileText } from "lucide-react";
import { toast } from "sonner";

const MAX_SIZE_MB = 5;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/jpg", "image/webp", "application/pdf"];

function FileItem({ file, onRemove }) {
  const [imgError, setImgError] = useState(false);
  const isImage = file.type?.startsWith("image/");
  const isPdf = file.type === "application/pdf";

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

      {file.status === "done" && file.url && isImage && !imgError && (
        <img
          src={file.url}
          alt={file.name}
          className="w-12 h-12 object-cover rounded shrink-0"
          onError={() => setImgError(true)}
        />
      )}
      {file.status === "done" && (isPdf || imgError) && (
        <div className="w-12 h-12 bg-muted rounded shrink-0 flex items-center justify-center">
          <FileText className="w-5 h-5 text-muted-foreground" />
        </div>
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
  const [loadingUser, setLoadingUser] = useState(true);
  const [existingRequest, setExistingRequest] = useState(null);
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
    async function init() {
      try {
        const me = await base44.auth.me();
        setUser(me);
        // Check for existing request to prevent duplicates
        const allRequests = await base44.entities.OwnerRequest.list();
        const myRequest = allRequests.find(r => r.user_email === me.email);
        if (myRequest) setExistingRequest(myRequest);
      } catch {
        // ignore
      } finally {
        setLoadingUser(false);
      }
    }
    init();
  }, []);

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // Already has pending/approved request OR role is pending
  const isPending = user?.role === "dueño_pendiente" || existingRequest?.status === "pending";
  const isApproved = user?.role === "dueño_verificado" || user?.role === "admin" || existingRequest?.status === "approved";

  if (isApproved) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-primary mx-auto" />
            <h2 className="text-2xl font-bold">¡Ya estás verificado!</h2>
            <p className="text-muted-foreground">Tu cuenta ya está aprobada. Podés gestionar tus establecimientos.</p>
            <Button asChild className="w-full"><a href={createPageUrl("Estadios")}>Ir a Estadios</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isPending || submitted) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Clock className="w-16 h-16 text-accent mx-auto" />
            <h2 className="text-2xl font-bold">{submitted ? "¡Solicitud enviada!" : "Solicitud en revisión"}</h2>
            <div className="p-4 bg-muted rounded-lg text-left space-y-2">
              <p className="font-medium text-sm">Tu solicitud fue enviada correctamente y está en revisión.</p>
              <p className="text-sm text-muted-foreground">
                Nuestro equipo revisará tu información y te notificará por email cuando sea aprobada.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">Mientras tanto no podés acceder a las funciones de dueño.</p>
            <Button asChild className="w-full"><a href={createPageUrl("Home")}>Entendido, volver al inicio</a></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleFilesSelected = async (e) => {
    const selected = Array.from(e.target.files || []);
    if (!selected.length) return;
    // Reset input so same file can be re-selected after error
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

    await Promise.all(
      selected.map(async (rawFile, idx) => {
        const fileId = newFiles[idx].id;

        if (!ALLOWED_TYPES.includes(rawFile.type)) {
          setFiles(prev => prev.map(f => f.id === fileId
            ? { ...f, status: "error", error: "Formato no permitido (JPG, PNG, PDF)" }
            : f));
          return;
        }
        if (rawFile.size > MAX_SIZE_MB * 1024 * 1024) {
          setFiles(prev => prev.map(f => f.id === fileId
            ? { ...f, status: "error", error: `Archivo muy grande (máx ${MAX_SIZE_MB}MB)` }
            : f));
          return;
        }

        try {
          const { file_url } = await base44.integrations.Core.UploadFile({ file: rawFile });
          if (!file_url) throw new Error("Sin URL");
          setFiles(prev => prev.map(f => f.id === fileId ? { ...f, status: "done", url: file_url } : f));
        } catch {
          setFiles(prev => prev.map(f => f.id === fileId
            ? { ...f, status: "error", error: "Error al subir. Intenta nuevamente." }
            : f));
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
    if (isUploading) { toast.error("Espera a que terminen de subir los archivos"); return; }
    if (hasErrors) { toast.error("Hay archivos con error. Elimínalos antes de continuar"); return; }

    setSubmitting(true);
    try {
      const evidenceUrl = doneFiles.map(f => f.url).join(",");

      // Check again for existing request (race condition protection)
      const allRequests = await base44.entities.OwnerRequest.list();
      const existing = allRequests.find(r => r.user_email === user.email);

      if (existing) {
        // Update existing instead of creating duplicate
        await base44.entities.OwnerRequest.update(existing.id, {
          establishment_name: formData.establishment_name,
          address: formData.address,
          phone: formData.phone,
          document_info: formData.document_info,
          evidence_url: evidenceUrl,
          status: "pending"
        });
      } else {
        await base44.entities.OwnerRequest.create({
          user_email: user.email,
          user_name: user.full_name,
          establishment_name: formData.establishment_name,
          address: formData.address,
          phone: formData.phone,
          document_info: formData.document_info,
          evidence_url: evidenceUrl,
          status: "pending"
        });
      }

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

        <Alert className="mb-4">
          <AlertDescription>
            Tu solicitud será revisada por nuestro equipo. Una vez aprobada, podrás crear y gestionar tus establecimientos.
          </AlertDescription>
        </Alert>

        {/* Política de comisión */}
        <Card className="mb-6 border-primary/20 bg-primary/5">
          <CardContent className="pt-5 pb-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground text-sm">Política de comisión de la plataforma</p>
                <p className="text-xs text-muted-foreground">Aplicable a todas las reservas gestionadas</p>
              </div>
            </div>
            <div className="bg-background rounded-xl p-4 flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">Comisión fija por reserva confirmada</span>
              <span className="text-xl font-bold text-primary">$2.000 ARS</span>
            </div>
            <ul className="space-y-1.5">
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                Se descuenta automáticamente de cada reserva procesada con Mercado Pago.
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                El resto del monto se acredita directamente en tu cuenta vinculada.
              </li>
              <li className="flex items-start gap-2 text-xs text-muted-foreground">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                Al enviar esta solicitud aceptás estos términos.
              </li>
            </ul>
          </CardContent>
        </Card>

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

              <div>
                <Label>
                  Evidencias{" "}
                  <span className="text-muted-foreground text-xs">(foto del local, habilitación, etc.) — JPG, PNG, PDF — máx {MAX_SIZE_MB}MB c/u</span>
                </Label>

                {files.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {files.map(f => <FileItem key={f.id} file={f} onRemove={removeFile} />)}
                  </div>
                )}

                <label className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg p-5 mt-2 transition-colors ${isUploading ? "opacity-60 cursor-not-allowed bg-muted" : "cursor-pointer hover:bg-secondary"}`}>
                  <ImagePlus className="w-7 h-7 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {files.length > 0 ? "Agregar más archivos" : "Seleccionar imágenes o PDF"}
                  </span>
                  <span className="text-xs text-muted-foreground text-center">
                    Podés elegir varios a la vez • Cámara, galería o archivos
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp,application/pdf"
                    multiple
                    onChange={handleFilesSelected}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>

                {hasErrors && (
                  <Alert className="mt-2 border-destructive/50 bg-destructive/5">
                    <AlertCircle className="w-4 h-4 text-destructive" />
                    <AlertDescription className="text-destructive text-sm">
                      Eliminá los archivos con error antes de enviar.
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