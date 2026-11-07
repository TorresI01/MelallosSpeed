import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function respond(status: number, body: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond(405, { error: "Método no permitido." });

  const authorization = request.headers.get("Authorization");
  const accessToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return respond(401, { error: "Debes iniciar sesión como administrador." });

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const publishableKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const redirectTo = Deno.env.get("ADMIN_REDIRECT_URL");
  if (!supabaseUrl || !publishableKey || !serviceRoleKey || !redirectTo) {
    console.error("Falta configurar SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY o ADMIN_REDIRECT_URL.");
    return respond(500, { error: "La función de invitaciones no está configurada." });
  }

  const callerClient = createClient(supabaseUrl, publishableKey, {
    global: { headers: { Authorization: "Bearer " + accessToken } },
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: userData, error: userError } = await callerClient.auth.getUser(accessToken);
  if (userError || !userData.user) return respond(401, { error: "La sesión no es válida." });

  const { data: isAdmin, error: authorizationError } = await callerClient.rpc("is_site_admin");
  if (authorizationError) {
    console.error("No se pudo verificar el permiso de administración:", authorizationError.message);
    return respond(500, { error: "No se pudo verificar el permiso de administración." });
  }
  if (!isAdmin) return respond(403, { error: "Solo un administrador autorizado puede invitar usuarios." });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond(400, { error: "La solicitud no contiene JSON válido." });
  }

  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return respond(400, { error: "La solicitud debe incluir un correo electrónico." });
  }
  const actionValue = "action" in body ? body.action : undefined;
  const action = actionValue === undefined ? "invite" : actionValue;
  if (action !== "invite" && action !== "change-email") {
    return respond(400, { error: "La operación solicitada no es válida." });
  }
  const emailValue = "email" in body ? body.email : undefined;
  const email = typeof emailValue === "string" ? emailValue.trim().toLowerCase() : "";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond(400, { error: "Escribe un correo electrónico válido." });
  }
  const currentEmailValue = "currentEmail" in body ? body.currentEmail : undefined;
  const currentEmail = typeof currentEmailValue === "string" ? currentEmailValue.trim().toLowerCase() : "";
  if (action === "change-email" &&
      (currentEmail.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentEmail))) {
    return respond(400, { error: "El correo actual del administrador no es válido." });
  }
  if (action === "change-email" && currentEmail === userData.user.email?.toLowerCase()) {
    return respond(400, { error: "No puedes migrar tu propio correo desde la sesión actual. Usa el restablecimiento de contraseña o cambia tu correo en Supabase." });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: existingAdmin, error: lookupError } = await adminClient
    .from("admin_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();
  if (lookupError) {
    console.error("No se pudo consultar la lista de administradores:", lookupError.message);
    return respond(500, { error: "No se pudo consultar la lista de administradores." });
  }
  if (existingAdmin) return respond(409, { error: "Ese correo ya está autorizado como administrador." });

  if (action === "change-email") {
    const { data: currentAdmin, error: currentLookupError } = await adminClient
      .from("admin_users")
      .select("email")
      .eq("email", currentEmail)
      .maybeSingle();
    if (currentLookupError) {
      console.error("No se pudo consultar el administrador actual:", currentLookupError.message);
      return respond(500, { error: "No se pudo consultar el administrador actual." });
    }
    if (!currentAdmin) return respond(404, { error: "El administrador que intentas modificar ya no está autorizado." });
  }

  const { data: invitation, error: invitationError } = await adminClient.auth.admin.inviteUserByEmail(email, { redirectTo });
  if (invitationError || !invitation.user) {
    console.error("No se pudo invitar al administrador:", invitationError?.message || "Supabase no devolvió el usuario invitado.");
    return respond(400, { error: "Supabase no pudo enviar la invitación. Verifica el correo y la configuración de correo del proyecto." });
  }

  const { error: insertError } = await adminClient.from("admin_users").insert({ email });
  if (insertError) {
    const { error: rollbackError } = await adminClient.auth.admin.deleteUser(invitation.user.id);
    if (rollbackError) console.error("No se pudo cancelar el usuario invitado tras fallar su autorización:", rollbackError.message);
    console.error("No se pudo autorizar el administrador invitado:", insertError.message);
    return respond(500, {
      error: rollbackError
        ? "La invitación se envió, pero no se pudo completar la autorización. Contacta al administrador del proyecto."
        : "No se pudo autorizar el usuario invitado; la invitación fue cancelada.",
    });
  }

  if (action === "change-email") {
    const { error: deleteError } = await adminClient.from("admin_users").delete().eq("email", currentEmail);
    if (deleteError) {
      const { error: removeNewEmailError } = await adminClient.from("admin_users").delete().eq("email", email);
      const { error: rollbackError } = await adminClient.auth.admin.deleteUser(invitation.user.id);
      if (removeNewEmailError) console.error("No se pudo revertir la nueva autorización:", removeNewEmailError.message);
      if (rollbackError) console.error("No se pudo cancelar la invitación tras fallar la migración:", rollbackError.message);
      console.error("No se pudo retirar el correo anterior del administrador:", deleteError.message);
      return respond(500, {
        error: removeNewEmailError || rollbackError
          ? "No se pudo completar ni revertir por completo el cambio. Contacta al administrador del proyecto."
          : "No se pudo completar el cambio; la nueva invitación fue cancelada.",
      });
    }
  }

  return respond(200, {
    email,
    message: action === "change-email" ? "Correo actualizado e invitación enviada." : "Invitación enviada.",
  });
});
