function normalizeUrl(url: string) {
  return url.replace(/\/+$/, "");
}

export const env = {
  siteUrl: normalizeUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      "https://bible-study-buddy-free.example.com",
  ),
  supabaseUrl:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL,
  supabaseAnonKey:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SUPABASE_ANON_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY,
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
