export const env = {
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ??
    "https://bible-study-buddy-free.example.com",
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  webhookSecret: process.env.SUPABASE_WEBHOOK_SECRET,
  scriptureTooltipMode:
    process.env.NEXT_PUBLIC_SCRIPTURE_TOOLTIP_MODE ?? "off",
  scriptureTooltipScript:
    process.env.NEXT_PUBLIC_SCRIPTURE_TOOLTIP_SCRIPT_URL ?? "",
};

export function isSupabaseConfigured() {
  return Boolean(env.supabaseUrl && env.supabaseAnonKey);
}
