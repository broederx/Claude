"use client";

import { createClient } from "@supabase/supabase-js";

// Zonder deze twee instellingen draait de app als demo met voorbeelddata in de
// browser. Met de instellingen is het de echte app met inlog en database.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = url && key
  ? createClient(url, key, {
      // "implicit": de inloglink werkt ook als de studio hem vanaf een andere
      // computer heeft verstuurd (bij uitnodigingen).
      auth: { flowType: "implicit", persistSession: true, detectSessionInUrl: true },
    })
  : null;

export const isLive = supabase !== null;
