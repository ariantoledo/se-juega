import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Calendar, DollarSign, MapPin, Pencil, Trash2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function MisCanchasContent() {
  const [user, setUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myEstablishments = [], isLoading: loadingEst } = useQuery({
    queryKey: ["my-establishments", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Establishment.list();
      return all.filter(e => e.owner_email === user.email);
    },
    enabled: !!user?.email
  });

  const { data: myFields = [], isLoading: loadingFields } = useQuery({
    queryKey: ["my-fields", user?.email],
    queryFn: async () => {
      const all = await base44.entities.FieldNew.list();
      return all.filter(f => f.owner_email === user.email);
    },
    enabled: !!user?.email
  });

  const { data: allReservations = [], isLoading: loadingRes } = useQuery({
    queryKey: ["owner-reservations", user?.email],
    queryFn: async () => {
      const all = await base44.entities.FieldNewReservation.list();
      const myFieldIds = myFields.map(f => f.id);
      return all.filter(r => myFieldIds.includes(r.field_new_id));
    },
    enabled: myFields.length > 0
  });

  const thisMonth = new Date();
  const monthReservations = allReservations.filter(r => {
    const resDate = new Date(r.created_date);
    return resDate.getMonth() === thisMonth.getMonth() &&
      resDate.getFullYear() === thisMonth.getFullYear();
  });

  const monthIncome = monthReservations
    .filter(r => r.payment_status === "paid")
    .reduce((sum, r) => sum + (r.owner_amount || 0), 0);

  const deleteEstablishmentMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.Establishment.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["my-establishments", user?.email] });
      const prev = queryClient.getQueryData(["my-establishments", user?.email]);
      queryClient.setQueryData(["my-establishments", user?.email], (old = []) =>
        old.filter(e => e.id !== id)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["my-establishments", user?.email], ctx?.prev);
      toast.error("Error al eliminar establecimiento");
    },
    onSuccess: () => {
      toast.success("Establecimiento eliminado");
      queryClient.invalidateQueries(["my-establishments"]);
    }
  });

  const deleteFieldMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.FieldNew.delete(id);
    },
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["my-fields", user?.email] });
      const prev = queryClient.getQueryData(["my-fields", user?.email]);
      queryClient.setQueryData(["my-fields", user?.email], (old = []) =>
        old.filter(f => f.id !== id)
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      queryClient.setQueryData(["my-fields", user?.email], ctx?.prev);
      toast.error("Error al eliminar cancha");
    },
    onSuccess: () => {
      toast.success("Cancha eliminada");
      queryClient.invalidateQueries(["my-fields"]);
    }
  });

  if (loadingEst || loadingFields || loadingRes) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 pb-20 md:pb-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col gap-3 mb-4 md:mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Mis Estadios</h1>
            <p className="text-sm md:text-base text-muted-foreground">Gestiona tus establecimientos y canchas</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" size="sm" className="w-full sm:w-auto" asChild>
              <a href={createPageUrl("ConfigurarStripe")}>Configurar Mercado Pago</a>
            </Button>
            <Button size="sm" className="w-full sm:w-auto" asChild>
              <a href={createPageUrl("RegistrarEstablecimiento")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nuevo Establecimiento
              </a>
            </Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-6">
          {/* Reservas */}
          <Card>
            <CardContent className="pt-4 md:pt-6 pb-3 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Reservas mes</p>
                  <p className="text-xl md:text-2xl font-bold">{monthReservations.length}</p>
                </div>
                <Calendar className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          {/* Ingresos */}
          <Card>
            <CardContent className="pt-4 md:pt-6 pb-3 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Ingresos</p>
                  <p className="text-lg md:text-2xl font-bold">ARS ${monthIncome.toLocaleString()}</p>
                </div>
                <DollarSign className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          {/* Establecimientos */}
          <Card>
            <CardContent className="pt-4 md:pt-6 pb-3 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Establecimientos</p>
                  <p className="text-xl md:text-2xl font-bold">{myEstablishments.length}</p>
                </div>
                <MapPin className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          {/* Canchas