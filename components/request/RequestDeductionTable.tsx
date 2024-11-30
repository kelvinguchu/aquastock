"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Loader2, Search, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
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
import { cn } from "@/lib/utils";
import { CreateSaleFromRequestDialog } from "@/components/sales/CreateSaleFromRequestDialog";
import { useDeductionRequests } from "@/hooks/use-deduction-requests";
import { FileDown } from "lucide-react";

interface InventoryRequest {
  id: string;
  product_id: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  customer_id?: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
  approved_by_profile?: {
    full_name: string;
  };
  customers?: {
    id: string;
    name: string;
    phone: string | null;
    email: string | null;
  } | null;
}

interface PendingAction {
  id: string;
  action: "approve" | "reject";
}

export function RequestDeductionTable() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(
    null
  );
  const [showCreateSaleDialog, setShowCreateSaleDialog] = useState(false);
  const [selectedRequest, setSelectedRequest] =
    useState<InventoryRequest | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { requests, isLoading, refreshRequests } = useDeductionRequests();

  const filteredRequests = (requests as InventoryRequest[]).filter(
    (request) =>
      request.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles.full_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshRequests();
      toast({
        title: "Success",
        description: "Data refreshed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStatusChange = async (
    requestId: string,
    action: "approve" | "reject"
  ) => {
    if (action === "approve") {
      const request = (requests as InventoryRequest[]).find(
        (r) => r.id === requestId
      );
      if (request) {
        const customerName = request.customers?.name || request.customer_name || "";
        const customerPhone = request.customers?.phone || request.customer_phone || "";
        const customerEmail = request.customers?.email || request.customer_email || "";

        setSelectedRequest({
          ...request,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_email: customerEmail,
        } as InventoryRequest);
        setShowCreateSaleDialog(true);
      }
    } else {
      setPendingAction({ id: requestId, action });
      setShowStatusDialog(true);
    }
  };

  const handleReject = async () => {
    if (!pendingAction || !user?.id) return;

    try {
      const response = await fetch(
        `/api/inventory-requests/${pendingAction.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            status: "rejected",
            approved_by: user.id,
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to reject request");
      }

      await refreshRequests();

      toast({
        title: "Success",
        description: "Request rejected successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to reject request",
      });
    } finally {
      setShowStatusDialog(false);
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className='w-[75vw] mx-auto mt-4 space-y-4'>
        <h2 className='text-3xl font-bold tracking-tight text-center'>Deduction Requests</h2>
        <div className='flex items-center justify-between gap-4'>
          <div className='w-72 h-10 bg-gray-200 animate-pulse rounded-md' />
          <div className='flex items-center gap-4'>
            <div className='w-10 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-32 h-6 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>
        <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
          <div className='grid grid-cols-7 gap-4 p-4 bg-gray-50/50'>
            {[...Array(7)].map((_, i) => (
              <div
                key={`header-${i}`}
                className='h-6 bg-gray-200 animate-pulse rounded-md'
              />
            ))}
          </div>
          {[...Array(5)].map((_, i) => (
            <div
              key={`row-${i}`}
              className='grid grid-cols-7 gap-4 p-4 border-t border-gray-100/50'
            >
              {[...Array(7)].map((_, j) => (
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

  return (
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Deduction Requests
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Manage and process deduction requests
        </p>
      </div>

      <div className='flex items-center justify-between gap-4 bg-white/50 backdrop-blur-sm p-4 rounded-lg border border-gray-100/50 shadow-sm'>
        <div className='relative w-full md:w-72'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50' />
          <Input
            placeholder='Search requests...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='pl-9 border-gray-100/50 bg-white/50 focus:bg-white transition-colors'
          />
        </div>
        <Button
          variant='outline'
          size='icon'
          onClick={handleRefresh}
          disabled={isRefreshing}
          className='border-gray-100/50 hover:bg-white/50 transition-colors'>
          <RefreshCw
            className={cn(
              "h-4 w-4 text-muted-foreground/70",
              isRefreshing && "animate-spin"
            )}
          />
        </Button>
      </div>

      <div className='overflow-hidden rounded-lg border border-gray-100/50 bg-white/50 backdrop-blur-sm shadow-sm'>
        <Table>
          <TableHeader>
            <TableRow className='bg-gray-50/50'>
              <TableHead className='font-medium'>Date</TableHead>
              <TableHead className='font-medium'>Product</TableHead>
              <TableHead className='font-medium'>Quantity</TableHead>
              <TableHead className='font-medium'>Requested By</TableHead>
              <TableHead className='font-medium'>Status</TableHead>
              <TableHead className='font-medium'>Processed By</TableHead>
              <TableHead className='w-[150px] font-medium'>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRequests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className='h-32 text-center'>
                  <div className='flex flex-col items-center gap-2'>
                    <FileDown className='h-8 w-4 text-gray-400' />
                    <p className='text-muted-foreground'>No requests found</p>
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
              filteredRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    {format(new Date(request.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className='font-medium'>
                    {request.products.name}
                  </TableCell>
                  <TableCell>{request.quantity}</TableCell>
                  <TableCell>{request.profiles.full_name}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        request.status === "approved"
                          ? "default"
                          : request.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className={cn(
                        "transition-all duration-300",
                        request.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : request.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      )}>
                      {request.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {request.approved_by_profile?.full_name || "-"}
                  </TableCell>
                  <TableCell>
                    {request.status === "pending" && (
                      <div className='flex items-center gap-2'>
                        <Button
                          size='sm'
                          onClick={() =>
                            handleStatusChange(request.id, "approve")
                          }
                          className='bg-green-100 text-green-800 hover:bg-green-200'>
                          Approve
                        </Button>
                        <Button
                          size='sm'
                          variant='outline'
                          onClick={() =>
                            handleStatusChange(request.id, "reject")
                          }
                          className='text-red-800 hover:bg-red-100'>
                          Reject
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <CreateSaleFromRequestDialog
        open={showCreateSaleDialog}
        onOpenChange={setShowCreateSaleDialog}
        defaultProducts={
          selectedRequest
            ? [
                {
                  product_id: selectedRequest.product_id,
                  product_name: selectedRequest.products.name,
                  quantity: selectedRequest.quantity,
                  requestId: selectedRequest.id,
                  ...(selectedRequest.customer_name && {
                    customer_name: selectedRequest.customer_name,
                    customer_phone: selectedRequest.customer_phone || undefined,
                    customer_email: selectedRequest.customer_email || undefined,
                  }),
                },
              ]
            : []
        }
      />

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this request?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingAction(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className='bg-red-600 hover:bg-red-700'>
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
