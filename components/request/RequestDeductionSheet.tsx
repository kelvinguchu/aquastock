"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { RequestDeductionForm } from "./RequestDeductionForm";

interface RequestDeductionSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDeductionSheet({ open, onOpenChange }: RequestDeductionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[95vw] sm:min-w-[50vw] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Request Deduction</SheetTitle>
          <SheetDescription>
            Submit a request to deduct inventory from Utawala store.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          <RequestDeductionForm onSuccess={() => onOpenChange(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
} 