"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, Loader2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ReportWrapper } from "./ReportWrapper";
import { useToast } from "@/hooks/use-toast";

interface ProductInventory {
  quantity: number;
  location: 'kamulu' | 'utawala';
}

interface Product {
  id: string;
  name: string;
  description: string | null;
  min_stock_level: number;
  inventory: ProductInventory[];
}

interface ProductWithUniqueId extends Product {
  uniqueId: string;
}

export function InventoryReport() {
  const [selectedLocation, setSelectedLocation] = useState<'all' | 'kamulu' | 'utawala'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: utawalaProducts = [], isLoading: isLoadingUtawala } = useQuery<Product[]>({
    queryKey: ['products', 'utawala'],
    queryFn: async () => {
      const response = await fetch('/api/products?location=utawala');
      if (!response.ok) throw new Error('Failed to fetch Utawala inventory');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: kamuluProducts = [], isLoading: isLoadingKamulu } = useQuery<Product[]>({
    queryKey: ['products', 'kamulu'],
    queryFn: async () => {
      const response = await fetch('/api/products?location=kamulu');
      if (!response.ok) throw new Error('Failed to fetch Kamulu inventory');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const filteredProducts: ProductWithUniqueId[] = selectedLocation === 'all' 
    ? [
        ...utawalaProducts.map((product: Product) => ({
          ...product,
          uniqueId: `utawala-${product.id}`
        })),
        ...kamuluProducts.map((product: Product) => ({
          ...product,
          uniqueId: `kamulu-${product.id}`
        }))
      ]
    : selectedLocation === 'utawala'
    ? utawalaProducts.map((product: Product) => ({
        ...product,
        uniqueId: `utawala-${product.id}`
      }))
    : kamuluProducts.map((product: Product) => ({
        ...product,
        uniqueId: `kamulu-${product.id}`
      }));

  const totalProducts = filteredProducts.length;
  const lowStockProducts = filteredProducts.filter(
    (product: ProductWithUniqueId) => product.inventory[0].quantity <= product.min_stock_level
  ).length;
  const outOfStockProducts = filteredProducts.filter(
    (product: ProductWithUniqueId) => product.inventory[0].quantity === 0
  ).length;

  const handleExport = () => {
    // Implement CSV export logic
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['products', 'utawala'] }),
        queryClient.invalidateQueries({ queryKey: ['products', 'kamulu'] })
      ]);
      toast({
        title: "Success",
        description: "Report data refreshed successfully",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh report data",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const isLoading = isLoadingUtawala || isLoadingKamulu;

  return (
    <ReportWrapper>
      <div className="flex items-center justify-between">
        <Select
          value={selectedLocation}
          onValueChange={(value: 'all' | 'kamulu' | 'utawala') => 
            setSelectedLocation(value)
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select location" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            <SelectItem value="kamulu">Kamulu Store</SelectItem>
            <SelectItem value="utawala">Utawala Store</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={cn(
              "h-4 w-4 mr-2",
              isRefreshing && "animate-spin"
            )} />
            Refresh
          </Button>
          <Button onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-[200px]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Total Products</CardTitle>
                <CardDescription>Across selected location(s)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Low Stock Items</CardTitle>
                <CardDescription>Below minimum level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockProducts}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Out of Stock</CardTitle>
                <CardDescription>Zero quantity</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{outOfStockProducts}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Inventory Details</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Current Stock</TableHead>
                    <TableHead>Min. Stock Level</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: ProductWithUniqueId) => (
                    <TableRow key={product.uniqueId}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {product.inventory[0].location}
                        </Badge>
                      </TableCell>
                      <TableCell>{product.inventory[0].quantity}</TableCell>
                      <TableCell>{product.min_stock_level}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            product.inventory[0].quantity === 0
                              ? "destructive"
                              : product.inventory[0].quantity <= product.min_stock_level
                              ? "outline"
                              : "default"
                          }
                          className={cn(
                            product.inventory[0].quantity === 0
                              ? "bg-red-100 text-red-800"
                              : product.inventory[0].quantity <= product.min_stock_level
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-green-100 text-green-800"
                          )}
                        >
                          {product.inventory[0].quantity === 0
                            ? "Out of Stock"
                            : product.inventory[0].quantity <= product.min_stock_level
                            ? "Low Stock"
                            : "In Stock"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </ReportWrapper>
  );
} 