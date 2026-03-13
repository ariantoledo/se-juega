import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, TrendingUp, Calendar, DollarSign, MapPin } from "lucide-react";

export default function MisCanchas() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: myEstablishments = [] } = useQuery({
    queryKey: ["my-establishments", user?.email],
    queryFn: async () => {
      const all = await base44.entities.Establishment.list();
      return all.filter(e => e.owner_email === user.email);
    },
    enabled: !!user?.email
  });

  const { data: myFields = [] } = useQuery({
    queryKey: ["my-fields", user?.email],
    queryFn: async () => {
      const all = await base44.entities.FieldNew.list();
      return all.filter(f => f.owner_email === user.email);
    },
    enabled: !!user?.email
  });

  const { data: allReservations = [] } = useQuery({
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Mis Canchas</h1>
            <p className="text-muted-foreground">Gestiona tus establecimientos y canchas</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <a href={createPageUrl("ConfigurarStripe")}>
                Configurar pagos
              </a>
            </Button>
            <Button asChild>
              <a href={createPageUrl("RegistrarEstablecimiento")}>
                <PlusCircle className="w-4 h-4 mr-2" />
                Nuevo Establecimiento
              </a>
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Reservas del mes</p>
                  <p className="text-2xl font-bold">{monthReservations.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Ingresos del mes</p>
                  <p className="text-2xl font-bold">${monthIncome.toLocaleString()}</p>
                </div>
                <DollarSign className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Establecimientos</p>
                  <p className="text-2xl font-bold">{myEstablishments.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total canchas</p>
                  <p className="text-2xl font-bold">{myFields.length}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="canchas">
          <TabsList className="mb-4">
            <TabsTrigger value="canchas">Canchas</TabsTrigger>
            <TabsTrigger value="reservas">Reservas</TabsTrigger>
            <TabsTrigger value="establecimientos">Establecimientos</TabsTrigger>
          </TabsList>

          <TabsContent value="canchas">
            {myEstablishments.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Primero registra un establecimiento</h3>
                  <p className="text-muted-foreground mb-4">Luego podrás agregar canchas dentro de cada establecimiento</p>
                  <Button asChild>
                    <a href={createPageUrl("RegistrarEstablecimiento")}>
                      <PlusCircle className="w-4 h-4 mr-2" />
                      Registrar mi primer establecimiento
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : myFields.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Ahora agrega tus canchas</h3>
                  <p className="text-muted-foreground mb-4">Ve abajo y haz clic en "Agregar cancha" en tu establecimiento</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {myEstablishments.map(est => {
                  const estFields = myFields.filter(f => f.establishment_id === est.id);
                  return (
                    <Card key={est.id}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div>
                            <CardTitle>{est.name}</CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">{est.address}</p>
                          </div>
                          <Button size="sm" asChild>
                            <a href={createPageUrl(`RegistrarCancha?establishment_id=${est.id}`)}>
                              <PlusCircle className="w-4 h-4 mr-1" />
                              Agregar cancha
                            </a>
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {estFields.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            No hay canchas en este establecimiento
                          </p>
                        ) : (
                          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {estFields.map(field => (
                              <div key={field.id} className="p-3 bg-secondary rounded-lg">
                                <p className="font-medium mb-2">{field.name}</p>
                                <div className="space-y-1 text-xs mb-3">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Tipo</span>
                                    <span>{field.field_type}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Precio</span>
                                    <span>${field.precio_total.toLocaleString()}</span>
                                  </div>
                                </div>
                                <Button variant="outline" size="sm" className="w-full" asChild>
                                  <a href={createPageUrl(`GestionarCancha?id=${field.id}`)}>
                                    Gestionar
                                  </a>
                                </Button>
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
                <CardTitle>Reservas recientes</CardTitle>
              </CardHeader>
              <CardContent>
                {allReservations.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No hay reservas aún</p>
                ) : (
                  <div className="space-y-3">
                    {allReservations.slice(0, 10).map(res => (
                      <div key={res.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                        <div>
                          <p className="font-medium">{res.field_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {res.user_name} • {res.date} {res.start_time}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${res.amount_paid.toLocaleString()}</p>
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
                <CardContent className="py-12 text-center">
                  <h3 className="text-lg font-semibold mb-2">No tienes establecimientos</h3>
                  <Button asChild>
                    <a href={createPageUrl("RegistrarEstablecimiento")}>
                      Crear establecimiento
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {myEstablishments.map(est => (
                  <Card key={est.id}>
                    <CardHeader>
                      <CardTitle>{est.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">{est.address}</p>
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <a href={createPageUrl(`EditarEstablecimiento?id=${est.id}`)}>
                          Editar
                        </a>
                      </Button>
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