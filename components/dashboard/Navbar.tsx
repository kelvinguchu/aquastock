"use client";

import { UserNav } from "./user-nav";
import { SidebarTrigger } from "@/components/ui/sidebar";
import type { Profile } from "@/lib/types";
import Image from "next/image";

interface NavbarProps {
  user: Profile;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className='fixed top-0 right-0 z-50 w-[calc(100%-280px)] border-b border-zinc-100/50 bg-[#F8FAFC]'>
      <div className='flex h-16 items-center justify-end px-6'>
        <UserNav user={user} />
      </div>
    </nav>
  );
} 