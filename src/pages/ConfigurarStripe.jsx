import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createPageUrl } from "@/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function ConfigurarMercadoPago() {
  const [user, setUser] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const queryClient = useQueryClient();

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

  const connectMercadoPago = async (establishmentId) => {
    setConnecting(true);
    try {
      // Simular conexión OAuth con Mercado Pago
      // En producción, esto redireccionaría a la página de autorización de Mercado Pago
      const authUrl = `https://auth.mercadopago.com/authorization?client_id=YOUR_CLIENT_ID&response_type=code&platform_id=mp&state=${establishmentId}&redirect_uri=${window.location.origin}/callback`;
      
      // Por ahora, simulamos la conexión exitosa
      const mockAccessToken = `MP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await base44.entities.Establishment.update(establishmentId, {
        mercadopago_account_id: mockAccessToken
      });
      
      queryClient.invalidateQueries(["my-establishments"]);
      toast.success("¡Cuenta de Mercado Pago conectada exitosamente!");
    } catch (error) {
      toast.error("Error al conectar con Mercado Pago");
    } finally {
      setConnecting(false);
    }
  };

  const disconnectMercadoPago = async (establishmentId) => {
    try {
      await base44.entities.Establishment.update(establishmentId, {
        mercadopago_account_id: null
      });
      queryClient.invalidateQueries(["my-establishments"]);
      toast.success("Cuenta desconectada");
    } catch (error) {
      toast.error("Error al desconectar");
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Configuración de Mercado Pago</h1>

        <Alert className="mb-6">
          <AlertCircle className="w-4 h-4" />
          <AlertDescription>
            Para recibir pagos de las reservas, necesitas vincular tu cuenta de Mercado Pago.
            La aplicación cobrará una comisión del 10% sobre el monto total de cada reserva.
            Los pagos se procesan en pesos argentinos (ARS).
          </AlertDescription>
        </Alert>

        {myEstablishments.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <h3 className="text-lg font-semibold mb-2">No tienes establecimientos</h3>
              <p className="text-muted-foreground mb-4">
                Primero debes crear un establecimiento para configurar pagos
              </p>
              <Button asChild>
                <a href={createPageUrl("RegistrarEstablecimiento")}>
                  Crear establecimiento
                </a>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {myEstablishments.map(establishment => (
              <Card key={establishment.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{establishment.name}</span>
                    {establishment.mercadopago_account_id && (
                      <div className="flex items-center gap-2 text-sm font-normal text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        Configurado
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {establishment.mercadopago_account_id ? (
                    <div className="space-y-4">
                      <Alert className="border-primary/50 bg-primary/5">
                        <CheckCircle2 className="w-4 h-4 text-primary" />
                        <AlertDescription>
                          <p className="font-semibold text-primary mb-1">Mercado Pago conectado</p>
                          <p className="text-sm">Tu cuenta está lista para recibir pagos. El 90% del monto total de cada reserva llegará automáticamente a tu cuenta de Mercado Pago.</p>
                        </AlertDescription>
                      </Alert>

                      <div className="p-4 bg-secondary rounded-lg space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Estado</span>
                          <Badge variant="default" className="bg-primary">
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Activo
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Token</span>
                          <code className="text-xs">***{establishment.mercadopago_account_id.slice(-8)}</code>
                        </div>
                      </div>

                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => {
                          if (confirm("¿Estás seguro de desconectar Mercado Pago? Ya no podrás recibir pagos hasta que vuelvas a conectar.")) {
                            disconnectMercadoPago(establishment.id);
                          }
                        }}
                      >
                        Desconectar Mercado Pago
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription>
                          <p className="font-medium mb-2">Conectá tu cuenta de Mercado Pago</p>
                          <p className="text-sm">
                            Hace clic en "Conectar con Mercado Pago" para autorizar que la aplicación procese pagos en tu nombre. Es rápido y seguro.
                          </p>
                        </AlertDescription>
                      </Alert>

                      <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0 mt-0.5">
                            1
                          </div>
                          <div>
                            <p className="text-sm font-medium">Hacé clic en conectar</p>
                            <p className="text-xs text-muted-foreground">Se abrirá la página de Mercado Pago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0 mt-0.5">
                            2
                          </div>
                          <div>
                            <p className="text-sm font-medium">Iniciá sesión</p>
                            <p className="text-xs text-muted-foreground">Usá tu cuenta de Mercado Pago</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0 mt-0.5">
                            3
                          </div>
                          <div>
                            <p className="text-sm font-medium">Autorizá la aplicación</p>
                            <p className="text-xs text-muted-foreground">¡Listo! Ya podés recibir pagos</p>
                          </div>
                        </div>
                      </div>

                      <Button 
                        className="w-full h-12 text-base"
                        onClick={() => connectMercadoPago(establishment.id)}
                        disabled={connecting}
                      >
                        {connecting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Conectando...
                          </>
                        ) : (
                          <>
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                            </svg>
                            Conectar con Mercado Pago
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Información sobre comisiones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>La aplicación cobra un 10% de comisión sobre el precio total de cada cancha</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>El 90% restante se transfiere automáticamente a tu cuenta de Mercado Pago</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>Los pagos se procesan de forma segura a través de Mercado Pago en pesos argentinos (ARS)</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>Puedes ver el historial de pagos en tu panel de Mercado Pago</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
              <p>La comisión del 10% se calcula sobre el precio total, independientemente de si el cliente paga seña o total</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}