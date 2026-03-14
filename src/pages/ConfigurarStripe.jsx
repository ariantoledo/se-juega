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
import { toast } from "sonner";

export default function ConfigurarMercadoPago() {
  const [user, setUser] = useState(null);
  const [mercadopagoAccountId, setMercadopagoAccountId] = useState("");
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

  const updateEstablishmentMutation = useMutation({
    mutationFn: async ({ establishmentId, mercadopagoId }) => {
      await base44.entities.Establishment.update(establishmentId, {
        mercadopago_account_id: mercadopagoId
      });
    },
    onSuccess: () => {
      toast.success("Cuenta Mercado Pago vinculada exitosamente");
      queryClient.invalidateQueries(["my-establishments"]);
      setMercadopagoAccountId("");
    }
  });

  const hasMercadopagoConfigured = myEstablishments.some(e => e.mercadopago_account_id);

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
                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <p className="text-sm font-medium mb-1">ID de cuenta Mercado Pago</p>
                        <code className="text-xs text-muted-foreground">
                          {establishment.mercadopago_account_id}
                        </code>
                      </div>
                      <Alert>
                        <CheckCircle2 className="w-4 h-4" />
                        <AlertDescription>
                          Tu cuenta está lista para recibir pagos en ARS. El 90% del monto total de cada reserva llegará a tu cuenta automáticamente.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <Label>ID de cuenta Mercado Pago</Label>
                        <div className="flex gap-2 mt-1">
                          <Input
                            placeholder="123456789"
                            value={mercadopagoAccountId}
                            onChange={(e) => setMercadopagoAccountId(e.target.value)}
                          />
                          <Button
                            onClick={() => updateEstablishmentMutation.mutate({
                              establishmentId: establishment.id,
                              mercadopagoId: mercadopagoAccountId
                            })}
                            disabled={!mercadopagoAccountId}
                          >
                            Vincular
                          </Button>
                        </div>
                      </div>

                      <Alert>
                        <AlertCircle className="w-4 h-4" />
                        <AlertDescription className="space-y-2">
                          <p>Para obtener tu ID de cuenta Mercado Pago:</p>
                          <ol className="list-decimal list-inside text-xs space-y-1 ml-2">
                            <li>Crea una cuenta de vendedor en Mercado Pago</li>
                            <li>Completa el proceso de verificación</li>
                            <li>Obtén tu Access Token o User ID</li>
                            <li>Pégalo aquí para vincularlo</li>
                          </ol>
                          <Button variant="link" className="h-auto p-0 text-xs" asChild>
                            <a href="https://www.mercadopago.com.ar/developers" target="_blank" rel="noopener noreferrer">
                              Ir a Mercado Pago Developers <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                          </Button>
                        </AlertDescription>
                      </Alert>
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
              <p>El 90% restante se transfiere automáticamente a tu cuenta de Stripe</p>
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