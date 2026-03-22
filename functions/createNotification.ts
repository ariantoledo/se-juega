import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const { user_email, title, message, type, link } = await req.json();

    if (!user_email || !title || !message || !type) {
      return Response.json({ error: "Faltan campos requeridos" }, { status: 400 });
    }

    const notification = await base44.asServiceRole.entities.Notification.create({
      user_email,
      title,
      message,
      type,
      link: link || null,
      is_read: false,
    });

    return Response.json({ success: true, notification });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});