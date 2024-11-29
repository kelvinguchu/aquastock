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
      <Navbar user={user} />
      <div className="flex min-h-screen pt-16">
        <AppSidebar user={user} />
        <div className="flex-1 pl-[240px] p-6">
          {children}
        </div>
      </div>
    </>
  );
}
