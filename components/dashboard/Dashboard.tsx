"use client";

import type { Profile } from "@/lib/types";
import { Navbar } from "./Navbar";
import { AppSidebar } from "./AppSidebar";

interface DashboardProps {
  user: Profile;
  children: React.ReactNode;
}

export default function Dashboard({ user, children }: DashboardProps) {
  if (!user || !user.role) {
    return null;
  }

  return (
    <>
      <AppSidebar user={user} />
      <div className='flex min-h-screen'>
        <Navbar user={user} />
        <main className='w-full ml-[280px] pt-16 px-4'>{children}</main>
      </div>
    </>
  );
}
