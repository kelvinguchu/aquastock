import Login from "@/components/auth/Login";
import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  const supabase = await createServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    redirect("/dashboard");
  }

  return <Login />;
}
