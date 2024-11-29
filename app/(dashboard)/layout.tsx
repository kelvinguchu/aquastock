import { redirect } from "next/navigation";
import type { Profile } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import Dashboard from "@/components/dashboard/Dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen flex-col">
        <Dashboard user={profile}>
          <main className="flex w-full flex-col overflow-hidden">
            {children}
          </main>
        </Dashboard>
      </div>
    </SidebarProvider>
  );
}
