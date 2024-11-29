"use client";

import { useRouter, usePathname } from "next/navigation";
import type { Profile } from "@/lib/types";
import {
  LayoutDashboard,
  Package,
  ClipboardList,
  ArrowLeftRight,
  FileText,
  Users,
  UserPlus,
  PackagePlus,
  Plus,
  FileDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroupLabel,
  SidebarGroup,
} from "@/components/ui/sidebar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import Register from "@/components/auth/Register";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { AddProductDialog } from "@/components/inventory/AddProductDialog";
import { TransferDrawer } from "@/components/transfers/TransferDrawer";
import { CreateSaleSheet } from "@/components/sales/CreateSaleDialog";
import { cn } from "@/lib/utils";
import { CreateLPOSheet } from "@/components/lpo/CreateLPOSheet";
import { RequestDeductionSheet } from "@/components/request/RequestDeductionSheet";

interface AppSidebarProps {
  user: Profile;
}

interface MenuItem {
  title: string;
  href: string;
  icon: LucideIcon;
}

interface ActionItem {
  title: string;
  icon: LucideIcon;
  action: () => void;
}

interface NavItems {
  menu: MenuItem[];
  actions?: ActionItem[];
}

type UserRole = "admin" | "accountant" | "clerk" | "user";

type RoleBasedNavItems = {
  [K in UserRole]: NavItems;
};

export function AppSidebar({ user }: AppSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);
  const [showTransferDrawer, setShowTransferDrawer] = useState(false);
  const [showCreateSaleDialog, setShowCreateSaleDialog] = useState(false);
  const [showCreateLPOSheet, setShowCreateLPOSheet] = useState(false);
  const [showRequestDeductionSheet, setShowRequestDeductionSheet] = useState(false);

  const handleRegisterSuccess = () => {
    setSheetOpen(false);
    toast({
      title: "Success",
      description: "User registered successfully",
    });
  };

  const roleBasedNavItems: RoleBasedNavItems = {
    admin: {
      menu: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Inventory",
          href: "/inventory",
          icon: Package,
        },
        {
          title: "Sales",
          href: "/sales",
          icon: ClipboardList,
        },
        {
          title: "Transfers",
          href: "/transfers",
          icon: ArrowLeftRight,
        },
        {
          title: "Reports",
          href: "/reports",
          icon: FileText,
        },
        {
          title: "LPO",
          href: "/lpo",
          icon: FileText,
        },
        {
          title: "Users",
          href: "/users",
          icon: Users,
        },
        {
          title: "Deduction Requests",
          href: "/request",
          icon: FileDown,
        },
      ],
      actions: [
        {
          title: "Add User",
          icon: UserPlus,
          action: () => setSheetOpen(true),
        },
        {
          title: "Add Product",
          icon: PackagePlus,
          action: () => setShowAddProductDialog(true),
        },
        {
          title: "Transfer Stock",
          icon: ArrowLeftRight,
          action: () => setShowTransferDrawer(true),
        },
        {
          title: "Create Sale",
          icon: Plus,
          action: () => setShowCreateSaleDialog(true),
        },
        {
          title: "Create LPO",
          icon: FileText,
          action: () => setShowCreateLPOSheet(true),
        },
        {
          title: "Request Deduction",
          icon: FileDown,
          action: () => setShowRequestDeductionSheet(true),
        },
      ],
    },
    accountant: {
      menu: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Reports",
          href: "/reports",
          icon: FileText,
        },
        {
          title: "Sales",
          href: "/sales",
          icon: ClipboardList,
        },
        {
          title: "LPO",
          href: "/lpo",
          icon: FileText,
        },
        {
          title: "Deduction Requests",
          href: "/request",
          icon: FileDown,
        },
      ],
    },
    clerk: {
      menu: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Reports",
          href: "/reports",
          icon: FileText,
        },
        {
          title: "Inventory",
          href: "/inventory",
          icon: Package,
        },
        {
          title: "Sales",
          href: "/sales",
          icon: ClipboardList,
        },
        {
          title: "Transfers",
          href: "/transfers",
          icon: ArrowLeftRight,
        },
        {
          title: "Deduction Requests",
          href: "/request",
          icon: FileDown,
        },
      ],
      actions: [
        {
          title: "Add Product",
          icon: PackagePlus,
          action: () => setShowAddProductDialog(true),
        },
        {
          title: "Transfer Stock",
          icon: ArrowLeftRight,
          action: () => setShowTransferDrawer(true),
        },
        {
          title: "Create Sale",
          icon: Plus,
          action: () => setShowCreateSaleDialog(true),
        },
      ],
    },
    user: {
      menu: [
        {
          title: "Deduction Requests",
          href: "/request",
          icon: FileDown,
        },
      ],
      actions: [
        {
          title: "Request Deduction",
          icon: FileDown,
          action: () => setShowRequestDeductionSheet(true),
        },
      ],
    },
  };

  if (!user.role || !(user.role in roleBasedNavItems)) {
    return null;
  }

  const navItems = roleBasedNavItems[user.role];

  return (
    <>
      <div className='h-[calc(100vh-4rem)] fixed top-16'>
        <Sidebar className='max-w-[17%]'>
          <SidebarContent className='mt-16'>
            <SidebarGroup>
              <SidebarGroupLabel className='px-2 text-lg font-bold tracking-tight'>
                MENU
              </SidebarGroupLabel>
              <SidebarMenu>
                {navItems.menu.map((item, index) => (
                  <SidebarMenuItem key={index}>
                    <SidebarMenuButton
                      onClick={() => router.push(item.href)}
                      tooltip={item.title}
                      className={pathname === item.href ? "bg-accent" : ""}>
                      <item.icon
                        className={cn(
                          "h-4 w-4",
                          pathname === item.href
                            ? "text-primary"
                            : "text-muted-foreground"
                        )}
                      />
                      <span
                        className={cn(
                          pathname === item.href && "font-medium text-primary"
                        )}>
                        {item.title}
                      </span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>

            {navItems.actions && navItems.actions.length > 0 && (
              <SidebarGroup className='mt-8'>
                <SidebarGroupLabel className='px-2 text-lg font-bold tracking-tight'>
                  ACTIONS
                </SidebarGroupLabel>
                <SidebarMenu>
                  {navItems.actions.map((item, index) => (
                    <SidebarMenuItem key={index}>
                      <SidebarMenuButton
                        onClick={item.action}
                        tooltip={item.title}>
                        <item.icon className='h-4 w-4' />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            )}
          </SidebarContent>
        </Sidebar>
      </div>

      <RequestDeductionSheet
        open={showRequestDeductionSheet}
        onOpenChange={setShowRequestDeductionSheet}
      />

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className='min-w-[30vw] sm:min-w-[540px]'>
          <SheetHeader>
            <SheetTitle>Add New User</SheetTitle>
          </SheetHeader>
          <div className='mt-4'>
            <Register onSuccess={handleRegisterSuccess} className='w-full' />
          </div>
        </SheetContent>
      </Sheet>

      <AddProductDialog
        open={showAddProductDialog}
        onOpenChange={setShowAddProductDialog}
      />

      <TransferDrawer
        open={showTransferDrawer}
        onOpenChange={setShowTransferDrawer}
      />

      <CreateSaleSheet
        open={showCreateSaleDialog}
        onOpenChange={setShowCreateSaleDialog}
      />

      <CreateLPOSheet
        open={showCreateLPOSheet}
        onOpenChange={setShowCreateLPOSheet}
      />
    </>
  );
}
