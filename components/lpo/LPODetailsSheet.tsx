"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface LPOItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    name: string;
  };
}

interface LPO {
  id: string;
  supplier_name: string;
  supplier_contact: string;
  target_location: 'kamulu' | 'utawala';
  total_amount: number;
  status: 'pending' | 'approved' | 'rejected';
  notes: string | null;
  created_at: string;
  created_by: string;
  approved_by: string | null;
  purchase_order_items: LPOItem[];
  profiles: {
    full_name: string;
  };
  approved_by_profile?: {
    full_name: string;
  } | null;
}

interface LPODetailsSheetProps {
  lpo: LPO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LPODetailsSheet({ lpo, open, onOpenChange }: LPODetailsSheetProps) {
  if (!lpo) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="min-w-[50vw] overflow-y-auto">
        <SheetHeader className="space-y-6">
          <div className="flex items-center justify-between">
            <SheetTitle>LPO Details</SheetTitle>
            <Badge
              variant={
                lpo.status === 'approved' 
                  ? 'default' 
                  : lpo.status === 'rejected'
                  ? 'destructive'
                  : 'outline'
              }
              className={cn(
                "text-base px-4 py-1",
                lpo.status === 'approved' 
                  ? "bg-green-100 text-green-800" 
                  : lpo.status === 'rejected'
                  ? "bg-red-100 text-red-800"
                  : "bg-yellow-100 text-yellow-800"
              )}
            >
              {lpo.status.toUpperCase()}
            </Badge>
          </div>
        </SheetHeader>

        <div className="mt-8 space-y-6">
          {/* Supplier Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Supplier Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{lpo.supplier_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Contact</p>
                <p className="font-medium">{lpo.supplier_contact}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Target Location</p>
                <p className="font-medium capitalize">{lpo.target_location}</p>
              </div>
              {lpo.notes && (
                <div className="col-span-2">
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="font-medium">{lpo.notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Items</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lpo.purchase_order_items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.product.name}</TableCell>
                    <TableCell className="text-right">{item.quantity}</TableCell>
                    <TableCell className="text-right">KES {item.unit_price}</TableCell>
                    <TableCell className="text-right">KES {item.total_price}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} className="text-right font-bold">
                    Total Amount
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    KES {lpo.total_amount}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Created By</p>
                <p className="font-medium">{lpo.profiles.full_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-medium">
                  {format(new Date(lpo.created_at), 'dd/MM/yyyy HH:mm')}
                </p>
              </div>
              {lpo.approved_by_profile && (
                <div>
                  <p className="text-sm text-muted-foreground">Approved By</p>
                  <p className="font-medium">{lpo.approved_by_profile.full_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 