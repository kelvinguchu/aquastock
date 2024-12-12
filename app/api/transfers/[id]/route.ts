import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Check if user is a clerk
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError || !profile || profile.role !== 'clerk') {
      return new NextResponse("Only clerks can manage transfer statuses", { status: 403 });
    }

    const { status } = await request.json();

    // Get transfer details including product info
    const { data: transfer, error: transferError } = await supabase
      .from('transfers')
      .select(`
        *,
        products (
          name
        )
      `)
      .eq('id', params.id)
      .single();

    if (transferError || !transfer) {
      return NextResponse.json(
        { message: "Transfer not found" },
        { status: 404 }
      );
    }

    // Only allow status changes for pending transfers
    if (transfer.status !== 'pending') {
      return NextResponse.json(
        { message: "Only pending transfers can be updated" },
        { status: 400 }
      );
    }

    // If marking as completed, update inventory levels
    if (status === 'completed') {
      // Get current quantities for both locations
      const { data: fromInventory, error: fromError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", transfer.product_id)
        .eq("location", transfer.from_location)
        .single();

      const { data: toInventory, error: toError } = await supabase
        .from("inventory")
        .select("quantity")
        .eq("product_id", transfer.product_id)
        .eq("location", transfer.to_location)
        .single();

      if (fromError || toError || !fromInventory || !toInventory) {
        return NextResponse.json(
          { message: "Failed to fetch inventory levels" },
          { status: 500 }
        );
      }

      // Verify sufficient stock
      if (fromInventory.quantity < transfer.quantity) {
        return NextResponse.json(
          { message: "Insufficient stock in source location" },
          { status: 400 }
        );
      }

      // Calculate new quantities
      const newFromQuantity = fromInventory.quantity - transfer.quantity;
      const newToQuantity = toInventory.quantity + transfer.quantity;

      // Update both locations
      const [fromUpdate, toUpdate] = await Promise.all([
        supabase
          .from("inventory")
          .update({ quantity: newFromQuantity })
          .eq("product_id", transfer.product_id)
          .eq("location", transfer.from_location),

        supabase
          .from("inventory")
          .update({ quantity: newToQuantity })
          .eq("product_id", transfer.product_id)
          .eq("location", transfer.to_location),
      ]);

      if (fromUpdate.error || toUpdate.error) {
        return NextResponse.json(
          { message: "Failed to update inventory levels" },
          { status: 500 }
        );
      }
    }

    // Update transfer status
    const { data: updateData, error: updateError } = await supabase
      .from('transfers')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (updateError || !updateData) {
      return NextResponse.json(
        { message: "Failed to update transfer status" }, 
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      message: "Transfer status updated successfully",
      data: updateData
    });
  } catch (error: any) {
    console.error('Error updating transfer:', error);
    return NextResponse.json(
      { message: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
} 