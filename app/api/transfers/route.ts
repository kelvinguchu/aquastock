import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Optimize the query by limiting fields and using more efficient joins
    const { data: transfers, error: transferError } = await supabase
      .from('transfers')
      .select(`
        id,
        product_id,
        from_location,
        to_location,
        quantity,
        status,
        transferred_by,
        created_at,
        products!inner (
          name
        ),
        profiles!inner (
          full_name
        )
      `)
      .order('created_at', { ascending: false })
      .limit(100); // Add reasonable limit

    if (transferError) {
      console.error("Transfer Error:", transferError);
      throw transferError;
    }

    // Add cache headers
    return new NextResponse(JSON.stringify(transfers), {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error("Server Error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      { status: 500 }
    );
  }
}
