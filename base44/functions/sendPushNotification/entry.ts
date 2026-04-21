import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import webpush from 'npm:web-push@3.6.7';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { user_email, title, body, url, tag } = await req.json();

  webpush.setVapidDetails(
    'mailto:sejuega@app.com',
    Deno.env.get('VAPID_PUBLIC_KEY'),
    Deno.env.get('VAPID_PRIVATE_KEY')
  );

  const subs = await base44.asServiceRole.entities.PushSubscription.filter({ user_email });
  if (!subs || subs.length === 0) return Response.json({ sent: false, reason: 'no_subscription' });

  const payload = JSON.stringify({ title, body, url: url || '/', tag: tag || 'match-reminder' });
  let sent = 0;

  for (const s of subs) {
    try {
      const subscription = JSON.parse(s.subscription);
      await webpush.sendNotification(subscription, payload);
      sent++;
    } catch (err) {
      // Subscription expired — remove it
      if (err.statusCode === 410 || err.statusCode === 404) {
        await base44.asServiceRole.entities.PushSubscription.delete(s.id);
      }
    }
  }

  return Response.json({ sent });
});