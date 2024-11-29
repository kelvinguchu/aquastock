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
        )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(requests);
  } catch (error) {
    console.error('Error fetching inventory requests:', error);
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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { items } = await request.json();
    
    // Add validation
    if (!items?.length) {
      return NextResponse.json(
        { error: 'At least one item is required' },
        { status: 400 }
      );
    }

    // Log for debugging
    console.log('Creating requests:', {
      items,
      user_id: user.id
    });

    // Create requests for each item
    const { data, error } = await supabase
      .from("inventory_requests")
      .insert(
        items.map((item: any) => ({
          product_id: item.product_id,
          quantity: parseFloat(item.quantity), // Ensure quantity is a number
          created_by: user.id,
        }))
      )
      .select();

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error creating inventory requests:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create inventory requests' },
      { status: 500 }
    );
  }
} 