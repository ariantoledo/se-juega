import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { createPageUrl } from "@/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Clock, XCircle } from "lucide-react";
import MisCanchasContent from "../components/estadios/MisCanchasContent";

export default function Estadios() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  // usuario_normal o sin rol definido
  if (!user?.role || user.role === "usuario_normal" || user.role === "user") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Shield className="w-14 h-14 text-muted-foreground mx-auto" />
            <h2 className="text-xl font-bold">Acceso restringido</h2>
            <p className="text-muted-foreground">
              Debes registrarte como dueño para acceder a esta sección.
            </p>
            <Button className="w-full" asChild>
              <a href={createPageUrl("RegistrarDueno")}>Registrarme como dueño</a>
            </Button>
            <Button variant="outline" className="w-full" asChild>
              <a href={createPageUrl("Profile")}>Volver al perfil</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // dueño_pendiente
  if (user.role === "dueño_pendiente") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center space-y-4">
            <Clock className="w-14 h-14 text-accent mx-auto" />
            <h2 className="text-xl font-bold">Solicitud en revisión</h2>
            <p className="text-muted-foreground">
              Tu solicitud está en revisión. Te notificaremos por email cuando sea aprobada.
              Mientras tanto no puedes crear canchas ni gestionar reservas.
            </p>
            <Button variant="outline" className="w-full" asChild>
              <a href={createPageUrl("Profile")}>Volver al perfil</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // dueño_verificado o admin → acceso completo
  return <MisCanchasContent />;
}