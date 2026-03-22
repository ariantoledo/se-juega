import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { player_email, player_name, match_id, accepted, field_name } = await req.json();

    if (!player_email || !player_name || !match_id || accepted === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const status = accepted ? 'accepted' : 'rejected';
    const title = accepted ? '✅ ¡Aceptado!' : '❌ Solicitud rechazada';
    const message = accepted 
      ? `¡Fuiste aceptado en el partido en ${field_name}! Nos vemos en la cancha.`
      : `Lamentablemente, tu solicitud para el partido en ${field_name} fue rechazada.`;

    // Create in-app notification
    await base44.asServiceRole.entities.Notification.create({
      user_email: player_email,
      title: title,
      message: message,
      type: 'match',
      link: `/MatchDetail?id=${match_id}`,
      is_read: false
    });

    return Response.json({ ok: true, notified: player_email, status });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});