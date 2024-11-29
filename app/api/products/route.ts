import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get('location');

    if (!location) {
      return new NextResponse("Location is required", { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get products with their inventory for the specified location
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        min_stock_level,
        inventory!inner (
          quantity,
          location
        )
      `)
      .eq('inventory.location', location);

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
} 