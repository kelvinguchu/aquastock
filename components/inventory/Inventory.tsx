"use client";

import { Package, Warehouse } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProductList } from "./ProductList";
import { useQuery } from "@tanstack/react-query";

export default function Inventory() {
  // Add a loading state (you can use any loading condition that makes sense for your app)
  const isLoading = false; // Replace with actual loading state if needed

  if (isLoading) {
    return (
      <div className='w-[75vw] mx-auto mt-4 space-y-6'>
        {/* Header skeleton */}
        <div className='flex flex-col items-center gap-2 mb-8'>
          <div className='w-48 h-8 bg-gray-200 animate-pulse rounded-md' />
          <div className='w-32 h-4 bg-gray-200 animate-pulse rounded-md' />
        </div>

        {/* Tabs skeleton */}
        <div className='space-y-4'>
          <div className='bg-white/50 backdrop-blur-sm border border-gray-100/50 p-1 rounded-lg'>
            <div className='flex gap-2'>
              <div className='w-32 h-10 bg-gray-200 animate-pulse rounded-md' />
              <div className='w-32 h-10 bg-gray-200 animate-pulse rounded-md' />
            </div>
          </div>

          <div className='bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-lg p-6'>
            {/* Content skeleton */}
            <div className='space-y-4'>
              <div className='grid grid-cols-5 gap-4'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className='h-4 bg-gray-200 animate-pulse rounded-md' />
                ))}
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className='grid grid-cols-5 gap-4 py-3 border-t border-gray-100/50'>
                  {[...Array(5)].map((_, j) => (
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
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Inventory Management
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Manage stock levels across locations
        </p>
      </div>

      <Tabs defaultValue='utawala' className='space-y-4'>
        <TabsList className='bg-white/50 backdrop-blur-sm border border-gray-100/50 p-1'>
          <TabsTrigger value='utawala' className='flex items-center gap-2'>
            <Warehouse className='h-4 w-4' />
            Utawala Store
          </TabsTrigger>
          <TabsTrigger value='kamulu' className='flex items-center gap-2'>
            <Warehouse className='h-4 w-4' />
            Kamulu Store
          </TabsTrigger>
        </TabsList>

        <div className='bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-lg p-6'>
          <TabsContent value='utawala'>
            <ProductList location='utawala' />
          </TabsContent>

          <TabsContent value='kamulu'>
            <ProductList location='kamulu' />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
