"use client";

import { LPOTable } from "@/components/lpo/LPOTable";

export default function LPOPage() {
  return (
    <div className="container mx-auto py-10">
      <h2 className="text-3xl font-bold tracking-tight mb-6 text-center">
        Local Purchase Orders
      </h2>
      <LPOTable />
    </div>
  );
}
