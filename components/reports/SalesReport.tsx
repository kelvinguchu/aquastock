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
import { DateRange } from "react-day-picker";
import { ReportWrapper } from "./ReportWrapper";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface SaleItem {
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
  };
}

interface Sale {
  id: string;
  customer_name: string;
  customer_phone: string | null;
  customer_email: string | null;
  total_amount: number;
  payment_method: 'cash' | 'bank_transfer' | 'mpesa' | 'cheque';
  payment_reference: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles: {
    full_name: string;
  };
  approved_by_profile: {
    full_name: string;
  } | null;
  sale_items: SaleItem[];
}

export function SalesReport() {
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: sales = [], isLoading } = useQuery<Sale[]>({
    queryKey: ["sales", dateRange],
    queryFn: async () => {
      const response = await fetch("/api/sales");
      if (!response.ok) throw new Error("Failed to fetch sales");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const filteredSales = sales.filter((sale: Sale) => {
    if (dateRange?.from && dateRange.to) {
      const saleDate = new Date(sale.created_at);
      return saleDate >= dateRange.from && saleDate <= dateRange.to;
    }
    return true;
  });

  const totalSales = filteredSales.reduce(
    (acc: number, sale: Sale) => acc + sale.total_amount,
    0
  );

  const totalApprovedSales = filteredSales.filter(
    (sale: Sale) => sale.status === "approved"
  ).length;

  const totalPendingSales = filteredSales.filter(
    (sale: Sale) => sale.status === "pending"
  ).length;

  const handleExport = () => {
    // Implement CSV export logic
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await queryClient.invalidateQueries({ queryKey: ["sales"] });
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
          <div className='w-[280px] h-10 bg-gray-200 animate-pulse rounded-md' /> {/* Date picker */}
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Total Sales</CardTitle>
            <CardDescription>For selected period</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              KES {totalSales.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Approved Sales</CardTitle>
            <CardDescription>Number of approved sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalApprovedSales}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Sales</CardTitle>
            <CardDescription>Requires approval</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPendingSales}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Sales Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.map((sale: Sale) => (
                <TableRow key={sale.id}>
                  <TableCell>
                    {format(new Date(sale.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{sale.customer_name}</span>
                      {sale.customer_phone && (
                        <span className="text-sm text-muted-foreground">
                          {sale.customer_phone}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      {sale.sale_items.map((item: SaleItem, index: number) => (
                        <div key={index} className="text-sm">
                          {item.products.name} × {item.quantity}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>KES {sale.total_amount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {sale.payment_method.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        sale.status === "approved"
                          ? "default"
                          : sale.status === "pending"
                          ? "outline"
                          : "destructive"
                      }
                      className={cn(
                        sale.status === "approved"
                          ? "bg-green-100 text-green-800"
                          : sale.status === "pending"
                          ? "bg-yellow-100 text-yellow-800"
                          : "bg-red-100 text-red-800"
                      )}
                    >
                      {sale.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{sale.profiles.full_name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </ReportWrapper>
  );
} 