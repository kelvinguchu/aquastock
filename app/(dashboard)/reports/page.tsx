"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SalesReport } from "@/components/reports/SalesReport";
import { InventoryReport } from "@/components/reports/InventoryReport";
import { TransfersReport } from "@/components/reports/TransfersReport";
import { LPOReport } from "@/components/reports/LPOReport";
import { FileText, Package, ArrowLeftRight, ClipboardList } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-center">Reports</h2>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" />
            Sales Report
          </TabsTrigger>
          <TabsTrigger value="inventory" className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Inventory Report
          </TabsTrigger>
          <TabsTrigger value="transfers" className="flex items-center gap-2">
            <ArrowLeftRight className="h-4 w-4" />
            Transfers Report
          </TabsTrigger>
          <TabsTrigger value="lpo" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            LPO Report
          </TabsTrigger>
        </TabsList>

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
      </Tabs>
    </div>
  );
}
