"use client";

import { RequestDeductionTable } from "@/components/request/RequestDeductionTable";

export default function RequestPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight text-center">
        Deduction Requests
      </h2>
      <RequestDeductionTable />
    </div>
  );
} 