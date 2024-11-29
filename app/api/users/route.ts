import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { email, password, full_name, role } = await request.json();
    
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Create the user
    const { data, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) {
      console.error("Auth Error:", authError);
      throw authError;
    }

    if (!data.user) {
      throw new Error("No user data returned");
    }

    // Create the profile
    const { error: profileError } = await supabase
      .from('profiles')
      .insert([
        {
          id: data.user.id,
          full_name,
          email,
          role,
        },
      ]);

    if (profileError) {
      console.error("Profile Error:", profileError);
      throw profileError;
    }

    return NextResponse.json({ message: "User created successfully" });
  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json(
      { message: error.message || "Internal server error" }, 
      { status: error.status || 500 }
    );
  }
} 