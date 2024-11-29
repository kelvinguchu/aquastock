"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
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
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SaleItemsTable } from "./SaleItemsTable";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";

const saleFormSchema = z.object({
  customer_name: z.string().min(2, "Customer name is required"),
  customer_phone: z.string().optional(),
  customer_email: z.string().email().optional().or(z.literal("")),
  payment_method: z.enum(["cash", "bank_transfer", "mpesa", "cheque"]),
  payment_reference: z.string().optional(),
  items: z
    .array(
      z.object({
        product_id: z.string(),
        quantity: z.number().positive(),
        unit_price: z.number().positive(),
        total_price: z.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
});

type SaleFormValues = z.infer<typeof saleFormSchema>;

interface CreateSaleFromRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultProducts: {
    product_id: string;
    product_name: string;
    quantity: number;
    requestId: string;
    customer_name?: string;
    customer_phone?: string;
    customer_email?: string;
  }[];
}

interface SaleItemsTableProps {
  items: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }[];
  onItemsChange: (items: any[]) => void;
}

export function CreateSaleFromRequestDialog({
  open,
  onOpenChange,
  defaultProducts = [],
}: CreateSaleFromRequestDialogProps) {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [linkedRequestId, setLinkedRequestId] = useState<string | null>(null);

  const form = useForm<SaleFormValues>({
    resolver: zodResolver(saleFormSchema),
    defaultValues: {
      customer_name: "",
      customer_phone: "",
      customer_email: "",
      payment_method: "cash",
      payment_reference: "",
      items: [] as any[],
    },
  });

  useEffect(() => {
    if (defaultProducts.length > 0) {
      form.setValue(
        "items",
        defaultProducts.map((p) => ({
          product_id: p.product_id,
          quantity: p.quantity,
          unit_price: 0,
          total_price: 0,
        }))
      );

      if (defaultProducts[0].requestId) {
        setLinkedRequestId(defaultProducts[0].requestId);
      }

      if (defaultProducts[0].customer_name) {
        form.setValue("customer_name", defaultProducts[0].customer_name);
        form.setValue("customer_phone", defaultProducts[0].customer_phone || "");
        form.setValue("customer_email", defaultProducts[0].customer_email || "");
      }
    }
  }, [defaultProducts, form]);

  const onSubmit = async (values: SaleFormValues) => {
    if (!user?.id) {
      toast.error("You must be logged in");
      return;
    }

    if (!linkedRequestId) {
      toast.error("No request ID found");
      return;
    }

    try {
      setIsLoading(true);

      const hasInvalidItems = values.items.some(
        (item) => !item.unit_price || item.unit_price <= 0
      );
      if (hasInvalidItems) {
        throw new Error("All items must have valid unit prices");
      }

      const saleResponse = await fetch("/api/sales", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer_name: values.customer_name,
          customer_phone: values.customer_phone || null,
          customer_email: values.customer_email || null,
          payment_method: values.payment_method,
          payment_reference: values.payment_reference || null,
          items: values.items,
          request_id: linkedRequestId,
        }),
      });

      const responseData = await saleResponse.json();

      if (!saleResponse.ok) {
        throw new Error(responseData.error || "Failed to create sale");
      }

      await queryClient.invalidateQueries({ queryKey: ["sales"] });
      await queryClient.invalidateQueries({ queryKey: ["deduction-requests"] });

      toast.success("Request approved and sale created successfully");
      onOpenChange(false);
    } catch (error) {
      console.error("Sale creation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to process request"
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (loading) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='min-w-[95vw] sm:min-w-[50vw] overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>Approve Request and Create Sale</SheetTitle>
          <SheetDescription>
            Complete the sale details to approve this request.
          </SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={(e) => {
              form.handleSubmit(onSubmit)(e);
            }}
            className='space-y-6 mt-6'>
            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Customer Details</h4>
              <div className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='customer_name'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer Name</FormLabel>
                      <FormControl>
                        <Input placeholder='Enter customer name' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid grid-cols-2 gap-4'>
                  <FormField
                    control={form.control}
                    name='customer_phone'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input placeholder='Enter phone number' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customer_email'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input
                            type='email'
                            placeholder='Enter email'
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </div>

            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Items</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {form.watch("items").map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {defaultProducts[index]?.product_name}
                      </TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`items.${index}.unit_price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormControl>
                                <Input
                                  type='number'
                                  step='0.01'
                                  min='0'
                                  placeholder='Enter price'
                                  {...field}
                                  onChange={(e) => {
                                    const value = parseFloat(e.target.value);
                                    field.onChange(value);
                                    const items = form.getValues("items");
                                    items[index].total_price =
                                      value * items[index].quantity;
                                    form.setValue("items", items);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        {form.watch(`items.${index}.total_price`).toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className='space-y-4'>
              <h4 className='text-sm font-medium'>Payment Details</h4>
              <div className='grid gap-4'>
                <FormField
                  control={form.control}
                  name='payment_method'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Method</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select payment method' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='cash'>Cash</SelectItem>
                          <SelectItem value='mpesa'>M-Pesa</SelectItem>
                          <SelectItem value='bank_transfer'>
                            Bank Transfer
                          </SelectItem>
                          <SelectItem value='cheque'>Cheque</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='payment_reference'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Reference</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter payment reference'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Button
              type='submit'
              disabled={isLoading}
              className='w-full'
              onClick={() => console.log("Submit button clicked")}>
              {isLoading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Processing...
                </>
              ) : (
                "Approve and Create Sale"
              )}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
}
