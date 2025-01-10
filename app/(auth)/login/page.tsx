import Login from "@/components/auth/Login";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function LoginPage() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (user && !userError) {
      redirect("/dashboard");
    }

    return (
      <div suppressHydrationWarning>
        <Login />
      </div>
    );
  } catch (error) {
    return <Login />;
  }
}
