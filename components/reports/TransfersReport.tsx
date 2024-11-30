"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import { ReportWrapper } from "./ReportWrapper";
import { useToast } from "@/hooks/use-toast";

interface Transfer {
  id: string;
  created_at: string;
  from_location: 'kamulu' | 'utawala';
  to_location: 'kamulu' | 'utawala';
  quantity: number;
  status: 'completed' | 'pending' | 'cancelled';
  products: {
    name: string;
  };
  profiles: {
    full_name: string;
  };
}

export function TransfersReport() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [filterDirection, setFilterDirection] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: transfers = [], isLoading } = useQuery<Transfer[]>({
    queryKey: ["transfers", dateRange],
    queryFn: async () => {
      const response = await fetch("/api/transfers");
      if (!response.ok) throw new Error("Failed to fetch transfers");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const filteredTransfers = transfers.filter((transfer: Transfer) => {
    let matchesDate = true;
    let matchesDirection = true;

    if (dateRange?.from && dateRange.to) {
      const transferDate = new Date(transfer.created_at);
      matchesDate = transferDate >= dateRange.from && transferDate <= dateRange.to;
    }

    if (filterDirection !== "all") {
      matchesDirection = `${transfer.from_location}-${transfer.to_location}` === filterDirection;
    }

    return matchesDate && matchesDirection;
  });

  // Calculate metrics
  const totalTransfers = filteredTransfers.length;
  const completedTransfers = filteredTransfers.filter(
    (t: any) => t.status === "completed"
  ).length;
  const pendingTransfers = filteredTransfers.filter(
    (t: any) => t.status === "pending"
  ).length;

  const handleExport = () => {
    // Implement CSV export logic
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["transfers"] });
      toast({
        title: "Success",
        description: "Report data refreshed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh report data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {/* Filters skeleton */}
        <div className='flex items-center justify-between'>
          <div className='flex gap-4'>
            <div className='w-[280px] h-10 bg-gray-200 animate-pulse rounded-md' /> {/* Date picker */}
            <div className='w-[200px] h-10 bg-gray-200 animate-pulse rounded-md' /> {/* Direction select */}
          </div>
          <div className='flex gap-2'>
            <div className='w-24 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-24 h-10 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className='grid gap-4 md:grid-cols-3'>
          {[...Array(3)].map((_, i) => (
            <div key={i} className='p-6 rounded-lg border border-gray-100/50 bg-white/50'>
              <div className='space-y-3'>
                <div className='w-24 h-5 bg-gray-200 animate-pulse rounded-md' />
                <div className='w-16 h-4 bg-gray-200 animate-pulse rounded-md' />
                <div className='w-32 h-8 bg-gray-200 animate-pulse rounded-md' />
              </div>
            </div>
          ))}
        </div>

        {/* Table skeleton */}
        <div className='rounded-lg border border-gray-100/50 bg-white/50'>
          <div className='p-4 space-y-4'>
            <div className='w-48 h-6 bg-gray-200 animate-pulse rounded-md' />
            <div className='space-y-3'>
              {/* Table header */}
              <div className='grid grid-cols-7 gap-4 pb-4'>
                {[...Array(7)].map((_, i) => (
                  <div key={i} className='h-4 bg-gray-200 animate-pulse rounded-md' />
                ))}
              </div>
              {/* Table rows */}
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
      </div>
    );
  }

  return (
    <ReportWrapper>
      <div className="flex items-center justify-between">
        <div className="flex gap-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={(date: DateRange | null) => setDateRange(date)}
          />
          <Select
            value={filterDirection}
            onValueChange={setFilterDirection}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Transfers</SelectItem>
              <SelectItem value="kamulu-utawala">Kamulu → Utawala</SelectItem>
              <SelectItem value="utawala-kamulu">Utawala → Kamulu</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              isRefreshing && "animate-spin"
            )} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Transfers</CardTitle>
            <CardDescription>For selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTransfers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Completed</CardTitle>
            <CardDescription>Successfully transferred</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedTransfers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Awaiting completion</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingTransfers}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transfer Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Transferred By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer: any) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {format(new Date(transfer.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="font-medium">
                    {transfer.products.name}
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
                  <TableCell>
                    <Badge
                      variant={
                        transfer.status === "completed"
                          ? "default"
                          : transfer.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className={cn(
                        transfer.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : transfer.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {transfer.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{transfer.profiles.full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportWrapper>
  );
} 