"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/use-auth";
import type { Profile } from "@/lib/types";
import { LogOut, KeyRound, Eye, EyeOff, Loader2, UserCircle2, Sun, Moon, Sunrise, Sunset } from "lucide-react";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { changeUserPassword } from "@/lib/supabase/supabase-actions";
import { cn } from "@/lib/utils";

interface UserNavProps {
  user: Profile;
}

export function UserNav({ user }: UserNavProps) {
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [showChangePasswordDialog, setShowChangePasswordDialog] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [GreetingIcon, setGreetingIcon] = useState<any>(Sun);

  // Get first name for greeting
  const firstName = user.full_name?.split(" ")[0] || "User";

  const getTimeBasedGreetingAndIcon = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return { greeting: "Good morning", Icon: Sunrise };
    if (hour >= 12 && hour < 17) return { greeting: "Good afternoon", Icon: Sun };
    if (hour >= 17 && hour < 22) return { greeting: "Good evening", Icon: Sunset };
    return { greeting: "Hello", Icon: Moon }; // For very late night/early morning
  };

  // Update greeting every minute
  useEffect(() => {
    const updateGreeting = () => {
      const { greeting, Icon } = getTimeBasedGreetingAndIcon();
      setGreeting(greeting);
      setGreetingIcon(Icon);
    };

    // Initial greeting
    updateGreeting();

    // Update greeting every minute
    const interval = setInterval(updateGreeting, 60000);

    return () => clearInterval(interval);
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password cannot be empty",
      });
      return;
    }

    try {
      setIsLoading(true);
      await changeUserPassword(user.id, newPassword, true);
      
      toast({
        title: "Success",
        description: "Password changed successfully. Please login again.",
      });
      
      setShowChangePasswordDialog(false);
      setNewPassword("");
      
      setTimeout(async () => {
        await signOut();
      }, 1500);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password",
      });
      console.error('Change password error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin':
        return "bg-green-100 text-green-800";
      case 'accountant':
        return "bg-blue-100 text-blue-800";
      case 'clerk':
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="relative group"
          >
            <div className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/10 via-blue-400/10 to-blue-500/10 hover:from-blue-500/20 hover:via-blue-400/20 hover:to-blue-500/20 transition-all duration-300 flex items-center gap-3">
              {/* Greeting Icon */}
              <GreetingIcon 
                className="w-4 h-4 text-blue-600/80 transition-transform group-hover:scale-110 group-hover:rotate-12"
              />
              
              {/* Text Content */}
              <div className="flex items-baseline gap-2">
                <span className="text-base font-medium text-blue-600/80">
                  {greeting},
                </span>
                <span className="text-lg font-semibold text-blue-700">
                  {firstName}
                </span>
              </div>

              {/* Profile Icon */}
              <UserCircle2 className="w-5 h-5 text-blue-600/80 transition-transform group-hover:scale-110" />
            </div>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.full_name}</p>
              <p className="text-xs leading-none text-muted-foreground">
                {user.email}
              </p>
              <Badge 
                variant="outline" 
                className={cn("mt-2 w-fit", getRoleBadgeColor(user.role))}
              >
                {user.role}
              </Badge>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="cursor-pointer"
            onClick={() => setShowChangePasswordDialog(true)}
          >
            <KeyRound className="mr-2 h-4 w-4" />
            Change Password
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showChangePasswordDialog} onOpenChange={setShowChangePasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Input
              id="new-password"
              className="pe-9"
              placeholder="Enter new password"
              type={isVisible ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isLoading}
              required
            />
            <button
              className="absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80"
              type="button"
              onClick={() => setIsVisible(!isVisible)}
              disabled={isLoading}
            >
              {isVisible ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setNewPassword("")} disabled={isLoading}>
                Cancel
              </Button>
            </DialogClose>
            <Button onClick={handleChangePassword} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Changing Password...
                </>
              ) : (
                'Change Password'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
} 