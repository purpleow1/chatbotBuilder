"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupabaseServerAuthClient } from "@/lib/supabase/server";

export async function logout() {
  const supabase = await getSupabaseServerAuthClient();

  await supabase.auth.signOut({ scope: "local" });
  revalidatePath("/", "layout");
  redirect("/login?message=You have been logged out.");
}
