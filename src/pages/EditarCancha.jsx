import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import MobileSelect from "@/components/ui/mobile-select";
import { Loader2, X, ImagePlus } from "lucide-react";
import { toast } from "sonner";

export default function EditarCancha() {
  const urlParams = new URLSearchParams(window.location.search);
  const fieldId = urlParams.get("id");
  const formRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: field, isLoading } = useQuery({
    queryKey: ["fieldnew-edit", fieldId],
    queryFn: async () => {
      const fields = await base44.entities.FieldNew.list();
      return fields.find(f => f.id === fieldId);
    },
    enabled: !!fieldId
  });

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (field && !form) {
      setForm({
        name: field.name || "",
        field_type: field.field_type || "futbol5",
        description: field.description || "",
        address: field.address || "",
        precio_total: field.precio_total || "",
        precio_sena: field.precio_sena || "",
        images: field.images || [],
      });
    }
  }, [field]);
  const [uploadingImage, setUploadingImage] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.FieldNew.update(fieldId, data);
    },
    onMutate: async (data) => {
      await queryClient.cancelQueries(["fieldnew-edit"]);
      const prev = queryClient.getQueryData(["fieldnew-edit", fieldId]);
      queryClient.setQueryData(["fieldnew-edit", fieldId], (old) => ({ ...old, ...data }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["fieldnew-edit", fieldId], ctx?.prev);
      toast.error("Error al actualizar cancha");
    },
    onSuccess: () => {
      toast.success("Cancha actualizada correctamente");
      queryClient.invalidateQueries(["my-fields"]);
      window.location.href = createPageUrl("Estadios");
    }
  });

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setForm(f => ({ ...f, images: [...(f.images || []), file_url] }));
    } catch {
      toast.error("Error al subir imagen");
    }
    setUploadingImage(false);
    e.target.value = "";
  };

  const removeImage = (idx) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.precio_total || !form.precio_sena) {
      toast.error("Completá los campos obligatorios");
      return;
    }
    updateMutation.mutate({
      ...form,
      precio_total: Number(form.precio_total),
      precio_sena: Number(form.precio_sena),
    });
  };

  if (isLoading || !form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!field) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-4">Cancha no encontrada</h2>
          <Button asChild><a href={createPageUrl("Estadios")}>Volver</a></Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 pb-24 md:pb-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Editar cancha</h1>
          <p className="text-muted-foreground mt-1">{field.name}</p>
        </div>

        <Card>
          <CardHeader><CardTitle>Datos de la cancha</CardTitle></CardHeader>
          <CardContent>
            <form ref={formRef} onSubmit={handleSubmit} className="space-y-4" onFocus={(e) => {
              if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
                setTimeout(() => e.target.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
              }
            }}>
              <div>
                <Label>Nombre *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Nombre de la cancha" required />
              </div>

              <div>
                <Label htmlFor="field-type">Tipo de cancha *</Label>
                <MobileSelect value={form.field_type} onValueChange={v => setForm(f => ({ ...f, field_type: v }))} id="field-type">
                  <option value="futbol5">Fútbol 5</option>
                  <option value="futbol7">Fútbol 7</option>
                  <option value="futbol11">Fútbol 11</option>
                </MobileSelect>
              </div>

              <div>
                <Label>Descripción</Label>
                <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descripción opcional" />
              </div>

              <div>
                <Label>Dirección</Label>
                <Input value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Dirección" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Precio total (ARS) *</Label>
                  <Input type="number" value={form.precio_total} onChange={e => setForm(f => ({ ...f, precio_total: e.target.value }))} placeholder="Ej: 10000" required />
                </div>
                <div>
                  <Label>Seña (ARS) *</Label>
                  <Input type="number" value={form.precio_sena} onChange={e => setForm(f => ({ ...f, precio_sena: e.target.value }))} placeholder="Ej: 3000" required />
                </div>
              </div>

              {/* Images */}
              <div>
                <Label>Imágenes</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {form.images.map((img, idx) => (
                    <div key={idx} className="relative">
                      <img src={img} alt="" className="w-full h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-destructive text-white rounded-full w-5 h-5 flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                    {uploadingImage
                      ? <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                      : <><ImagePlus className="w-5 h-5 text-muted-foreground" /><span className="text-xs text-muted-foreground mt-1">Agregar</span></>
                    }
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button type="button" variant="outline" className="flex-1" asChild>
                  <a href={createPageUrl("Estadios")}>Cancelar</a>
                </Button>
                <Button type="submit" className="flex-1" disabled={updateMutation.isPending}>
                  {updateMutation.isPending ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Guardando...</> : "Guardar cambios"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}