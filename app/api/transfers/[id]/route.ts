import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status } = await request.json();

    // First verify the transfer exists
    const { data: existingTransfer, error: fetchError } = await supabase
      .from('transfers')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !existingTransfer) {
      return NextResponse.json(
        { message: "Transfer not found" },
        { status: 404 }
      );
    }

    // Update the status and return the updated record
    const { data: updateData, error: updateError } = await supabase
      .from('transfers')
      .update({ 
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
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
    return NextResponse.json(
      { message: error.message || "Internal server error" }, 
      { status: 500 }
    );
  }
} 