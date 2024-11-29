"use client";

import { SalesTable } from "@/components/sales/SalesTable";

export default function SalesPage() {
  return (
    <div className='space-y-6'>
      <h2 className='text-3xl font-bold text-center tracking-tight'>
        Sales Management
      </h2>
      <SalesTable />
    </div>
  );
}
