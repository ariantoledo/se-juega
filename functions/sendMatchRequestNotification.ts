import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { event, data } = await req.json();

    if (event.type !== 'create') {
      return Response.json({ ok: true });
    }

    const matchRequest = data;
    if (!matchRequest) {
      return Response.json({ error: 'Missing match request data' }, { status: 400 });
    }

    // Fetch match details to get creator and match info
    const match = await base44.asServiceRole.entities.Match.list();
    const matchData = match.find(m => m.id === matchRequest.match_id);

    if (!matchData) {
      return Response.json({ error: 'Match not found' }, { status: 404 });
    }

    // Determine sport type label
    const sportLabel = matchData.sport_type === 'futbol' 
      ? `Fútbol ${matchData.football_type}` 
      : 'Pádel';

    // Create notification for match creator
    await base44.asServiceRole.entities.Notification.create({
      user_email: matchData.creator_email,
      title: `📋 Nueva solicitud: ${matchRequest.player_name}`,
      message: `${matchRequest.player_name} quiere unirse a tu ${sportLabel} en ${matchData.field_name}. Posición: ${matchRequest.position}`,
      type: 'request',
      link: `/MatchDetail?id=${matchRequest.match_id}`,
      is_read: false
    });

    // Send push notification if creator is online
    try {
      await base44.integrations.Core.InvokeLLM({
        prompt: `User ${matchData.creator_email} has a new match request from ${matchRequest.player_name}. Send a push notification.`,
      });
    } catch {
      // Push notification service may not be available
    }

    return Response.json({ ok: true, notified: matchData.creator_email });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});