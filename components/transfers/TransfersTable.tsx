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
import { Loader } from "@/components/ui/loader";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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

  const handleStatusChange = async (transferId: string, newStatus: 'pending' | 'completed' | 'cancelled') => {
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
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const { paginatedTransfers, totalPages, totalTransfers } = filteredAndPaginatedTransfers();

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight text-center">
        Transfer History
      </h2>

      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transfers..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Total: {totalTransfers} transfers
          </div>
        </div>
      </div>

      <div className={`rounded-md border transition-all duration-300 ${
        state === "expanded" ? "w-[75vw]" : "w-[93vw]"
      }`}>
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
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant={
                            transfer.status === 'completed' 
                              ? 'default' 
                              : transfer.status === 'pending'
                              ? 'outline'
                              : 'destructive'
                          }
                          className={cn(
                            "cursor-pointer",
                            transfer.status === 'completed' 
                              ? "bg-green-100 text-green-800" 
                              : transfer.status === 'pending'
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          )}
                        >
                          {transfer.status}
                        </Badge>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {transfer.status !== 'completed' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(transfer.id, 'completed')}
                            className="text-green-600"
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            Mark as Completed
                          </DropdownMenuItem>
                        )}
                        {transfer.status !== 'pending' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(transfer.id, 'pending')}
                            className="text-yellow-600"
                          >
                            <Clock className="mr-2 h-4 w-4" />
                            Mark as Pending
                          </DropdownMenuItem>
                        )}
                        {transfer.status !== 'cancelled' && (
                          <DropdownMenuItem
                            onClick={() => handleStatusChange(transfer.id, 'cancelled')}
                            className="text-red-600"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Cancel Transfer
                          </DropdownMenuItem>
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
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
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