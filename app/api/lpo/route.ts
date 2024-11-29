import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
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

    if (!profile || !["admin", "clerk"].includes(profile.role)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { items, supplierName, supplierContact, targetLocation, notes } = await request.json();

    // Validate products and stock levels
    for (const item of items) {
      // Get product with inventory
      const { data: product, error: productError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          min_stock_level,
          inventory!inner (
            quantity,
            location
          )
        `)
        .eq('id', item.productId)
        .eq('inventory.location', targetLocation)
        .single();

      if (productError || !product) {
        return new NextResponse(
          JSON.stringify({ message: `Product not found: ${item.productId}` }),
          { status: 400 }
        );
      }
    }

    // Create purchase order
    const { data: purchaseOrder, error: poError } = await supabase
      .from('purchase_orders')
      .insert({
        supplier_name: supplierName,
        supplier_contact: supplierContact,
        target_location: targetLocation,
        notes,
        total_amount: items.reduce((sum: number, item: any) => sum + (item.quantity * item.unitPrice), 0),
        created_by: user.id,
        status: 'pending'
      })
      .select()
      .single();

    if (poError) throw poError;

    // Insert purchase order items
    const { error: itemsError } = await supabase
      .from('purchase_order_items')
      .insert(
        items.map((item: any) => ({
          purchase_order_id: purchaseOrder.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          total_price: item.quantity * item.unitPrice
        }))
      );

    if (itemsError) throw itemsError;

    return NextResponse.json({ message: "LPO created successfully", id: purchaseOrder.id });

  } catch (error: any) {
    console.error('Error creating LPO:', error);
    return NextResponse.json(
      { message: error.message || "Failed to create LPO" },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific LPO with its items
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          profiles:created_by (full_name),
          approved_by_profile:approved_by (full_name),
          purchase_order_items (
            *,
            product:products (
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } else {
      // Get all LPOs
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          profiles:created_by (full_name),
          approved_by_profile:approved_by (full_name),
          purchase_order_items (
            *,
            product:products (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error: any) {
    console.error('Error fetching LPOs:', error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch LPOs" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get user's role
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || profile.role !== 'admin') {
      return new NextResponse("Only admins can approve LPOs", { status: 403 });
    }

    const { id, action } = await request.json();

    const { error } = await supabase
      .from('purchase_orders')
      .update({
        status: action === 'approve' ? 'approved' : 'rejected',
        approved_by: user.id
      })
      .eq('id', id);

    if (error) throw error;

    if (action === 'approve') {
      // Call the confirm_purchase_order function
      const { error: confirmError } = await supabase
        .rpc('confirm_purchase_order', {
          purchase_order_id: id,
          approved_by: user.id
        });

      if (confirmError) throw confirmError;
    }

    return NextResponse.json({ message: `LPO ${action}d successfully` });

  } catch (error: any) {
    console.error('Error updating LPO:', error);
    return NextResponse.json(
      { error: error.message || "Failed to update LPO" },
      { status: 500 }
    );
  }
}
