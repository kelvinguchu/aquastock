import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Get transfers with product and user details using separate queries
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
        products (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (transferError) {
      console.error("Transfer Error:", transferError);
      throw transferError;
    }

    // If no transfers exist, return empty array
    if (!transfers || transfers.length === 0) {
      return NextResponse.json([]);
    }

    // Get user details for each transfer
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', transfers.map(t => t.transferred_by));

    if (profileError) {
      console.error("Profile Error:", profileError);
      throw profileError;
    }

    // Map profiles to transfers
    const transfersWithUserDetails = transfers.map(transfer => ({
      ...transfer,
      profiles: profiles?.find(p => p.id === transfer.transferred_by) || { full_name: 'Unknown User' }
    }));

    return NextResponse.json(transfersWithUserDetails);
  } catch (error: any) {
    console.error("Server Error:", error);
    return new NextResponse(
      JSON.stringify({ error: error.message || "Internal server error" }), 
      { status: 500 }
    );
  }
}
