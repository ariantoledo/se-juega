import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

const REMINDER_MINUTES_BEFORE = 60; // 1 hora antes

const SPORT_LABELS = {
  futbol: 'Fútbol',
  padel: 'Pádel',
  tenis: 'Tenis',
  ping_pong: 'Ping Pong',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (user?.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

  webpush.setVapidDetails(
    'mailto:sejuega@app.com',
    Deno.env.get('VAPID_PUBLIC_KEY'),
    Deno.env.get('VAPID_PRIVATE_KEY')
  );

  const now = new Date();
  const windowStart = new Date(now.getTime() + REMINDER_MINUTES_BEFORE * 60 * 1000 - 5 * 60 * 1000); // 5 min window
  const windowEnd = new Date(now.getTime() + REMINDER_MINUTES_BEFORE * 60 * 1000 + 5 * 60 * 1000);

  // Get all open/full matches
  const matches = await base44.asServiceRole.entities.Match.list();
  const upcoming = matches.filter(m => {
    if (!m.date) return false;
    const matchDate = new Date(m.date);
    return matchDate >= windowStart && matchDate <= windowEnd && (m.status === 'open' || m.status === 'full');
  });

  if (upcoming.length === 0) return Response.json({ checked: matches.length, reminders_sent: 0 });

  // Get already sent reminders
  const sentReminders = await base44.asServiceRole.entities.MatchReminder.list();
  const sentSet = new Set(sentReminders.map(r => `${r.match_id}:${r.user_email}`));

  let remindersSent = 0;

  for (const match of upcoming) {
    // Get confirmed players for this match
    const players = await base44.asServiceRole.entities.MatchPlayer.filter({ match_id: match.id });
    const emails = [...new Set([
      ...(players.map(p => p.player_email)),
      match.creator_email,
    ].filter(Boolean))];

    const matchTime = new Date(match.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Buenos_Aires' });
    const sportLabel = SPORT_LABELS[match.sport_type] || match.sport_type;
    const SPORT_EMOJIS = { futbol: '⚽', padel: '🎾', tenis: '🎾', ping_pong: '🏓' };
    const sportEmoji = SPORT_EMOJIS[match.sport_type] || '🏅';
    const title = `${sportEmoji} Recordatorio: ${sportLabel} en ${REMINDER_MINUTES_BEFORE} min`;
    const body = `${match.field_name} — ${match.address}\nHora del partido: ${matchTime}`;

    for (const email of emails) {
      const key = `${match.id}:${email}`;
      if (sentSet.has(key)) continue;

      const subs = await base44.asServiceRole.entities.PushSubscription.filter({ user_email: email });
      if (!subs || subs.length === 0) continue;

      const payload = JSON.stringify({ title, body, url: `/MatchDetail?id=${match.id}`, tag: `reminder-${match.id}` });

      for (const s of subs) {
        try {
          await webpush.sendNotification(JSON.parse(s.subscription), payload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await base44.asServiceRole.entities.PushSubscription.delete(s.id);
          }
        }
      }

      await base44.asServiceRole.entities.MatchReminder.create({
        match_id: match.id,
        user_email: email,
        sent_at: now.toISOString(),
      });
      remindersSent++;
    }
  }

  return Response.json({ checked: matches.length, upcoming: upcoming.length, reminders_sent: remindersSent });
});