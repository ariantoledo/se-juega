import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { field, slot, payment_type, app_base_url } = await req.json();

  const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
  if (!accessToken) return Response.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 });

  const amount = payment_type === "sena" ? field.precio_sena : field.precio_total;
  const commissionAmount = 2000;
  const ownerAmount = amount - commissionAmount;

  // Create reservation with pending_payment status
  const reservation = await base44.entities.FieldNewReservation.create({
    user_email: user.email,
    user_name: user.full_name,
    field_new_id: field.id,
    field_name: field.name,
    establishment_id: field.establishment_id,
    timeslot_id: slot.id,
    date: slot.date,
    start_time: slot.start_time,
    end_time: slot.end_time,
    payment_type,
    amount_paid: amount,
    precio_total: field.precio_total,
    commission_amount: commissionAmount,
    owner_amount: ownerAmount,
    reservation_status: "pending",
    payment_status: "pending"
  });

  // Block slot to prevent double booking
  await base44.entities.FieldNewTimeSlot.update(slot.id, { status: "reserved" });

  // Create Mercado Pago preference
  const prefBody = {
    items: [{
      title: `Reserva - ${field.name}`,
      description: `${slot.date} ${slot.start_time}-${slot.end_time} (${payment_type === "sena" ? "Seña" : "Pago total"})`,
      quantity: 1,
      unit_price: amount,
      currency_id: "ARS"
    }],
    back_urls: {
      success: `${app_base_url}/PaymentResult?status=success&reservation_id=${reservation.id}`,
      failure: `${app_base_url}/PaymentResult?status=failure&reservation_id=${reservation.id}`,
      pending: `${app_base_url}/PaymentResult?status=pending&reservation_id=${reservation.id}`
    },
    auto_return: "approved",
    external_reference: reservation.id,
    payer: { email: user.email }
  };

  const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(prefBody)
  });

  if (!prefRes.ok) {
    const err = await prefRes.text();
    // Rollback on failure
    await base44.entities.FieldNewReservation.delete(reservation.id);
    await base44.entities.FieldNewTimeSlot.update(slot.id, { status: "available" });
    return Response.json({ error: "Error creando preferencia de pago", details: err }, { status: 400 });
  }

  const prefData = await prefRes.json();

  // Save preference_id on reservation
  await base44.entities.FieldNewReservation.update(reservation.id, {
    mercadopago_payment_id: prefData.id
  });

  return Response.json({
    init_point: prefData.init_point,
    sandbox_init_point: prefData.sandbox_init_point,
    reservation_id: reservation.id,
    preference_id: prefData.id
  });
});