import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date().toISOString();

    const { data: dueReminders, error: fetchError } = await supabase
      .from("reminders")
      .select("id, phone, item_name, item_image, message, status")
      .eq("status", "scheduled")
      .lte("reminder_time", now);

    if (fetchError) {
      return new Response(
        JSON.stringify({ error: fetchError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let sentCount = 0;
    for (const reminder of dueReminders ?? []) {
      const { error: notifError } = await supabase.from("notifications").insert({
        type: "reorder_reminder",
        title: `Re-order reminder for ${reminder.phone ?? "customer"}`,
        body: reminder.message ?? `Time to re-order ${reminder.item_name}!`,
      });

      if (notifError) continue;

      await supabase
        .from("reminders")
        .update({ status: "sent" })
        .eq("id", reminder.id);

      sentCount++;
    }

    return new Response(
      JSON.stringify({ processed: sentCount, checked: (dueReminders ?? []).length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
