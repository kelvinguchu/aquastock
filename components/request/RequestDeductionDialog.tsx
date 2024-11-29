"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { RequestDeductionForm } from "./RequestDeductionForm";

interface RequestDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function RequestDeductionDialog({ open, onOpenChange }: RequestDeductionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Request Deduction</DialogTitle>
          <DialogDescription>
            Submit a request to deduct inventory from Utawala store.
          </DialogDescription>
        </DialogHeader>
        <RequestDeductionForm onSuccess={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
} 