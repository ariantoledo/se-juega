import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { reservation_id, payment_id, status } = await req.json();

  const accessToken = Deno.env.get("MP_ACCESS_TOKEN");
  if (!accessToken) return Response.json({ error: 'MP_ACCESS_TOKEN not configured' }, { status: 500 });

  // Get reservation
  const reservations = await base44.entities.FieldNewReservation.list();
  const reservation = reservations.find(r => r.id === reservation_id);
  if (!reservation) return Response.json({ error: 'Reservation not found' }, { status: 404 });

  let paymentStatus = status;

  // If we have a real payment_id from MP, verify it
  if (payment_id && payment_id !== reservation.mercadopago_payment_id) {
    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${payment_id}`, {
      headers: { "Authorization": `Bearer ${accessToken}` }
    });

    if (payRes.ok) {
      const payData = await payRes.json();
      paymentStatus = payData.status; // "approved", "pending", "rejected", "cancelled"

      await base44.entities.FieldNewReservation.update(reservation_id, {
        mercadopago_payment_id: payment_id
      });
    }
  }

  if (paymentStatus === "approved" || paymentStatus === "success") {
    await base44.entities.FieldNewReservation.update(reservation_id, {
      reservation_status: "confirmed",
      payment_status: "paid"
    });
    return Response.json({ verified: true, payment_status: "approved" });

  } else if (paymentStatus === "rejected" || paymentStatus === "failure" || paymentStatus === "cancelled") {
    // Release the slot
    if (reservation.timeslot_id) {
      await base44.entities.FieldNewTimeSlot.update(reservation.timeslot_id, { status: "available" });
    }
    await base44.entities.FieldNewReservation.update(reservation_id, {
      reservation_status: "cancelled",
      payment_status: "pending"
    });
    return Response.json({ verified: true, payment_status: "rejected" });

  } else {
    // Pending - keep as is
    return Response.json({ verified: true, payment_status: "pending" });
  }
});