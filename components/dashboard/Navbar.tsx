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
    <nav className='fixed top-0 z-50 w-full border-b bg-background'>
      <div className='container flex h-16 items-center'>
        <div className='flex items-center gap-4'>
          <div className='flex items-center gap-2 ml-4'>
            <Image
              src='/logo.png'
              alt='Aquatreat Logo'
              width={120}
              height={120}
            />
          </div>
          {/* <SidebarTrigger /> */}
        </div>
        <div className='ml-auto flex items-center gap-4'>
          <UserNav user={user} />
        </div>
      </div>
    </nav>
  );
} 