import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { code, establishment_id, redirect_uri } = await req.json();

    const clientId = Deno.env.get("MP_CLIENT_ID");
    const clientSecret = Deno.env.get("MP_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      return Response.json({ error: 'MP credentials not configured' }, { status: 500 });
    }

    const tokenRes = await fetch("https://api.mercadopago.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri
      })
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      return Response.json({ error: "MP OAuth failed", details: err }, { status: 400 });
    }

    const tokenData = await tokenRes.json();

    // If establishment_id is 'admin_account', save to the admin user entity
    if (establishment_id === 'admin_account') {
      await base44.auth.updateMe({ mp_admin_token: tokenData.access_token, mp_admin_user_id: String(tokenData.user_id) });
    } else {
      await base44.asServiceRole.entities.Establishment.update(establishment_id, {
        mercadopago_account_id: tokenData.access_token,
        mercadopago_user_id: String(tokenData.user_id)
      });
    }

    return Response.json({ success: true, mp_user_id: tokenData.user_id, is_admin: establishment_id === 'admin_account' });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});