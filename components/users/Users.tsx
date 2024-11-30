"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Loader2,
  Trash2,
  UserCog,
  Search,
  RefreshCw,
  Eye,
  EyeOff,
  KeyRound,
  UserX,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  deleteUser,
  getUsers,
  updateUserRole,
  changeUserPassword,
  getCurrentProfile,
} from "@/lib/supabase/supabase-actions";
import type { Profile, UserRole } from "@/lib/types";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Shield, ShieldOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Loader } from "@/components/ui/loader";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PasswordStrengthIndicator } from "@/components/ui/password-strength-indicator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function Users() {
  const router = useRouter();
  const { toast } = useToast();
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);
  const itemsPerPage = 10;
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [showChangePasswordDialog, setShowChangePasswordDialog] =
    useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [isVisible, setIsVisible] = useState(false);
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);

  // Memoize the error handling function
  const handleError = useCallback(
    (err: Error) => {
      if (err.message?.includes("Unauthorized")) {
        toast({
          variant: "destructive",
          title: "Unauthorized",
          description: "You don't have permission to view users",
        });
        router.push("/dashboard");
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: err.message || "Failed to fetch users",
        });
      }
    },
    [toast, router]
  );

  // Added useEffect to fetch and set the current user when component mounts
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const profile = await getCurrentProfile();
        setCurrentUser(profile);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
    };

    fetchCurrentUser();
  }, []);

  // Modify the React Query configuration
  const {
    data: users = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      try {
        return await getUsers();
      } catch (error) {
        throw new Error(
          typeof error === "string" ? error : "Failed to fetch users"
        );
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error: any) => {
      // Don't retry on unauthorized errors
      if (error.message?.includes("Unauthorized")) {
        return false;
      }
      // Retry other errors up to 2 times
      return failureCount < 2;
    },
  });

  // Use the memoized handler in useEffect
  useEffect(() => {
    if (error) {
      handleError(error);
    }
  }, [error, handleError]);

  const handleDelete = async (userId: string) => {
    try {
      setDeleting(userId);
      await deleteUser(userId);

      // Invalidate the users cache
      queryClient.invalidateQueries({ queryKey: ["users"] });

      toast({
        title: "Success",
        description: "User deleted successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to delete user",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      await updateUserRole(userId, newRole);

      toast({
        title: "Success",
        description: "User role updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update user role",
      });
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUserId || !newPassword.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Password cannot be empty",
      });
      return;
    }

    try {
      await changeUserPassword(selectedUserId, newPassword);
      toast({
        title: "Success",
        description: "Password changed successfully",
      });
      setShowChangePasswordDialog(false);
      setNewPassword("");
      setSelectedUserId(null);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to change password",
      });
    }
  };

  // Filter and pagination logic
  const filteredAndPaginatedUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Sort current user to top
    filtered.sort((a, b) => {
      if (a.id === currentUser?.id) return -1;
      if (b.id === currentUser?.id) return 1;
      return 0;
    });

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
      paginatedUsers: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalUsers: filtered.length,
    };
  };

  const handleRefresh = async () => {
    // Invalidate the users cache
    queryClient.invalidateQueries({ queryKey: ["users"] });

    toast({
      title: "Success",
      description: "Users list refreshed",
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-green-100 text-green-800";
      case "accountant":
        return "bg-blue-100 text-blue-800";
      case "clerk":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className='w-[75vw] mx-auto space-y-4'>
        <h2 className='text-3xl font-bold tracking-tight text-center'>Users</h2>
        <div className='flex items-center justify-between gap-4'>
          <div className='w-72 h-10 bg-gray-200 animate-pulse rounded-md' />
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-32 h-6 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>
        {[...Array(5)].map((_, i) => (
          <div key={i} className='h-16 bg-gray-200 animate-pulse rounded-md' />
        ))}
      </div>
    );
  }

  const { paginatedUsers, totalPages, totalUsers } =
    filteredAndPaginatedUsers();

  return (
    <div className='w-[75vw] mt-4 mx-auto space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Users
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Manage user accounts and permissions
        </p>
      </div>

      <div className='flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 shadow-sm'>
        <div className='relative w-full md:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50' />
          <Input
            placeholder='Search users...'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className='pl-9 border-gray-100/50 bg-white/50 focus:bg-white transition-colors'
          />
        </div>

        <div className='flex items-center gap-3'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={handleRefresh}
                  className='border-gray-100/50 hover:bg-white/50 transition-colors'>
                  <RefreshCw className='h-4 w-4 text-muted-foreground/70' />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh list</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Badge variant='secondary' className='bg-white/50 text-muted-foreground/70'>
            {totalUsers} {totalUsers === 1 ? "user" : "users"}
          </Badge>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50'>
              <TableHead className='min-w-[200px] font-medium'>Name</TableHead>
              <TableHead className='min-w-[200px] font-medium'>Email</TableHead>
              <TableHead className='min-w-[100px] font-medium'>Role</TableHead>
              <TableHead className='w-[100px] text-right font-medium'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className='h-32 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <UserX className='h-8 w-8 text-gray-400' />
                    <p className='text-muted-foreground'>No users found</p>
                    {searchTerm && (
                      <Button
                        variant='link'
                        onClick={() => setSearchTerm("")}
                        className='text-sm'>
                        Clear search
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className='flex items-center gap-2'>
                      {user.full_name}
                      {user.id === currentUser?.id && (
                        <Badge
                          variant='secondary'
                          className='text-xs bg-green-400/50 rounded-full'>
                          you
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge
                      variant='outline'
                      className={cn(
                        getRoleBadgeColor(user.role),
                        "transition-all duration-300"
                      )}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-right'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant='ghost' size='icon'>
                          <MoreVertical className='h-4 w-4' />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        {currentUser?.id === user.id ? (
                          <>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUser(user);
                                setShowChangePasswordDialog(true);
                              }}>
                              <KeyRound className='mr-2 h-4 w-4' />
                              Change Password
                            </DropdownMenuItem>
                          </>
                        ) : (
                          <>
                            {user.role !== "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(user.id, "admin")
                                }>
                                <Shield className='mr-2 h-4 w-4' />
                                Make Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === "admin" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(user.id, "clerk")
                                }>
                                <ShieldOff className='mr-2 h-4 w-4' />
                                Remove Admin
                              </DropdownMenuItem>
                            )}
                            {user.role !== "accountant" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(user.id, "accountant")
                                }>
                                Make Accountant
                              </DropdownMenuItem>
                            )}
                            {user.role !== "clerk" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(user.id, "clerk")
                                }>
                                Make Clerk
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUserId(user.id);
                                setSelectedUser(user);
                                setShowChangePasswordDialog(true);
                              }}>
                              <KeyRound className='mr-2 h-4 w-4' />
                              Change Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className='text-red-600'
                              onClick={() => handleDelete(user.id)}
                              disabled={deleting === user.id}>
                              {deleting === user.id ? (
                                <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              ) : (
                                <Trash2 className='mr-2 h-4 w-4' />
                              )}
                              Delete User
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className='flex justify-center mt-6'>
          <Pagination>
            <PaginationContent className='bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-lg shadow-sm px-2'>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  className={cn(
                    currentPage === 1 && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}>
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  className={cn(
                    currentPage === totalPages &&
                      "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {showChangePasswordDialog && (
        <Dialog
          open={showChangePasswordDialog}
          onOpenChange={setShowChangePasswordDialog}>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>Change Password</DialogTitle>
              <DialogDescription>
                Set a new password for {selectedUser?.full_name}
              </DialogDescription>
            </DialogHeader>
            <div className='space-y-4'>
              <div className='relative'>
                <Input
                  id='new-password'
                  className='pe-9'
                  placeholder='Enter new password'
                  type={isVisible ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <button
                  className='absolute inset-y-px end-px flex h-full w-9 items-center justify-center rounded-e-lg text-muted-foreground/80 hover:text-muted-foreground'
                  type='button'
                  onClick={() => setIsVisible(!isVisible)}>
                  {isVisible ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
            <DialogFooter className='sm:justify-between'>
              <DialogClose asChild>
                <Button
                  variant='outline'
                  onClick={() => {
                    setNewPassword("");
                    setSelectedUser(null);
                  }}>
                  Cancel
                </Button>
              </DialogClose>
              <Button
                onClick={handleChangePassword}
                disabled={!newPassword.trim() || newPassword.length < 6}>
                Change Password
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
