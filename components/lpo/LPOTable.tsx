"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, RefreshCw, MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useSidebar } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { LPODetailsSheet } from "./LPODetailsSheet";

interface LPOItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
  };
}

interface LPO {
  id: string;
  supplier_name: string;
  supplier_contact: string;
  target_location: 'kamulu' | 'utawala';
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  created_by: string;
  approved_by: string | null;
  purchase_order_items: LPOItem[];
  profiles: {
    full_name: string;
  };
}

export function LPOTable() {
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLPO, setSelectedLPO] = useState<LPO | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    action: 'approve' | 'reject';
  } | null>(null);
  
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();

  const { data: lpos = [], isLoading } = useQuery<LPO[]>({
    queryKey: ['lpos'],
    queryFn: async () => {
      const response = await fetch('/api/lpo');
      if (!response.ok) throw new Error('Failed to fetch LPOs');
      return response.json();
    },
  });

  const filteredAndPaginatedLPOs = () => {
    let filtered = [...lpos];

    if (searchTerm) {
      filtered = filtered.filter(lpo => 
        lpo.supplier_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lpo.supplier_contact.includes(searchTerm) ||
        lpo.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lpo.purchase_order_items.some(item => 
          item.product.name.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      paginatedLPOs: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalLPOs: filtered.length,
    };
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['lpos'] });
  };

  const handleStatusChange = async (lpoId: string, action: 'approve' | 'reject') => {
    setPendingAction({ id: lpoId, action });
    setShowStatusDialog(true);
  };

  const handleConfirmStatusChange = async () => {
    if (!pendingAction) return;

    try {
      const response = await fetch('/api/lpo', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          id: pendingAction.id, 
          action: pendingAction.action 
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || `Failed to ${pendingAction.action} LPO`);
      }

      await queryClient.invalidateQueries({ queryKey: ['lpos'] });
      
      toast({
        title: "Success",
        description: `LPO ${pendingAction.action}ed successfully`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setShowStatusDialog(false);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className='w-[75vw] mx-auto mt-4 space-y-4'>
        <h2 className='text-3xl font-bold tracking-tight text-center'>Local Purchase Orders</h2>
        <div className='flex items-center justify-between gap-4'>
          <div className='w-72 h-10 bg-gray-200 animate-pulse rounded-md' />
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-32 h-6 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>
        <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
          <div className='grid grid-cols-8 gap-4 p-4 bg-gray-50/50'>
            {[...Array(8)].map((_, i) => (
              <div
                key={`header-${i}`}
                className='h-6 bg-gray-200 animate-pulse rounded-md'
              />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={`row-${i}`}
              className='grid grid-cols-8 gap-4 p-4 border-t border-gray-100/50'
            >
              {[...Array(8)].map((_, j) => (
                <div
                  key={`cell-${i}-${j}`}
                  className='h-6 bg-gray-200 animate-pulse rounded-md'
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  const { paginatedLPOs, totalPages, totalLPOs } = filteredAndPaginatedLPOs();

  return (
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Local Purchase Orders
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Manage and track purchase orders
        </p>
      </div>

      <div className='flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 shadow-sm'>
        <div className='relative w-full md:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50' />
          <Input
            placeholder='Search LPOs...'
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className='pl-9 border-gray-100/50 bg-white/50 focus:bg-white transition-colors'
          />
        </div>
        <div className='flex items-center gap-3'>
          <Button
            variant='outline'
            size='icon'
            onClick={handleRefresh}
            className='border-gray-100/50 hover:bg-white/50 transition-colors'>
            <RefreshCw className='h-4 w-4 text-muted-foreground/70' />
          </Button>
          <Badge variant='secondary' className='bg-white/50 text-muted-foreground/70'>
            {totalLPOs} {totalLPOs === 1 ? "LPO" : "LPOs"}
          </Badge>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50'>
              <TableHead className='font-medium'>Date</TableHead>
              <TableHead className='font-medium'>Supplier</TableHead>
              <TableHead className='font-medium'>Items</TableHead>
              <TableHead className='font-medium'>Location</TableHead>
              <TableHead className='font-medium'>Total Amount</TableHead>
              <TableHead className='font-medium'>Created By</TableHead>
              <TableHead className='font-medium'>Status</TableHead>
              <TableHead className='font-medium'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLPOs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  No LPOs found
                </TableCell>
              </TableRow>
            ) : (
              paginatedLPOs.map((lpo) => (
                <TableRow 
                  key={lpo.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => setSelectedLPO(lpo)}
                >
                  <TableCell>
                    {format(new Date(lpo.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{lpo.supplier_name}</span>
                      <span className="text-sm text-muted-foreground">
                        {lpo.supplier_contact}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {lpo.purchase_order_items.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.product.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {lpo.target_location}
                    </Badge>
                  </TableCell>
                  <TableCell>KES {lpo.total_amount}</TableCell>
                  <TableCell>{lpo.profiles.full_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        lpo.status === 'approved' 
                          ? 'default' 
                          : lpo.status === 'rejected'
                          ? 'destructive'
                          : 'outline'
                      }
                      className={cn(
                        lpo.status === 'approved'
                          ? "bg-green-100 text-green-800"
                          : lpo.status === 'rejected'
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      )}
                    >
                      {lpo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {lpo.status === 'pending' && user?.role === 'admin' && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(lpo.id, 'approve');
                            }}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Approve LPO
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(lpo.id, 'reject');
                            }}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject LPO
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
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
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => 
                    Math.min(prev + 1, totalPages)
                  )}
                  className={cn(
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.action === 'approve' ? 'Approve' : 'Reject'} LPO
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {pendingAction?.action} this LPO?
              {pendingAction?.action === 'approve' && (
                " This will update the inventory accordingly."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmStatusChange}
              className={cn(
                pendingAction?.action === 'approve'
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              )}
            >
              {pendingAction?.action === 'approve' ? 'Approve' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <LPODetailsSheet 
        lpo={selectedLPO}
        open={!!selectedLPO}
        onOpenChange={(open) => !open && setSelectedLPO(null)}
      />
    </div>
  );
} 