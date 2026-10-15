import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { phone } = await req.json() as { phone?: string };
    if (!phone) {
      return new Response(JSON.stringify({ error: "Phone number is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Server configuration error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Fetch SMS gateway settings
    const settingKeys = [
      "sms_provider",
      "sms_api_key",
      "sms_sender_id",
      "sms_dlt_template_id",
      "sms_live_enabled",
    ];
    const { data: settingsRows, error: settingsError } = await adminClient
      .from("settings")
      .select("key, value")
      .in("key", settingKeys);

    if (settingsError) {
      return new Response(JSON.stringify({ error: "Failed to read settings" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const settings: Record<string, string> = {};
    for (const row of settingsRows ?? []) {
      settings[row.key] = row.value;
    }

    const liveEnabled = settings.sms_live_enabled === "true";
    const apiKey = settings.sms_api_key ?? "";

    // If live SMS is OFF or no API key, generate a demo OTP
    if (!liveEnabled || !apiKey) {
      const demoOtp = "123456";
      // Store demo OTP
      await adminClient.from("otp_codes").insert({
        phone,
        code: demoOtp,
        is_demo: true,
        consumed: false,
        expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      });

      return new Response(JSON.stringify({
        success: true,
        demo: true,
        message: "Demo OTP sent (123456). Enable Live SMS in admin settings to send real SMS.",
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Live mode: generate real OTP and send via gateway
    const otp = generateOtp();
    const provider = (settings.sms_provider ?? "").toLowerCase();
    const senderId = settings.sms_sender_id ?? "";
    const dltTemplateId = settings.sms_dlt_template_id ?? "";

    // Build the SMS message
    const message = `Your ${settings.app_name ?? "AM Palace"} verification code is ${otp}. Valid for 5 minutes. Do not share.`;

    // Send via provider — supports common Indian SMS gateways
    // Default to a generic HTTP API pattern that works with most providers
    let smsSent = false;

    if (provider === "msg91" || provider === "textlocal" || provider === "fast2sms" || provider === "gupshup" || provider === "generic") {
      try {
        const smsUrl = buildSmsUrl(provider, apiKey, senderId, dltTemplateId, phone, message);
        const smsResponse = await fetch(smsUrl.url, {
          method: smsUrl.method,
          headers: smsUrl.headers,
          body: smsUrl.body,
        });

        if (smsResponse.ok) {
          smsSent = true;
        }
      } catch {
        // SMS gateway error — fall through to stored OTP anyway
      }
    }

    // Store the OTP regardless so verify can check it
    await adminClient.from("otp_codes").insert({
      phone,
      code: otp,
      is_demo: false,
      consumed: false,
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });

    return new Response(JSON.stringify({
      success: true,
      demo: false,
      sent: smsSent,
      message: smsSent ? "OTP sent via SMS gateway." : "OTP generated but SMS delivery failed. Check gateway credentials.",
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : "Internal server error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
}

interface SmsRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
}

function buildSmsUrl(
  provider: string,
  apiKey: string,
  senderId: string,
  dltTemplateId: string,
  phone: string,
  message: string,
): SmsRequest {
  const cleanPhone = phone.replace(/\D/g, "");

  switch (provider) {
    case "msg91": {
      // MSG91 API
      const url = `https://api.msg91.com/api/v5/otp?authkey=${apiKey}&mobile=${cleanPhone}&message=${encodeURIComponent(message)}&sender=${senderId}&otp_length=6`;
      return { url, method: "GET", headers: {} };
    }
    case "textlocal": {
      // TextLocal API
      const url = `https://api.textlocal.in/send/?apikey=${apiKey}&numbers=${cleanPhone}&sender=${senderId}&message=${encodeURIComponent(message)}`;
      return { url, method: "GET", headers: {} };
    }
    case "fast2sms": {
      // Fast2SMS API
      const url = "https://www.fast2sms.com/dev/bulkV2";
      const body = JSON.stringify({
        variables_values: message,
        route: "otp",
        numbers: cleanPhone,
      });
      return {
        url,
        method: "POST",
        headers: {
          authorization: apiKey,
          "Content-Type": "application/json",
        },
        body,
      };
    }
    case "gupshup": {
      // GupShup API
      const url = `https://api.gupshup.io/sm/api/api/msg?method=sendMessage&send_to=${cleanPhone}&msg=${encodeURIComponent(message)}&msg_type=TEXT&auth_scheme=PLAIN&format=JSON&v=1.1&userid=${senderId}&auth_token=${apiKey}`;
      return { url, method: "GET", headers: {} };
    }
    default: {
      // Generic provider — POST with JSON body
      const url = `https://${provider}.com/api/send-sms`;
      const body = JSON.stringify({
        api_key: apiKey,
        sender: senderId,
        to: cleanPhone,
        message,
        dlt_template_id: dltTemplateId,
      });
      return {
        url,
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      };
    }
  }
}
