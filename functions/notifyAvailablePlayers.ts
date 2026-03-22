import { createClientFromRequest } from 'npm:@base44/sdk@0.8.21';

const DAY_MAP = {
  0: "domingo", 1: "lunes", 2: "martes", 3: "miércoles",
  4: "jueves", 5: "viernes", 6: "sábado"
};

function timeToMinutes(t) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const { match_id, custom_message } = await req.json();

    const matches = await base44.entities.Match.list();
    const match = matches.find(m => m.id === match_id);
    if (!match) return Response.json({ error: "Partido no encontrado" }, { status: 404 });

    if (match.creator_email !== user.email) {
      return Response.json({ error: "Solo el organizador puede enviar avisos" }, { status: 403 });
    }

    const matchDate = new Date(match.date);
    const matchDay = DAY_MAP[matchDate.getDay()];
    const matchHour = matchDate.getHours();
    const matchMinutes = matchHour * 60 + matchDate.getMinutes();

    // Get all availability records
    const availabilities = await base44.entities.PlayerAvailability.list();

    // Filter compatible players (same day, overlapping time, not creator)
    const compatible = availabilities.filter(avail => {
      if (avail.user_email === user.email) return false;
      if (avail.notify_enabled === false) return false;
      if (!avail.slots?.length) return false;

      return avail.slots.some(slot => {
        if (slot.day.toLowerCase() !== matchDay) return false;
        const slotStart = timeToMinutes(slot.start_time);
        const slotEnd = timeToMinutes(slot.end_time);
        return matchMinutes >= slotStart && matchMinutes < slotEnd;
      });
    });

    if (compatible.length === 0) {
      return Response.json({ sent: 0, message: "No hay jugadores disponibles para este horario" });
    }

    const sportLabel = match.sport_type === "padel" ? "🎾 Pádel" : "⚽ Fútbol";
    const matchUrl = `${req.headers.get("origin") || "https://sejuega.app"}/MatchDetail?id=${match_id}`;
    const spotsLeft = (match.players_needed || 0) - (match.current_players || 0);

    const defaultMessage = `¡Hay un partido disponible en tu horario! Unite ahora`;
    const messageBody = custom_message || defaultMessage;

    const emailPromises = compatible.map(avail =>
      base44.asServiceRole.integrations.Core.SendEmail({
        to: avail.user_email,
        subject: `${sportLabel} — ¡Faltan jugadores para el partido del ${matchDay}!`,
        body: `Hola ${avail.user_name || avail.user_email},

${messageBody}

📍 ${match.field_name} — ${match.address}
📅 ${matchDate.toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long" })} a las ${matchDate.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
👥 Faltan ${spotsLeft} jugador${spotsLeft !== 1 ? "es" : ""}

Ingresá a la app para sumarte:
${matchUrl}

¡Nos vemos en la cancha!`
      })
    );

    await Promise.all(emailPromises);

    return Response.json({ sent: compatible.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});