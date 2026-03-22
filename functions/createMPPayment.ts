import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { field, slot, payment_type, app_base_url, match_id } = await req.json();

    // Get owner's MP access token from establishment
    const establishment = await base44.asServiceRole.entities.Establishment.filter({ id: field.establishment_id });
    const ownerAccessToken = establishment[0]?.mercadopago_account_id;
    if (!ownerAccessToken) {
      return Response.json({ error: 'El dueño no tiene Mercado Pago configurado' }, { status: 400 });
    }

    const COMMISSION = 2000;
    const amount = payment_type === "sena" ? field.precio_sena : field.precio_total;
    const ownerAmount = amount - COMMISSION;

    // Create reservation with pending status
    const reservation = await base44.asServiceRole.entities.FieldNewReservation.create({
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
      commission_amount: COMMISSION,
      owner_amount: ownerAmount,
      reservation_status: "pending",
      payment_status: "pending",
      ...(match_id ? { match_id } : {})
    });

    // Block slot to prevent double booking
    await base44.asServiceRole.entities.FieldNewTimeSlot.update(slot.id, { status: "reserved" });

    // Create Mercado Pago preference using owner's access token
    // application_fee routes the commission to the platform's MP account automatically
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
      payer: { email: user.email },
      application_fee: COMMISSION
    };

    const prefRes = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ownerAccessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(prefBody)
    });

    if (!prefRes.ok) {
      const err = await prefRes.text();
      // Rollback on failure
      await base44.asServiceRole.entities.FieldNewReservation.delete(reservation.id);
      await base44.asServiceRole.entities.FieldNewTimeSlot.update(slot.id, { status: "available" });
      return Response.json({ error: "Error creando preferencia de pago en Mercado Pago", details: err }, { status: 400 });
    }

    const prefData = await prefRes.json();

    // Save preference_id on reservation
    await base44.asServiceRole.entities.FieldNewReservation.update(reservation.id, {
      mercadopago_payment_id: prefData.id
    });

    return Response.json({
      init_point: prefData.init_point,
      sandbox_init_point: prefData.sandbox_init_point,
      reservation_id: reservation.id,
      preference_id: prefData.id
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});