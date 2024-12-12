'use client';

import type { Profile } from "@/lib/types";
import Dashboard from "./Dashboard";
import { SidebarProvider } from "@/components/ui/sidebar";

interface DashboardClientProps {
  user: Profile;
  children: React.ReactNode;
}

export default function DashboardClient({ user, children }: DashboardClientProps) {
  return (
    <SidebarProvider>
      <div className='flex min-h-screen flex-col'>
        <Dashboard user={user}>
          <main className='flex w-full flex-col overflow-hidden'>
            {children}
          </main>
        </Dashboard>
      </div>
    </SidebarProvider>
  );
} 