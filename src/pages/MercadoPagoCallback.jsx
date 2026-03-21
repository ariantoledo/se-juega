import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

export default function MercadoPagoCallback() {
  const [status, setStatus] = useState("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const establishmentId = params.get("state");
    const adminFlow = establishmentId === 'admin_account';
    setIsAdmin(adminFlow);

    if (!code || !establishmentId) {
      setStatus("error");
      setErrorMsg("Faltan parámetros de autorización. La conexión fue cancelada.");
      return;
    }

    base44.functions.invoke("mpOAuthCallback", {
      code,
      establishment_id: establishmentId,
      redirect_uri: window.location.origin + "/MercadoPagoCallback"
    }).then(() => {
      setStatus("success");
    }).catch(err => {
      setStatus("error");
      setErrorMsg(err?.response?.data?.details || err?.response?.data?.error || "Error al conectar con Mercado Pago. Intentá de nuevo.");
    });
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="py-12 text-center space-y-4">
          {status === "loading" && (
            <>
              <Loader2 className="w-12 h-12 text-primary mx-auto animate-spin" />
              <h2 className="text-xl font-bold">Conectando con Mercado Pago...</h2>
              <p className="text-muted-foreground">Guardando tu cuenta, por favor esperá.</p>
            </>
          )}
          {status === "success" && (
            <>
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto" />
              <h2 className="text-xl font-bold">¡Cuenta conectada!</h2>
              <p className="text-muted-foreground">
                {isAdmin
                  ? "Tu cuenta de Mercado Pago fue vinculada correctamente. Las comisiones se acreditarán automáticamente."
                  : "Tu cuenta de Mercado Pago fue vinculada correctamente. Ya podés recibir pagos."
                }
              </p>
              <Button className="w-full" asChild>
                <a href={isAdmin ? "/AdminPanel" : createPageUrl("ConfigurarStripe")}>
                  {isAdmin ? "Volver al panel" : "Volver a configuración"}
                </a>
              </Button>
            </>
          )}
          {status === "error" && (
            <>
              <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
              <h2 className="text-xl font-bold">Error al conectar</h2>
              <p className="text-muted-foreground">{errorMsg}</p>
              <Button variant="outline" className="w-full" asChild>
                <a href={createPageUrl("ConfigurarStripe")}>Volver a intentar</a>
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}