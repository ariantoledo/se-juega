import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DollarSign, TrendingUp, Calendar, BarChart2, Link, CheckCircle2 } from "lucide-react";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";

const APP_COMMISSION = 2000;

export default function FinanceDashboard({ user }) {
  const [mpAccount, setMpAccount] = useState(user?.mp_admin_account || "");
  const [savingMp, setSavingMp] = useState(false);
  const [period, setPeriod] = useState("month"); // day | week | month | all

  const { data: reservations = [] } = useQuery({
    queryKey: ["admin-reservations"],
    queryFn: () => base44.entities.FieldNewReservation.list("-created_date"),
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

  const totalCommissions = filtered.length * APP_COMMISSION;
  const totalVolume = filtered.reduce((s, r) => s + (r.amount_paid || 0), 0);
  const avgPerDay = period === "all" && filtered.length > 0
    ? Math.round(totalCommissions / Math.max(1, Math.ceil((now - new Date(reservations[reservations.length - 1]?.created_date)) / 86400000)))
    : null;

  const handleSaveMp = async () => {
    setSavingMp(true);
    try {
      await base44.auth.updateMe({ mp_admin_account: mpAccount });
      toast.success("Cuenta de Mercado Pago guardada");
    } catch {
      toast.error("Error al guardar");
    }
    setSavingMp(false);
  };

  return (
    <div className="space-y-6">
      {/* App account section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Link className="w-4 h-4 text-primary" />
            Cuenta de la aplicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Ingresá el alias o CBU de tu cuenta de Mercado Pago donde se acreditarán las comisiones.
          </p>
          <div className="flex gap-2">
            <Input
              value={mpAccount}
              onChange={e => setMpAccount(e.target.value)}
              placeholder="Alias o CBU de Mercado Pago"
              className="flex-1"
            />
            <Button onClick={handleSaveMp} disabled={savingMp || !mpAccount}>
              {savingMp ? "Guardando..." : "Guardar"}
            </Button>
          </div>
          {user?.mp_admin_account && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <CheckCircle2 className="w-4 h-4" />
              Cuenta configurada: <strong>{user.mp_admin_account}</strong>
            </div>
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
                      <Badge variant="default" className="bg-primary text-xs">${APP_COMMISSION.toLocaleString()}</Badge>
                      <p className="text-xs text-muted-foreground">comisión</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-muted-foreground">${((r.amount_paid || 0) - APP_COMMISSION).toLocaleString()}</p>
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