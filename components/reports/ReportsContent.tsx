"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport } from "@/components/reports/SalesReport";
import { InventoryReport } from "@/components/reports/InventoryReport";
import { TransfersReport } from "@/components/reports/TransfersReport";
import { LPOReport } from "@/components/reports/LPOReport";
import { FileText, Package, ArrowLeftRight, ClipboardList } from "lucide-react";

export function ReportsContent() {
  return (
    <div className='w-full mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Reports
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          View and analyze business data
        </p>
      </div>

      <Tabs defaultValue="sales" className='space-y-4'>
        <TabsList className='bg-white/50 backdrop-blur-sm border border-gray-100/50 p-1'>
          <TabsTrigger value="sales" className='flex items-center gap-2'>
            <ClipboardList className='h-4 w-4' />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="inventory" className='flex items-center gap-2'>
            <Package className='h-4 w-4' />
            Inventory Report
          </TabsTrigger>
          <TabsTrigger value="transfers" className='flex items-center gap-2'>
            <ArrowLeftRight className='h-4 w-4' />
            Transfers Report
          </TabsTrigger>
          <TabsTrigger value="lpo" className='flex items-center gap-2'>
            <FileText className='h-4 w-4' />
            LPO Report
          </TabsTrigger>
        </TabsList>

        <div className='bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-lg p-6'>
          <TabsContent value="sales">
            <SalesReport />
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryReport />
          </TabsContent>

          <TabsContent value="transfers">
            <TransfersReport />
          </TabsContent>

          <TabsContent value="lpo">
            <LPOReport />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
} 