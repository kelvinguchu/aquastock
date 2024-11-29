"use client";

import { Package, Warehouse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductList } from "./ProductList";

export default function Inventory() {
  return (
    <div className='space-y-6'>
      <h2 className='text-3xl font-bold tracking-tight text-center'>
        Inventory Management
      </h2>

      <Tabs defaultValue='utawala' className='space-y-4'>
        <TabsList>
          <TabsTrigger value='utawala' className='flex items-center gap-2'>
            <Warehouse className='h-4 w-4' />
            Utawala Store
          </TabsTrigger>
          <TabsTrigger value='kamulu' className='flex items-center gap-2'>
            <Warehouse className='h-4 w-4' />
            Kamulu Store
          </TabsTrigger>
        </TabsList>

        <TabsContent value='utawala'>
          <ProductList location='utawala' />
        </TabsContent>

        <TabsContent value='kamulu'>
          <ProductList location='kamulu' />
        </TabsContent>
      </Tabs>
    </div>
  );
}
