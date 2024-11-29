import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Users from "@/components/users/Users";

export default async function UsersPage() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (!user || error) {
    redirect("/login");
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    redirect("/dashboard");
  }

  return <Users />;
}
