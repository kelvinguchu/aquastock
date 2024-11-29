"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, ArrowRight, X } from "lucide-react";
import { getLocationProducts } from "@/lib/supabase/supabase-actions";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface TransferTablesProps {
  fromLocation: 'kamulu' | 'utawala';
  toLocation: 'kamulu' | 'utawala';
  selectedProducts: Map<string, number>; // Map of productId to transfer amount
  onProductSelect?: (product: any, amount: number) => void;
  onProductRemove?: (productId: string) => void;
}

export function TransferTables({ 
  fromLocation, 
  toLocation, 
  selectedProducts,
  onProductSelect,
  onProductRemove 
}: TransferTablesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: sourceProducts = [], isLoading: isLoadingSource } = useQuery({
    queryKey: ['products', fromLocation],
    queryFn: () => getLocationProducts(fromLocation),
  });

  const { data: targetProducts = [], isLoading: isLoadingTarget } = useQuery({
    queryKey: ['products', toLocation],
    queryFn: () => getLocationProducts(toLocation),
  });

  const filteredSourceProducts = sourceProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTargetProducts = targetProducts.filter(product => 
    selectedProducts.has(product.id)
  );

  if (isLoadingSource || isLoadingTarget) {
    return <Loader />;
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      {/* Source Location */}
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stock Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSourceProducts.map((product) => (
                <TableRow 
                  key={product.id}
                  className={cn(
                    selectedProducts.has(product.id) && "bg-muted/50",
                    "cursor-pointer hover:bg-muted/50 relative group"
                  )}
                  onClick={() => onProductSelect?.(product, 0)}
                >
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between">
                      <span>{product.inventory[0].quantity}</span>
                      {selectedProducts.has(product.id) && (
                        <Badge 
                          variant="destructive"
                          className="ml-2 bg-red-100 text-red-800"
                        >
                          -{selectedProducts.get(product.id)}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Target Location */}
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Stock Level</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTargetProducts.map((product) => (
                <TableRow key={product.id} className="relative">
                  <TableCell>{product.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-between">
                      <span>{product.inventory[0].quantity}</span>
                      <Badge 
                        variant="default"
                        className="ml-2 bg-green-100 text-green-800"
                      >
                        +{selectedProducts.get(product.id)}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onProductRemove?.(product.id)}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {selectedProducts.size === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-4">
                    Select products to transfer
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
} 