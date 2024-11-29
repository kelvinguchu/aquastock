"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash, Check, ChevronsUpDown } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  description: string | null;
  min_stock_level: number;
  inventory: {
    quantity: number;
    location: 'kamulu' | 'utawala';
  }[];
}

const formSchema = z.object({
  supplierName: z.string().min(1, "Supplier name is required"),
  supplierContact: z.string().min(1, "Supplier contact is required"),
  targetLocation: z.enum(["kamulu", "utawala"]),
  notes: z.string().optional(),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Product is required"),
        quantity: z.number().min(1, "Quantity must be at least 1"),
        unitPrice: z.number().min(1, "Unit price must be at least 1"),
      })
    )
    .min(1, "At least one item is required"),
});

type FormValues = z.infer<typeof formSchema>;

interface CreateLPOSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Create a separate component for the items table
interface LPOItemsTableProps {
  items: any[];
  onChange: (items: any[]) => void;
  targetLocation: string;
}

function LPOItemsTable({ items, onChange, targetLocation }: LPOItemsTableProps) {
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products', targetLocation],
    queryFn: async () => {
      const response = await fetch(`/api/products?location=${targetLocation}`);
      if (!response.ok) throw new Error('Failed to fetch products');
      const data = await response.json();
      return data || [];
    },
  });

  const handleAddItem = () => {
    onChange([...items, { productId: "", quantity: 1, unitPrice: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    onChange(newItems);
  };

  const calculateTotal = (index: number) => {
    const item = items[index];
    return (item.quantity || 0) * (item.unitPrice || 0);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Items</h3>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddItem}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
                  No items added
                </TableCell>
              </TableRow>
            ) : (
              items.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Select
                      value={item.productId || ""}
                      onValueChange={(value) => updateItem(index, 'productId', value)}
                    >
                      <SelectTrigger className="w-[300px]">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => {
                          const inventory = product.inventory?.[0];
                          if (!inventory) return null;

                          return (
                            <SelectItem key={product.id} value={product.id}>
                              <div className="flex flex-col">
                                <span>{product.name}</span>
                                <span className="text-xs text-muted-foreground">
                                  Stock: {inventory.quantity} {inventory.quantity <= product.min_stock_level && "(Low Stock)"}
                                </span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      className="w-32"
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    KES {calculateTotal(index)}
                  </TableCell>
                  <TableCell>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveItem(index)}
                    >
                      <Trash className="h-4 w-4 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// Update the main CreateLPOSheet component to use LPOItemsTable
export function CreateLPOSheet({ open, onOpenChange }: CreateLPOSheetProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      supplierName: "",
      supplierContact: "",
      targetLocation: "kamulu",
      notes: "",
      items: [],
    },
  });

  const items = form.watch("items");

  const onSubmit = async (values: FormValues) => {
    try {
      setIsLoading(true);

      const response = await fetch("/api/lpo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to create LPO');
      }

      await queryClient.invalidateQueries({ queryKey: ["lpos"] });
      toast({
        title: "Success",
        description: "LPO created successfully",
      });
      form.reset();
      onOpenChange(false);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='min-w-[60vw] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Create Local Purchase Order</SheetTitle>
          <SheetDescription>
            Create a new LPO by filling in the details below.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-6 mt-6'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='supplierName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter supplier name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='supplierContact'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Contact</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter supplier contact' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='targetLocation'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Location</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Select location' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='kamulu'>Kamulu</SelectItem>
                        <SelectItem value='utawala'>Utawala</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='notes'
                render={({ field }) => (
                  <FormItem className='col-span-2'>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='Add any additional notes here'
                        className='resize-none'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <LPOItemsTable 
              items={items}
              onChange={(newItems) => form.setValue('items', newItems)}
              targetLocation={form.watch('targetLocation')}
            />

            <SheetFooter>
              <Button type='submit' disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Creating...
                  </>
                ) : (
                  "Create LPO"
                )}
              </Button>
            </SheetFooter>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
