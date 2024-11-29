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

interface InventoryRequest {
  id: string;
  product_id: string;
  quantity: number;
  status: "pending" | "approved" | "rejected";
  created_by: string;
  approved_by: string | null;
  created_at: string;
  updated_at: string;
  customer_id?: string;
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
  approved_by_profile?: {
    full_name: string;
  };
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

  const filteredRequests = requests.filter(
    (request: InventoryRequest) =>
      request.products.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.profiles.full_name
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
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
      const request = requests.find(
        (r: InventoryRequest) => r.id === requestId
      );
      if (request) {
        setSelectedRequest(request);
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
      const response = await fetch(`/api/inventory-requests/${pendingAction.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: 'rejected',
          approved_by: user.id,
        }),
      });

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
      <div className='w-[75vw] mx-auto'>
        <div className='flex items-center justify-center h-[400px]'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      </div>
    );
  }

  return (
    <div className='w-[75vw] mx-auto'>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <div className='relative w-full md:w-72'>
            <Search className='absolute left-2 top-2.5 h-4 w-4 text-muted-foreground' />
            <Input
              placeholder='Search requests...'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className='pl-8'
            />
          </div>
          <Button
            variant='outline'
            size='icon'
            onClick={handleRefresh}
            disabled={isRefreshing}>
            <RefreshCw
              className={cn("h-4 w-4", isRefreshing && "animate-spin")}
            />
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Request Details</CardTitle>
          </CardHeader>
          <CardContent className='p-0'>
            {filteredRequests.length === 0 ? (
              <div className='flex flex-col items-center justify-center h-[200px] text-muted-foreground'>
                <p>No deduction requests found</p>
                <p className='text-sm'>
                  Requests will appear here once created
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Approved By</TableHead>
                    <TableHead className='w-[150px]'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
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
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

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
                      customer_phone: selectedRequest.customer_phone,
                      customer_email: selectedRequest.customer_email,
                    }),
                  },
                ]
              : []
          }
        />

        <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Reject Request
              </AlertDialogTitle>
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
                className="bg-red-600 hover:bg-red-700"
              >
                Reject
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
