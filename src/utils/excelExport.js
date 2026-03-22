import XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export async function exportEstablishmentStats(establishment, fields, reservations) {
  const now = new Date();
  const timestamp = format(now, "dd/MM/yyyy HH:mm:ss", { locale: es });

  const wb = XLSX.utils.book_new();

  // Hoja 1: Resumen por cancha
  const summaryData = fields.map(field => {
    const fieldReservations = reservations.filter(r => r.field_new_id === field.id);
    const totalIncome = fieldReservations
      .filter(r => r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.owner_amount || 0), 0);
    
    return {
      'Cancha': field.name,
      'Tipo': field.field_type,
      'Total Reservas': fieldReservations.length,
      'Reservas Confirmadas': fieldReservations.filter(r => r.reservation_status === 'confirmed').length,
      'Ganancias (ARS)': totalIncome.toLocaleString('es-AR'),
    };
  });

  const ws1 = XLSX.utils.json_to_sheet(summaryData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Resumen Canchas');

  // Hoja 2: Horarios pico (por cancha)
  const peakHours = [];
  fields.forEach(field => {
    const fieldReservations = reservations.filter(r => r.field_new_id === field.id);
    
    // Contar reservas por hora
    const hourCounts = {};
    fieldReservations.forEach(res => {
      const hour = res.start_time.substring(0, 2);
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Top 3 horas
    const sorted = Object.entries(hourCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sorted.forEach((item, idx) => {
      peakHours.push({
        'Cancha': field.name,
        'Posición': idx + 1,
        'Hora': `${item[0]}:00 - ${item[0]}:59`,
        'Cantidad Reservas': item[1],
      });
    });
  });

  const ws2 = XLSX.utils.json_to_sheet(peakHours);
  ws2['!cols'] = [{ wch: 20 }, { wch: 12 }, { wch: 18 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, ws2, 'Horarios Pico');

  // Hoja 3: Info
  const infoWs = XLSX.utils.json_to_sheet([
    { Establecimiento: establishment.name, 'Fecha Generación': timestamp },
  ]);
  XLSX.utils.book_append_sheet(wb, infoWs, 'Info');

  const filename = `Estadios_${establishment.name.replace(/\s+/g, '_')}_${format(now, 'yyyy-MM-dd_HHmmss')}.xlsx`;
  XLSX.writeFile(wb, filename);
}

export async function exportFieldDayStats(field, selectedDate, reservations) {
  const now = new Date();
  const timestamp = format(now, "dd/MM/yyyy HH:mm:ss", { locale: es });
  const dateStr = format(new Date(selectedDate), 'PPP', { locale: es });

  const dayReservations = reservations.filter(r => r.field_new_id === field.id && r.date === format(new Date(selectedDate), 'yyyy-MM-dd'));

  const wb = XLSX.utils.book_new();

  // Hoja 1: Reservas del día
  const reservationData = dayReservations.map(res => ({
    'Usuario': res.user_name,
    'Email': res.user_email,
    'Horario': `${res.start_time} - ${res.end_time}`,
    'Monto Pagado (ARS)': res.amount_paid.toLocaleString('es-AR'),
    'Estado': res.reservation_status === 'confirmed' ? 'Confirmada' : 'Pendiente',
    'Tipo Pago': res.payment_type === 'sena' ? 'Seña' : 'Total',
  }));

  const ws1 = XLSX.utils.json_to_sheet(reservationData);
  ws1['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 18 }, { wch: 16 }, { wch: 13 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, ws1, 'Reservas');

  // Hoja 2: Resumen
  const totalIncome = dayReservations
    .filter(r => r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.owner_amount || 0), 0);

  const summaryWs = XLSX.utils.json_to_sheet([
    { Cancha: field.name, Fecha: dateStr },
    { 'Generado': timestamp },
    { 'Total Reservas': dayReservations.length },
    { 'Reservas Confirmadas': dayReservations.filter(r => r.reservation_status === 'confirmed').length },
    { 'Total Ganancias (ARS)': totalIncome.toLocaleString('es-AR') },
  ]);
  XLSX.utils.book_append_sheet(wb, summaryWs, 'Resumen');

  const filename = `${field.name}_${format(new Date(selectedDate), 'yyyy-MM-dd')}.xlsx`;
  XLSX.writeFile(wb, filename);
}