import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase";

export default async function Home() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  } else {
    redirect("/dashboard");
  }
}
