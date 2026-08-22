import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL;

const supabasePublishableKey =
  process.env
    .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    console.log(
  "Supabase URL:",
  supabaseUrl
);

console.log(
  "Supabase Key exists:",
  Boolean(
    supabasePublishableKey
  )
);

console.log(
  "Supabase Key length:",
  supabasePublishableKey?.length
);

if (
  !supabaseUrl ||
  !supabasePublishableKey
) {
  throw new Error(
    "Supabase environment variables are missing."
  );
}

export const supabase = createClient(
  supabaseUrl,
  supabasePublishableKey
);