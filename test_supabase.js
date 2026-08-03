/* eslint-disable @typescript-eslint/no-require-imports */
const { createClient } = require("@supabase/supabase-js");

const url = "https://mkwbuixfuqosjjgrrdpl.supabase.co";
const anonKey = "sb_publishable_rk5SkDvlgNK4t_edtwc17g_mtnE1u7w";

const sb = createClient(url, anonKey);

async function run() {
  const code = "ABCDEF";
  const { data, error } = await sb
    .from("rooms")
    .insert({
      code,
      name: "Test Room",
      host_name: "Test Host",
      timer_state: "idle",
      timer_remaining: 1500,
      timer_duration: 1500,
    })
    .select()
    .single();

  console.log("Data:", data);
  console.log("Error:", error);
}

run();
