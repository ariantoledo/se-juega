import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { establishment_id, redirect_uri } = await req.json();
  const clientId = Deno.env.get("MP_CLIENT_ID");

  if (!clientId) return Response.json({ error: 'MP_CLIENT_ID not configured' }, { status: 500 });

  const authUrl = new URL("https://auth.mercadopago.com/authorization");
  authUrl.searchParams.set("client_id", clientId);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("platform_id", "mp");
  authUrl.searchParams.set("state", establishment_id);
  authUrl.searchParams.set("redirect_uri", redirect_uri);

  return Response.json({ auth_url: authUrl.toString() });
});