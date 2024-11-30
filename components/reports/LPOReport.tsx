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
import { Download, RefreshCw } from "lucide-react";
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

interface LPOItem {
  product: {
    name: string;
  };
  quantity: number;
}

interface LPO {
  id: string;
  created_at: string;
  supplier_name: string;
  supplier_contact: string;
  target_location: 'kamulu' | 'utawala';
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  purchase_order_items: LPOItem[];
  profiles: {
    full_name: string;
  };
}

export function LPOReport() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [filterLocation, setFilterLocation] = useState<string>("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: lpos = [], isLoading } = useQuery<LPO[]>({
    queryKey: ["lpos", dateRange],
    queryFn: async () => {
      const response = await fetch("/api/lpo");
      if (!response.ok) throw new Error("Failed to fetch LPOs");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["lpos"] });
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

  const filteredLPOs = lpos.filter((lpo: LPO) => {
    let matchesDate = true;
    let matchesLocation = true;

    if (dateRange?.from && dateRange.to) {
      const lpoDate = new Date(lpo.created_at);
      matchesDate = lpoDate >= dateRange.from && lpoDate <= dateRange.to;
    }

    if (filterLocation !== "all") {
      matchesLocation = lpo.target_location === filterLocation;
    }

    return matchesDate && matchesLocation;
  });

  // Calculate metrics
  const totalLPOs = filteredLPOs.length;
  const totalAmount = filteredLPOs.reduce(
    (acc: number, lpo: LPO) => acc + lpo.total_amount,
    0
  );
  const pendingLPOs = filteredLPOs.filter(
    (lpo: LPO) => lpo.status === "pending"
  ).length;
  const approvedLPOs = filteredLPOs.filter(
    (lpo: LPO) => lpo.status === "approved"
  ).length;

  const handleExport = () => {
    // Implement CSV export logic
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {/* Filters skeleton */}
        <div className='flex items-center justify-between'>
          <div className='flex gap-4'>
            <div className='w-[280px] h-10 bg-gray-200 animate-pulse rounded-md' /> {/* Date picker */}
            <div className='w-[180px] h-10 bg-gray-200 animate-pulse rounded-md' /> {/* Location select */}
          </div>
          <div className='flex gap-2'>
            <div className='w-24 h-10 bg-gray-200 animate-pulse rounded-md' />
            <div className='w-24 h-10 bg-gray-200 animate-pulse rounded-md' />
          </div>
        </div>

        {/* Stats cards skeleton */}
        <div className='grid gap-4 md:grid-cols-4'>
          {[...Array(4)].map((_, i) => (
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
              <div className='grid grid-cols-8 gap-4 pb-4'>
                {[...Array(8)].map((_, i) => (
                  <div key={i} className='h-4 bg-gray-200 animate-pulse rounded-md' />
                ))}
              </div>
              {/* Table rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className='grid grid-cols-8 gap-4 py-3 border-t border-gray-100/50'>
                  {[...Array(8)].map((_, j) => (
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
            value={filterLocation}
            onValueChange={setFilterLocation}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter location" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="kamulu">Kamulu Store</SelectItem>
              <SelectItem value="utawala">Utawala Store</SelectItem>
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
            Export Report
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Total LPOs</CardTitle>
            <CardDescription>For selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalLPOs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Amount</CardTitle>
            <CardDescription>Value of all LPOs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalAmount.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved</CardTitle>
            <CardDescription>Approved LPOs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedLPOs}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Awaiting approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingLPOs}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>LPO Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLPOs.map((lpo: LPO) => (
                <TableRow key={lpo.id}>
                  <TableCell>
                    {format(new Date(lpo.created_at), "dd/MM/yyyy")}
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
                    <Badge variant="outline">
                      {lpo.target_location}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {lpo.purchase_order_items.map((item: LPOItem, index: number) => (
                        <div key={index} className="text-sm">
                          {item.product.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>KES {lpo.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        lpo.status === "approved"
                          ? "default"
                          : lpo.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className={cn(
                        lpo.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : lpo.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {lpo.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{lpo.profiles.full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportWrapper>
  );
} 