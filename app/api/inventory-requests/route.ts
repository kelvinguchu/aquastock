import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: requests, error } = await supabase
      .from("inventory_requests")
      .select(`
        *,
        products (
          name
        ),
        profiles!inventory_requests_created_by_fkey (
          full_name
        ),
        approved_by_profile:profiles!inventory_requests_approved_by_fkey (
          full_name
        ),
        customers (
          id,
          name,
          phone,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch inventory requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, customer_name, customer_phone, customer_email } = await request.json();
    
    let customer_id = null;

    // If customer phone is provided (making it the primary identifier)
    if (customer_phone) {
      // Try to find existing customer by phone
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', customer_phone)
        .maybeSingle();

      if (existingCustomer) {
        // If customer exists, use their ID
        customer_id = existingCustomer.id;
        
        // Optionally update other details if they've changed
        if (customer_name || customer_email) {
          await supabase
            .from('customers')
            .update({
              name: customer_name || undefined,
              email: customer_email || undefined,
            })
            .eq('id', customer_id);
        }
      } else {
        // Create new customer if phone number doesn't exist
        const { data: newCustomer, error: customerError } = await supabase
          .from('customers')
          .insert({
            name: customer_name || null,
            phone: customer_phone,
            email: customer_email || null,
            created_by: user.id  // Add the created_by field
          })
          .select()
          .single();

        if (customerError) throw customerError;
        customer_id = newCustomer.id;
      }
    }

    // Create requests for each item
    const { data, error } = await supabase
      .from("inventory_requests")
      .insert(
        items.map((item: any) => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity),
          created_by: user.id,
          customer_id: customer_id
        }))
      )
      .select();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inventory requests' },
      { status: 500 }
    );
  }
} 