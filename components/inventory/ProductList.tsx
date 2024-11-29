"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, RefreshCw, Minus } from "lucide-react";
import { getLocationProducts, updateStockLevel } from "@/lib/supabase/supabase-actions";
import { Loader } from "@/components/ui/loader";
import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ProductListProps {
  location: 'kamulu' | 'utawala';
}

export function ProductList({ location }: ProductListProps) {
  const { state } = useSidebar();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const queryClient = useQueryClient();
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [newQuantity, setNewQuantity] = useState<number>(0);
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', location],
    queryFn: () => getLocationProducts(location),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const filteredAndPaginatedProducts = () => {
    let filtered = [...products];

    if (searchTerm) {
      filtered = filtered.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return {
      paginatedProducts: filtered.slice(startIndex, endIndex),
      totalPages: Math.ceil(filtered.length / itemsPerPage),
      totalProducts: filtered.length,
    };
  };

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['products', location] });
  };

  const handleStockAdjustment = async () => {
    try {
      await updateStockLevel(
        selectedProduct.id,
        location,
        newQuantity
      );

      queryClient.invalidateQueries({ queryKey: ['products', location] });
      toast({
        title: "Success",
        description: "Stock level updated successfully",
      });
      setShowStockDialog(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-10rem)] flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  const { paginatedProducts, totalPages, totalProducts } = filteredAndPaginatedProducts();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="pl-8"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handleRefresh}
            className="hover:bg-gray-100"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <div className="text-sm text-muted-foreground">
            Total: {totalProducts} products
          </div>
        </div>
      </div>

      <div className={`rounded-md border transition-all duration-300 ${
        state === "expanded" ? "w-[75vw]" : "w-[93vw]"
      }`}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Stock Level</TableHead>
              <TableHead>Min. Stock</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No products found
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell>{product.description || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span>{product.inventory[0].quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setSelectedProduct(product);
                          setNewQuantity(product.inventory[0].quantity);
                          setShowStockDialog(true);
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>{product.min_stock_level}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={cn(
                        product.inventory[0].quantity <= product.min_stock_level
                          ? "bg-red-100 text-red-800"
                          : "bg-green-100 text-green-800"
                      )}
                    >
                      {product.inventory[0].quantity <= product.min_stock_level
                        ? "Low Stock"
                        : "In Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  className={cn(currentPage === 1 && "pointer-events-none opacity-50")}
                />
              </PaginationItem>
              {[...Array(totalPages)].map((_, i) => (
                <PaginationItem key={i + 1}>
                  <PaginationLink
                    onClick={() => setCurrentPage(i + 1)}
                    isActive={currentPage === i + 1}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => setCurrentPage((prev) => 
                    Math.min(prev + 1, totalPages)
                  )}
                  className={cn(
                    currentPage === totalPages && "pointer-events-none opacity-50"
                  )}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {showStockDialog && (
        <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adjust Stock Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Product: {selectedProduct?.name}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Current Stock: {selectedProduct?.inventory[0].quantity}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewQuantity((prev) => Math.max(0, prev - 1))}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min="0"
                  value={newQuantity}
                  onChange={(e) => setNewQuantity(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-24 text-center"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setNewQuantity((prev) => prev + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleStockAdjustment}>
                Update Stock
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 