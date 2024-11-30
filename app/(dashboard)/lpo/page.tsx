"use client";

import { LPOTable } from "@/components/lpo/LPOTable";
import DashboardContent from "@/components/dashboard/DashboardContent";

export default function LPOPage() {
  return (
    <div className='w-[75vw] mx-auto mt-4 space-y-6'>
      <LPOTable />
    </div>
  );
}
