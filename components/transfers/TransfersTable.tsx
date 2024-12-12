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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, RefreshCw, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { format } from "date-fns";
import {Loader2} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface Transfer {
  id: string;
  product_id: string;
  from_location: 'kamulu' | 'utawala';
  to_location: 'kamulu' | 'utawala';
  quantity: number;
  status: 'pending' | 'completed' | 'cancelled';
  transferred_by: string;
  created_at: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

export function TransfersTable() {
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const canManageTransfers = user?.role === "clerk";

  const { data: transfers = [], isLoading } = useQuery({
    queryKey: ['transfers'],
    queryFn: async () => {
      const response = await fetch('/api/transfers');
      if (!response.ok) throw new Error('Failed to fetch transfers');
      return response.json();
    },
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const filteredAndPaginatedTransfers = () => {
    let filtered = [...transfers];

    if (searchTerm) {
      filtered = filtered.filter(transfer => 
        transfer.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.from_location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transfer.to_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      paginatedTransfers: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalTransfers: filtered.length,
    };
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
  };

  const [statusLoading, setStatusLoading] = useState<string | null>(null);

  const handleStatusChange = async (transferId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
    if (!canManageTransfers) {
      toast({
        variant: "destructive",
        title: "Unauthorized",
        description: "Only clerks can manage transfer statuses",
      });
      return;
    }

    setStatusLoading(transferId);

    try {
      const response = await fetch(`/api/transfers/${transferId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      await queryClient.invalidateQueries({ queryKey: ['transfers'] });
      
      toast({
        title: "Success",
        description: "Transfer status updated successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to update status",
      });
    } finally {
      setStatusLoading(null);
    }
  };

  if (isLoading) {
    return (
      <div className='w-[75vw] mx-auto mt-4 space-y-6'>
        <h2 className='text-3xl font-bold tracking-tight text-center'>Transfer History</h2>
        <div className='flex flex-col items-center gap-2 mb-8'>
          <div className='w-32 h-4 bg-gray-200 animate-pulse rounded-md' />
        </div>

        <div className='flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 shadow-sm'>
          <div className='w-72 h-10 bg-gray-200 animate-pulse rounded-md' />
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-32 h-6 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>

        <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
          <div className='p-4 space-y-4'>
            <div className='grid grid-cols-7 gap-4 pb-4'>
              {[...Array(7)].map((_, i) => (
                <div key={i} className='h-4 bg-gray-200 animate-pulse rounded-md' />
              ))}
            </div>
            {[...Array(5)].map((_, i) => (
              <div key={i} className='grid grid-cols-7 gap-4 py-3 border-t border-gray-100/50'>
                {[...Array(7)].map((_, j) => (
                  <div key={j} className='h-4 bg-gray-200 animate-pulse rounded-md' />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const { paginatedTransfers, totalPages, totalTransfers } = filteredAndPaginatedTransfers();

  return (
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Transfer History
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Track and manage stock transfers between locations
        </p>
      </div>

      <div className='flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 shadow-sm'>
        <div className='relative w-full md:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50' />
          <Input
            placeholder='Search transfers...'
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
            {totalTransfers} {totalTransfers === 1 ? "transfer" : "transfers"}
          </Badge>
        </div>
      </div>

      <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>From</TableHead>
              <TableHead>To</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Transferred By</TableHead>
              <TableHead>Status</TableHead>
              {canManageTransfers && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedTransfers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-4">
                  No transfers found
                </TableCell>
              </TableRow>
            ) : (
              paginatedTransfers.map((transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {format(new Date(transfer.created_at), 'dd/MM/yyyy HH:mm')}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transfer.products?.name || 'Unknown Product'}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-red-100 text-red-800">
                      {transfer.from_location}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      {transfer.to_location}
                    </Badge>
                  </TableCell>
                  <TableCell>{transfer.quantity}</TableCell>
                  <TableCell>{transfer.profiles.full_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transfer.status === 'completed' 
                          ? 'default' 
                          : transfer.status === 'pending'
                          ? 'outline'
                          : 'destructive'
                      }
                      className={cn(
                        transfer.status === 'completed' 
                          ? "bg-green-100 text-green-800" 
                          : transfer.status === 'pending'
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {transfer.status}
                    </Badge>
                  </TableCell>
                  {canManageTransfers && (
                    <TableCell className="text-right">
                      {transfer.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusChange(transfer.id, 'completed')}
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                            disabled={statusLoading === transfer.id}
                          >
                            {statusLoading === transfer.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Complete'
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(transfer.id, 'cancelled')}
                            className="text-red-800 hover:bg-red-100"
                            disabled={statusLoading === transfer.id}
                          >
                            {statusLoading === transfer.id ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Updating...
                              </>
                            ) : (
                              'Cancel'
                            )}
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  )}
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
    </div>
  );
} 