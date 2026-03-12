import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

// Use a valid placeholder URL during build/prerender when env vars aren't configured
const url = supabaseUrl.startsWith("http")
  ? supabaseUrl
  : "https://placeholder.supabase.co";
const key = supabaseAnonKey.length > 10 ? supabaseAnonKey : "placeholder-key";

export const supabase = createClient(url, key);

export type Graffiti = {
  id: string;
  prompt: string;
  image_url: string;
  latitude: number;
  longitude: number;
  creator: string;
  created_at: string;
};
