import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { data: customers, error } = await supabase
      .from("customers")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;

    return NextResponse.json(customers);
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}

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

    const body = await request.json();
    const { name, phone, email, notes } = body;

    // Check if customer with same phone exists
    if (phone) {
      const { data: existingPhone } = await supabase
        .from("customers")
        .select("id")
        .eq("phone", phone)
        .single();

      if (existingPhone) {
        return new NextResponse(
          "A customer with this phone number already exists",
          { status: 400 }
        );
      }
    }

    // Check if customer with same email exists
    if (email) {
      const { data: existingEmail } = await supabase
        .from("customers")
        .select("id")
        .eq("email", email)
        .single();

      if (existingEmail) {
        return new NextResponse(
          "A customer with this email already exists",
          { status: 400 }
        );
      }
    }

    // Create new customer
    const { data: customer, error } = await supabase
      .from("customers")
      .insert({
        name,
        phone: phone || null,  // Ensure null if empty string
        email: email || null,  // Ensure null if empty string
        notes: notes || null,  // Ensure null if empty string
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {  // Unique constraint violation
        return new NextResponse(
          "A customer with this phone number or email already exists",
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(customer);
  } catch (error: any) {
    console.error('Customer creation error:', error);
    return new NextResponse(
      error.message || "Failed to create customer",
      { status: 500 }
    );
  }
} 