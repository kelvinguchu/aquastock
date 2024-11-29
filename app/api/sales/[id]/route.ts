import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "accountant"].includes(profile.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const { status, approved_by } = body;

    console.log('Processing sale approval:', { saleId: params.id, status, approved_by });

    if (status === 'approved') {
      const { data: sale, error: saleError } = await supabase
        .from("sales")
        .select(`
          *,
          sale_items (
            product_id,
            quantity
          )
        `)
        .eq("id", params.id)
        .single();

      if (saleError) {
        console.error('Error fetching sale:', saleError);
        throw saleError;
      }

      console.log('Sale data:', sale);

      const inventoryTransactions = sale.sale_items.map((item: any) => ({
        product_id: item.product_id,
        transaction_type: 'sale',
        from_location: 'utawala',
        quantity: item.quantity,
        reference_id: sale.id,
        created_by: user.id,
      }));

      console.log('Creating inventory transactions:', inventoryTransactions);

      const { error: transactionError } = await supabase
        .from("inventory_transactions")
        .insert(inventoryTransactions);

      if (transactionError) {
        console.error('Error creating transactions:', transactionError);
        throw transactionError;
      }

      for (const item of sale.sale_items) {
        console.log('Updating inventory for item:', item);

        const { data: currentInventory, error: fetchError } = await supabase
          .from("inventory")
          .select("quantity")
          .eq("product_id", item.product_id)
          .eq("location", 'utawala')
          .single();

        if (fetchError) {
          console.error('Error fetching current inventory:', fetchError);
          throw fetchError;
        }

        console.log('Current inventory:', currentInventory);

        const { error: inventoryError } = await supabase
          .from("inventory")
          .update({
            quantity: currentInventory.quantity - item.quantity
          })
          .eq("product_id", item.product_id)
          .eq("location", 'utawala');

        if (inventoryError) {
          console.error('Error updating inventory:', inventoryError);
          throw inventoryError;
        }
      }
    }

    const { data: updatedSale, error } = await supabase
      .from("sales")
      .update({ 
        status,
        approved_by: approved_by || null,
      })
      .eq("id", params.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sale status:', error);
      throw error;
    }

    console.log('Sale successfully updated:', updatedSale);
    return NextResponse.json(updatedSale);
  } catch (error: any) {
    console.error('Final error:', error);
    return new NextResponse(
      error.message || "An error occurred while processing the sale",
      { status: 500 }
    );
  }
} 