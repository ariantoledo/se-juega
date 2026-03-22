import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckCircle2, XCircle, Clock, User, MapPin, Phone, FileText, TrendingUp } from "lucide-react";
import FinanceDashboard from "../components/admin/FinanceDashboard";
import CommissionManager from "../components/admin/CommissionManager";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const statusConfig = {
  pending: { label: "Pendiente", variant: "secondary", icon: Clock },
  approved: { label: "Aprobado", variant: "default", icon: CheckCircle2 },
  rejected: { label: "Rechazado", variant: "destructive", icon: XCircle }
};

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(u => { setUser(u); setAdminUser(u); }).catch(() => {});
  }, []);

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ["owner-requests"],
    queryFn: () => base44.entities.OwnerRequest.list("-created_date"),
    enabled: user?.role === "admin"
  });

  const approveMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.OwnerRequest.update(request.id, { status: "approved" });
      const users = await base44.entities.User.list();
      const targetUser = users.find(u => u.email === request.user_email);
      if (targetUser) {
        await base44.entities.User.update(targetUser.id, { role: "dueño_verificado" });
      }
      await base44.integrations.Core.SendEmail({
        to: request.user_email,
        subject: "¡Tu cuenta fue verificada correctamente!",
        body: `Hola ${request.user_name},\n\nTu solicitud para gestionar el establecimiento "${request.establishment_name}" fue aprobada.\n\nYa puedes acceder a la sección Estadios y comenzar a crear y gestionar tus canchas.\n\n¡Bienvenido!`
      });
      await base44.functions.invoke("createNotification", {
        user_email: request.user_email,
        title: "✅ Solicitud aprobada",
        message: `Tu solicitud para "${request.establishment_name}" fue aprobada. ¡Ya podés gestionar tus canchas!`,
        type: "system",
        link: "/Estadios",
      });
    },
    onSuccess: () => {
      toast.success("Dueño aprobado y notificado");
      queryClient.invalidateQueries(["owner-requests"]);
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async (request) => {
      await base44.entities.OwnerRequest.update(request.id, { status: "rejected" });
      const users = await base44.entities.User.list();
      const targetUser = users.find(u => u.email === request.user_email);
      if (targetUser) {
        await base44.entities.User.update(targetUser.id, { role: "usuario_normal" });
      }
      await base44.integrations.Core.SendEmail({
        to: request.user_email,
        subject: "Solicitud de dueño rechazada",
        body: `Hola ${request.user_name},\n\nTu solicitud para gestionar el establecimiento "${request.establishment_name}" fue rechazada.\n\nSi crees que hay un error, por favor contáctanos.`
      });
      await base44.functions.invoke("createNotification", {
        user_email: request.user_email,
        title: "❌ Solicitud rechazada",
        message: `Tu solicitud para "${request.establishment_name}" fue rechazada. Contactanos si creés que hay un error.`,
        type: "system",
      });
    },
    onSuccess: () => {
      toast.success("Solicitud rechazada");
      queryClient.invalidateQueries(["owner-requests"]);
    }
  });

  if (!user) return null;

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="py-12 text-center">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Sin acceso</h2>
            <p className="text-muted-foreground">Solo administradores pueden acceder a este panel.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const pending = requests.filter(r => r.status === "pending");
  const approved = requests.filter(r => r.status === "approved");
  const rejected = requests.filter(r => r.status === "rejected");

  const RequestCard = ({ request }) => {
    const StatusIcon = statusConfig[request.status]?.icon || Clock;
    return (
      <Card className="mb-3">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold truncate">{request.user_name}</p>
                  <Badge variant={statusConfig[request.status]?.variant || "secondary"}>
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {statusConfig[request.status]?.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{request.user_email}</p>
              </div>
              <p className="text-xs text-muted-foreground shrink-0">
                {format(new Date(request.created_date), "d MMM", { locale: es })}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate"><strong>{request.establishment_name}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="truncate text-muted-foreground">{request.address}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground">{request.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="text-muted-foreground truncate">{request.document_info}</span>
              </div>
            </div>

            {request.evidence_url && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Evidencias adjuntas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {request.evidence_url.split(",").filter(Boolean).map((url, i) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={url}
                        alt={`Evidencia ${i + 1}`}
                        className="w-full h-28 object-cover rounded-lg border hover:opacity-90 transition-opacity"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div style={{display:'none'}} className="items-center gap-2 p-3 bg-secondary rounded-lg text-sm text-primary h-28 justify-center">
                        <FileText className="w-5 h-5" /> PDF {i + 1}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {request.status === "pending" && (
              <div className="flex gap-2 pt-1">
                <Button
                  className="flex-1"
                  size="sm"
                  onClick={() => approveMutation.mutate(request)}
                  disabled={approveMutation.isPending}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1" />
                  Aprobar
                </Button>
                <Button
                  className="flex-1"
                  size="sm"
                  variant="destructive"
                  onClick={() => rejectMutation.mutate(request)}
                  disabled={rejectMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Rechazar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-3 md:p-6 pb-24 md:pb-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Panel de Administración</h1>
          <p className="text-muted-foreground mt-1">Gestión de solicitudes de dueños de canchas</p>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="border-amber-200 dark:border-amber-800">
            <CardContent className="py-5 text-center">
              <div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center mx-auto mb-2">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-3xl font-bold text-amber-600">{pending.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Pendientes</p>
            </CardContent>
          </Card>
          <Card className="border-primary/30">
            <CardContent className="py-5 text-center">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
              <p className="text-3xl font-bold text-primary">{approved.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Aprobados</p>
            </CardContent>
          </Card>
          <Card className="border-destructive/20">
            <CardContent className="py-5 text-center">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-2">
                <XCircle className="w-4 h-4 text-destructive" />
              </div>
              <p className="text-3xl font-bold text-destructive">{rejected.length}</p>
              <p className="text-xs font-medium text-muted-foreground mt-0.5">Rechazados</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pending">
          <div className="overflow-x-auto pb-1 mb-4">
            <TabsList className="inline-flex w-auto min-w-full gap-1 h-auto p-1">
              <TabsTrigger value="pending" className="flex-1 flex items-center gap-1.5 py-2 text-xs sm:text-sm whitespace-nowrap">
                <Clock className="w-3.5 h-3.5 shrink-0" />
                Pendientes
                {pending.length > 0 && (
                  <span className="ml-1 min-w-[18px] h-[18px] rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center px-1">
                    {pending.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex-1 flex items-center gap-1.5 py-2 text-xs sm:text-sm whitespace-nowrap">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                Aprobados
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex-1 flex items-center gap-1.5 py-2 text-xs sm:text-sm whitespace-nowrap">
                <XCircle className="w-3.5 h-3.5 shrink-0" />
                Rechazados
              </TabsTrigger>
              <TabsTrigger value="finance" className="flex-1 flex items-center gap-1.5 py-2 text-xs sm:text-sm whitespace-nowrap">
                <TrendingUp className="w-3.5 h-3.5 shrink-0" />
                Finanzas
              </TabsTrigger>
              <TabsTrigger value="commissions" className="flex-1 flex items-center gap-1.5 py-2 text-xs sm:text-sm whitespace-nowrap">
                <User className="w-3.5 h-3.5 shrink-0" />
                Comisiones
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="pending">
            {isLoading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-32 bg-secondary rounded-xl animate-pulse" />)}</div>
            ) : pending.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay solicitudes pendientes</CardContent></Card>
            ) : pending.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>

          <TabsContent value="approved">
            {approved.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay solicitudes aprobadas</CardContent></Card>
            ) : approved.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>

          <TabsContent value="rejected">
            {rejected.length === 0 ? (
              <Card><CardContent className="py-12 text-center text-muted-foreground">No hay solicitudes rechazadas</CardContent></Card>
            ) : rejected.map(r => <RequestCard key={r.id} request={r} />)}
          </TabsContent>

          <TabsContent value="finance">
            <FinanceDashboard user={adminUser} />
          </TabsContent>

          <TabsContent value="commissions">
            <CommissionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}