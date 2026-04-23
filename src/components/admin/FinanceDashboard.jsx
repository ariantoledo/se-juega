import React, { useState } from "react";
import { safeArray } from "@/lib/safeArray";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingUp, Calendar, BarChart2, Link, CheckCircle2, AlertCircle } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const APP_COMMISSION = 2000;

export default function FinanceDashboard({ user }) {
  const [connecting, setConnecting] = useState(false);
  const [period, setPeriod] = useState("month"); // day | week | month | all

  const { data: reservations = [] } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: async () => safeArray(await base44.entities.FieldNewReservation.list("-created_date")),
  });

  const paidReservations = reservations.filter(r => r.payment_status === "paid");

  const now = new Date();
  const periodStart = period === "day" ? subDays(now, 1)
    : period === "week" ? startOfWeek(now, { locale: es })
    : period === "month" ? startOfMonth(now)
    : null;

  const filtered = periodStart
    ? paidReservations.filter(r => new Date(r.created_date) >= periodStart)
    : paidReservations;

  // Use actual stored commission_amount from each reservation (respects commission_enabled flag)
  const totalCommissions = filtered.reduce((s, r) => s + (r.commission_amount || 0), 0);
  const totalVolume = filtered.reduce((s, r) => s + (r.amount_paid || 0), 0);
  const avgPerDay = period === "all" && filtered.length > 0
    ? Math.round(totalCommissions / Math.max(1, Math.ceil((now - new Date(reservations[reservations.length - 1]?.created_date)) / 86400000)))
    : null;

  const handleConnectMP = async () => {
    setConnecting(true);
    try {
      const res = await base44.functions.invoke("mpGetAuthUrl", {
        establishment_id: "admin_account",
        redirect_uri: window.location.origin + "/MercadoPagoCallback"
      });
      window.location.href = res.data.auth_url;
    } catch {
      toast.error("Error al iniciar conexión con Mercado Pago.");
      setConnecting(false);
    }
  };

  const handleDisconnectMP = async () => {
    if (!confirm("¿Desconectar tu cuenta de Mercado Pago?")) return;
    try {
      await base44.auth.updateMe({ mp_admin_token: null, mp_admin_user_id: null });
      toast.success("Cuenta desconectada");
    } catch {
      toast.error("Error al desconectar");
    }
  };

  return (
    <div className="space-y-6">
      {/* Admin MP account section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="w-4 h-4 text-primary" />
            Mi cuenta de Mercado Pago (comisiones)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {user?.mp_admin_token ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">Cuenta conectada</p>
                  <p className="text-xs text-muted-foreground">Las comisiones de ARS $2.000 por reserva se acreditan automáticamente en tu cuenta.</p>
                  <code className="text-xs text-muted-foreground">ID: {user.mp_admin_user_id || "—"}</code>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleDisconnectMP}>
                Desconectar cuenta
              </Button>
            </>
          ) : (
            <>
              <div className="flex items-start gap-3 p-3 bg-secondary rounded-lg">
                <AlertCircle className="w-5 h-5 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  Conectá tu cuenta de Mercado Pago para recibir automáticamente las comisiones de cada reserva.
                </p>
              </div>
              <Button className="w-full" onClick={handleConnectMP} disabled={connecting}>
                {connecting ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />Conectando...</>
                ) : "Conectar mi Mercado Pago"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Period selector */}
      <div className="flex gap-2 flex-wrap">
        {[["day","Hoy"],["week","Semana"],["month","Mes"],["all","Todo"]].map(([v, l]) => (
          <Button
            key={v}
            size="sm"
            variant={period === v ? "default" : "outline"}
            onClick={() => setPeriod(v)}
          >
            {l}
          </Button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <DollarSign className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">${totalCommissions.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Comisiones cobradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <TrendingUp className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">${totalVolume.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Volumen total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <Calendar className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">{filtered.length}</p>
            <p className="text-xs text-muted-foreground">Reservas pagas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <BarChart2 className="w-5 h-5 text-primary mb-2" />
            <p className="text-2xl font-bold">${APP_COMMISSION.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Comisión por reserva</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Movimientos</CardTitle>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay transacciones en este período</p>
          ) : (
            <div className="space-y-2">
              {filtered.slice(0, 50).map(r => (
                <div key={r.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 p-3 rounded-lg bg-secondary/50 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{r.field_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.user_name} · {r.date} {r.start_time}</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="font-semibold">${(r.amount_paid || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">Total pagado</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="default" className="bg-primary text-xs">${(r.commission_amount || 0).toLocaleString()}</Badge>
                      <p className="text-xs text-muted-foreground">comisión</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-muted-foreground">${(r.owner_amount || 0).toLocaleString()}</p>
                      <p className="text-xs text-muted-foreground">al dueño</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}