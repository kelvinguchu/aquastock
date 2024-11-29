"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getLocationProducts, updateStockLevel, recordTransfer } from "@/lib/supabase/supabase-actions";
import { useToast } from "@/hooks/use-toast";
import { TransferTables } from "./TransferTables";
import { useAuth } from "@/hooks/use-auth";

interface TransferDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function TransferDrawer({ open, onOpenChange }: TransferDrawerProps) {
  const [selectedProducts, setSelectedProducts] = useState<Map<string, number>>(new Map());
  const [showTransferDialog, setShowTransferDialog] = useState(false);
  const [transferDirection, setTransferDirection] = useState<'kamulu-to-utawala' | 'utawala-to-kamulu'>('kamulu-to-utawala');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  // Get source products
  const { data: sourceProducts = [] } = useQuery({
    queryKey: ['products', transferDirection === 'kamulu-to-utawala' ? 'kamulu' : 'utawala'],
    queryFn: () => getLocationProducts(transferDirection === 'kamulu-to-utawala' ? 'kamulu' : 'utawala'),
    enabled: open,
  });

  // Get target products
  const { data: targetProducts = [] } = useQuery({
    queryKey: ['products', transferDirection === 'kamulu-to-utawala' ? 'utawala' : 'kamulu'],
    queryFn: () => getLocationProducts(transferDirection === 'kamulu-to-utawala' ? 'utawala' : 'kamulu'),
    enabled: open,
  });

  const handleTransfer = async () => {
    try {
      const fromLocation = transferDirection === 'kamulu-to-utawala' ? 'kamulu' : 'utawala';
      const toLocation = transferDirection === 'kamulu-to-utawala' ? 'utawala' : 'kamulu';

      if (!user) {
        throw new Error("Not authenticated");
      }

      // Process all selected products
      await Promise.all(
        Array.from(selectedProducts.entries()).map(async ([productId, amount]) => {
          const sourceProduct = sourceProducts.find(p => p.id === productId);
          const targetProduct = targetProducts.find(p => p.id === productId);
          
          if (!sourceProduct || !targetProduct) return;

          await recordTransfer({
            product_id: productId,
            from_location: fromLocation,
            to_location: toLocation,
            quantity: amount,
            transferred_by: user.id,
          });
        })
      );

      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Transfer completed successfully",
      });
      setSelectedProducts(new Map());
      setShowTransferDialog(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleRemoveProduct = (productId: string) => {
    const newSelectedProducts = new Map(selectedProducts);
    newSelectedProducts.delete(productId);
    setSelectedProducts(newSelectedProducts);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="h-[95vh]">
        <DrawerHeader>
          <DrawerTitle>Transfer Inventory</DrawerTitle>
          <DrawerDescription>
            Transfer products between locations
          </DrawerDescription>
        </DrawerHeader>

        <div className="flex flex-col gap-4 p-4">
          <div className="flex items-center gap-4">
            <Button
              variant={transferDirection === 'kamulu-to-utawala' ? 'default' : 'outline'}
              onClick={() => {
                setTransferDirection('kamulu-to-utawala');
                setSelectedProducts(new Map());
              }}
            >
              Kamulu → Utawala
            </Button>
            <Button
              variant={transferDirection === 'utawala-to-kamulu' ? 'default' : 'outline'}
              onClick={() => {
                setTransferDirection('utawala-to-kamulu');
                setSelectedProducts(new Map());
              }}
            >
              Utawala → Kamulu
            </Button>
          </div>

          <TransferTables 
            fromLocation={transferDirection === 'kamulu-to-utawala' ? 'kamulu' : 'utawala'}
            toLocation={transferDirection === 'kamulu-to-utawala' ? 'utawala' : 'kamulu'}
            selectedProducts={selectedProducts}
            onProductSelect={(product) => {
              setShowTransferDialog(true);
              const currentAmount = selectedProducts.get(product.id) || 0;
              setSelectedProducts(new Map(selectedProducts.set(product.id, currentAmount)));
            }}
            onProductRemove={handleRemoveProduct}
          />

          <div className="mt-auto pt-4 flex justify-end">
            {selectedProducts.size > 0 && (
              <Button 
                size="lg"
                onClick={handleTransfer}
                className="w-[200px]"
              >
                Confirm Transfer ({selectedProducts.size})
              </Button>
            )}
          </div>
        </div>
      </DrawerContent>

      {/* Transfer Dialog */}
      {showTransferDialog && (
        <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set Transfer Amount</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {Array.from(selectedProducts.entries()).map(([productId, amount]) => {
                const product = sourceProducts.find(p => p.id === productId);
                if (!product) return null;

                return (
                  <div key={productId} className="space-y-2">
                    <p className="text-sm font-medium">{product.name}</p>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="0"
                        max={product.inventory[0].quantity}
                        value={amount}
                        onChange={(e) => {
                          const newAmount = Math.min(
                            parseInt(e.target.value) || 0,
                            product.inventory[0].quantity
                          );
                          setSelectedProducts(new Map(selectedProducts.set(productId, newAmount)));
                        }}
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">
                        / {product.inventory[0].quantity} available
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => setShowTransferDialog(false)}
                disabled={Array.from(selectedProducts.values()).every(amount => amount === 0)}
              >
                Add
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Drawer>
  );
} 