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
          <Card>
            <CardContent className="pt-4 md:pt-6 pb-3 md:pb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground leading-tight">Total canchas</p>
                  <p className="text-xl md:text-2xl font-bold">{myFields.length}</p>
                </div>
                <TrendingUp className="w-6 h-6 md:w-8 md:h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="canchas">
          <TabsList className="mb-4">
            <TabsTrigger value="canchas">Canchas</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="establecimientos">Establecimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="canchas">
            {myEstablishments.length === 0 ? (
              <Card>
                <CardContent className="py-8 md:py-12 px-4 text-center">
                  <MapPin className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-2">Primero registra un establecimiento</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">Luego podrás agregar canchas dentro de cada establecimiento</p>
                  <Button size="sm" className="w-full sm:w-auto" asChild>
                    <a href={createPageUrl("RegistrarEstablecimiento")}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Registrar establecimiento
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : myFields.length === 0 ? (
              <Card>
                <CardContent className="py-8 md:py-12 px-4 text-center">
                  <MapPin className="w-10 h-10 md:w-12 md:h-12 mx-auto text-muted-foreground mb-3 md:mb-4" />
                  <h3 className="text-base md:text-lg font-semibold mb-2">Ahora agrega tus canchas</h3>
                  <p className="text-sm md:text-base text-muted-foreground mb-4">Haz clic en "Agregar Cancha" en tu establecimiento abajo</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 md:space-y-4">
                {myEstablishments.map(est => {
                  const estFields = myFields.filter(f => f.establishment_id === est.id);
                  return (
                    <Card key={est.id}>
                      <CardHeader className="pb-3 md:pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <CardTitle className="text-lg md:text-xl truncate">{est.name}</CardTitle>
                            <p className="text-xs md:text-sm text-muted-foreground mt-1 line-clamp-1">{est.address}</p>
                          </div>
                          {est.mercadopago_account_id ? (
                            <Button size="sm" className="w-full sm:w-auto shrink-0" asChild>
                              <a href={createPageUrl(`RegistrarCancha?establishment_id=${est.id}`)}>
                                <PlusCircle className="w-4 h-4 mr-1" />
                                Agregar Cancha
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" className="w-full sm:w-auto shrink-0 border-destructive/50 text-destructive" asChild>
                              <a href={createPageUrl("ConfigurarStripe")}>
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Conectar Mercado Pago
                              </a>
                            </Button>
                          )}
                        </div>
                        {!est.mercadopago_account_id && (
                          <div className="mt-2 p-3 bg-destructive/10 rounded-lg border border-destructive/20 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                            <p className="text-xs text-destructive font-medium">Para gestionar este establecimiento, primero conecte una cuenta de Mercado Pago.</p>
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="pt-0">
                        {estFields.length === 0 ? (
                          <p className="text-xs md:text-sm text-muted-foreground text-center py-4">
                            No hay canchas en este establecimiento
                          </p>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 md:gap-3">
                            {estFields.map(field => (
                              <div key={field.id} className="p-3 bg-secondary rounded-lg">
                                <p className="font-medium mb-2 text-sm md:text-base truncate">{field.name}</p>
                                <div className="space-y-1 text-xs mb-3">
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground shrink-0">Tipo</span>
                                    <span className="truncate">{field.field_type}</span>
                                  </div>
                                  <div className="flex justify-between gap-2">
                                    <span className="text-muted-foreground shrink-0">Precio</span>
                                    <span className="truncate">ARS ${(field.precio_total || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                  {est.mercadopago_account_id ? (
                                    <>
                                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                        <a href={createPageUrl(`GestionarCancha?id=${field.id}`)}>Gestionar</a>
                                      </Button>
                                      <Button variant="outline" size="sm" className="w-full text-xs" asChild>
                                        <a href={createPageUrl(`EditarCancha?id=${field.id}`)}>
                                          <Pencil className="w-3 h-3 mr-1" />Editar
                                        </a>
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="w-full text-xs text-destructive hover:bg-destructive/10"
                                        onClick={() => {
                                          if (confirm(`¿Eliminar la cancha "${field.name}"? Esta acción no se puede deshacer.`)) {
                                            deleteFieldMutation.mutate(field.id);
                                          }
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 mr-1" />Eliminar
                                      </Button>
                                    </>
                                  ) : (
                                    <p className="text-xs text-muted-foreground text-center py-2">Conectá Mercado Pago para gestionar esta cancha</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="reservas">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg md:text-xl">Reservas recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {allReservations.length === 0 ? (
                  <p className="text-center text-sm text-muted-foreground py-8">No hay reservas aún</p>
                ) : (
                  <div className="space-y-2 md:space-y-3">
                    {allReservations.slice(0, 10).map(res => (
                      <div key={res.id} className="flex items-start sm:items-center justify-between gap-3 p-3 bg-secondary rounded-lg">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm md:text-base truncate">{res.field_name}</p>
                          <p className="text-xs md:text-sm text-muted-foreground line-clamp-1">
                            {res.user_name} • {res.date} {res.start_time}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-semibold text-sm md:text-base">ARS ${(res.amount_paid || 0).toLocaleString()}</p>
                          <p className="text-xs text-muted-foreground">{res.reservation_status}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="establecimientos">
            {myEstablishments.length === 0 ? (
              <Card>
                <CardContent className="py-8 md:py-12 px-4 text-center">
                  <h3 className="text-base md:text-lg font-semibold mb-2">No tienes establecimientos</h3>
                  <Button size="sm" className="w-full sm:w-auto" asChild>
                    <a href={createPageUrl("RegistrarEstablecimiento")}>Crear establecimiento</a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {myEstablishments.map(est => (
                  <Card key={est.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg md:text-xl truncate">{est.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">{est.address}</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1 text-xs md:text-sm" asChild>
                          <a href={createPageUrl(`EditarEstablecimiento?id=${est.id}`)}>Editar</a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Eliminar establecimiento ${est.name}`}
                          className="text-destructive hover:bg-destructive/10 px-3"
                          onClick={() => {
                            if (confirm(`¿Eliminar "${est.name}"? Se perderán todos sus datos.`)) {
                              deleteEstablishmentMutation.mutate(est.id);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}