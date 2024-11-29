import Register from "@/components/auth/Register";
import { createServerClient } from "@/lib/supabase";
import { redirect } from "next/navigation";

export default async function RegisterPage() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!error && user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      redirect("/dashboard");
    }
  } else {
    redirect("/login");
  }

  return <Register />;
}
