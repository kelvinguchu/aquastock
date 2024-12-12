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
import { DatePicker } from "@/components/ui/date-picker";
import { DateRangePicker } from "@/components/ui/date-range-picker";
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
import { DateRange } from "react-day-picker";
import { ReportWrapper } from "./ReportWrapper";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { pdf } from "@react-pdf/renderer";
import { TransfersReportPDF } from '../pdf/TransfersReportPDF';
import { ClearDateFilters } from "./ClearDateFilters";

interface TransferItem {
  product: {
    name: string;
  };
  quantity: number;
}

interface Transfer {
  id: string;
  created_at: string;
  from_location: string;
  to_location: string;
  total_items: number;
  status: 'pending' | 'completed' | 'cancelled';
  transfer_items: TransferItem[];
  profiles: {
    full_name: string;
  };
}

export function TransfersReport() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | null>(null);
  const [activeFilter, setActiveFilter] = useState<'single' | 'range' | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Handler for single date selection
  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
    setDateRange(null); // Clear range when single date is selected
    setActiveFilter(date ? 'single' : null);
  };

  // Handler for date range selection
  const handleDateRangeChange = (range: DateRange | null) => {
    setDateRange(range);
    setSelectedDate(null); // Clear single date when range is selected
    setActiveFilter(range ? 'range' : null);
  };

  const handleClearFilters = () => {
    setSelectedDate(null);
    setDateRange(null);
    setActiveFilter(null);
  };

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
    if (activeFilter === 'single' && selectedDate) {
      const transferDate = new Date(transfer.created_at);
      const compareDate = new Date(selectedDate);
      
      // Set hours to 0 for accurate date comparison
      transferDate.setHours(0, 0, 0, 0);
      compareDate.setHours(0, 0, 0, 0);
      
      return transferDate.getTime() === compareDate.getTime();
    }

    if (activeFilter === 'range' && dateRange?.from && dateRange.to) {
      const transferDate = new Date(transfer.created_at);
      const startDate = new Date(dateRange.from);
      const endDate = new Date(dateRange.to);
      
      // Set hours to 0 for accurate date comparison
      transferDate.setHours(0, 0, 0, 0);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return transferDate >= startDate && transferDate <= endDate;
    }

    return true;
  });

  const totalTransfers = filteredTransfers.length;
  const pendingTransfers = filteredTransfers.filter(
    (transfer: Transfer) => transfer.status === "pending"
  ).length;
  const approvedTransfers = filteredTransfers.filter(
    (transfer: Transfer) => transfer.status === "completed"
  ).length;

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

  const handleExportPDF = async () => {
    try {
      const logoResponse = await fetch('/api/logo');
      const { logo } = await logoResponse.json();

      const transfersForPDF = filteredTransfers.map(transfer => ({
        ...transfer,
        transfer_number: `TRF-${transfer.id.slice(0, 8)}`,
      }));

      const dateFilter = activeFilter 
        ? {
            type: activeFilter,
            ...(activeFilter === 'single' && selectedDate 
              ? { date: selectedDate }
              : activeFilter === 'range' && dateRange?.from && dateRange.to
              ? { 
                  dateRange: {
                    startDate: dateRange.from,
                    endDate: dateRange.to
                  }
                }
              : {}
            )
          }
        : undefined;

      const blob = await pdf(
        <TransfersReportPDF
          transfers={transfersForPDF}
          totalTransfers={totalTransfers}
          dateFilter={dateFilter}
          logo={logo}
        />
      ).toBlob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `transfers-report-${format(new Date(), 'yyyy-MM-dd')}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "PDF generated successfully",
      });
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to generate PDF",
      });
    }
  };

  if (isLoading) {
    return (
      <div className='space-y-6'>
        {/* Filters skeleton */}
        <div className='flex items-center justify-between'>
          <div className='w-[280px] h-10 bg-gray-200 animate-pulse rounded-md' />
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
              <div className='grid grid-cols-6 gap-4 pb-4'>
                {[...Array(6)].map((_, i) => (
                  <div key={i} className='h-4 bg-gray-200 animate-pulse rounded-md' />
                ))}
              </div>
              {/* Table rows */}
              {[...Array(5)].map((_, i) => (
                <div key={i} className='grid grid-cols-6 gap-4 py-3 border-t border-gray-100/50'>
                  {[...Array(6)].map((_, j) => (
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
        <div className="flex items-center gap-4">
          <div className="flex gap-4">
            <DatePicker
              date={selectedDate}
              onDateChange={handleDateChange}
            />
            <span className="text-sm text-muted-foreground">or</span>
            <DateRangePicker
              dateRange={dateRange}
              onDateRangeChange={handleDateRangeChange}
            />
          </div>
          <ClearDateFilters 
            show={!!selectedDate || !!dateRange}
            onClear={handleClearFilters}
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
          <Button variant="outline" onClick={handleExportPDF}>
            <Download className="mr-2 h-4 w-4" />
            Export PDF
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
            <CardTitle>Approved</CardTitle>
            <CardDescription>Approved transfers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedTransfers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending</CardTitle>
            <CardDescription>Awaiting approval</CardDescription>
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
                <TableHead>From</TableHead>
                <TableHead>To</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransfers.map((transfer: Transfer) => (
                <TableRow key={transfer.id}>
                  <TableCell>
                    {format(new Date(transfer.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="capitalize">{transfer.from_location}</TableCell>
                  <TableCell className="capitalize">{transfer.to_location}</TableCell>
                  <TableCell>{transfer.total_items}</TableCell>
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