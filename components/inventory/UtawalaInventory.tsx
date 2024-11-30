"use client";

import { ProductList } from "./ProductList";

export default function UtawalaInventory() {
  return (
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <div className='flex flex-col items-center gap-2 mb-8'>
        <h2 className='text-3xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent'>
          Utawala Store
        </h2>
        <p className='text-sm text-muted-foreground/60'>
          Manage Utawala store inventory
        </p>
      </div>

      <div className='bg-white/50 backdrop-blur-sm border border-gray-100/50 rounded-lg p-6'>
        <ProductList location="utawala" />
      </div>
    </div>
  );
} 