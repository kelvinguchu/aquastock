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
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { data: userProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can approve/reject requests' },
        { status: 403 }
      );
    }

    const { status, approved_by, sale_id } = await request.json();

    // Start a transaction
    const { data: request_data, error: requestError } = await supabase
      .from("inventory_requests")
      .select(`
        *,
        products (
          name
        )
      `)
      .eq('id', params.id)
      .single();

    if (requestError) throw requestError;

    if (request_data.status !== 'pending') {
      return NextResponse.json(
        { error: 'Request has already been processed' },
        { status: 400 }
      );
    }

    if (status === 'approved') {
      if (sale_id) {
        const { data, error } = await supabase
          .from("inventory_requests")
          .update({
            status,
            approved_by,
            sale_id
          })
          .eq('id', params.id)
          .select()
          .single();

        if (error) throw error;
        return NextResponse.json(data);
      } else {
        const { data, error } = await supabase.rpc('process_inventory_request', {
          request_id: params.id,
          approved_by_user: approved_by,
          new_status: status
        });

        if (error) throw error;
        return NextResponse.json(data);
      }
    } else {
      // Just update the request status if rejecting
      const { data, error } = await supabase
        .from("inventory_requests")
        .update({
          status,
          approved_by,
        })
        .eq('id', params.id)
        .select()
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    }
  } catch (error) {
    console.error('Error updating inventory request:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory request' },
      { status: 500 }
    );
  }
} 