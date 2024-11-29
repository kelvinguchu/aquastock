"use server";

import { createClient } from "./server";
import type { Profile, UserRole } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from './admin';
import { cache } from 'react';
import type { Database } from "@/types/supabase";

// Cache the getUsers function
export const getUsers = cache(async (): Promise<Profile[]> => {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }
    
    return data as Profile[];
  } catch (error) {
    throw error;
  }
});

export async function deleteUser(userId: string): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase.auth.admin.deleteUser(userId);
    
    if (error) {
      throw new Error(error.message);
    }
    
    revalidatePath('/users');
  } catch (error) {
    throw error;
  }
}

export async function updateUserRole(userId: string, role: UserRole): Promise<void> {
  try {
    const supabase = await createClient();
    
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);

    if (error) {
      throw new Error(error.message);
    }
    
    revalidatePath('/users');
  } catch (error) {
    throw error;
  }
}

export async function getUserById(userId: string): Promise<Profile> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }
  
  return data as Profile;
}

export async function changeUserPassword(userId: string, password: string, isPersonal: boolean = false): Promise<void> {
  try {
    const supabase = await createClient();
    
    if (isPersonal) {
      // For personal password changes, use updateUser
      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        throw new Error(error.message);
      }
    } else {
      // For admin password changes, use admin.updateUserById
      const { error } = await supabase.auth.admin.updateUserById(
        userId,
        { password: password }
      );

      if (error) {
        throw new Error(error.message);
      }
    }
  } catch (error) {
    console.error("Password change error:", error);
    throw error;
  }
}

export async function getCurrentProfile(): Promise<Profile | null> {
  try {
    const supabase = await createClient();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return null;
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data as Profile;
  } catch (error) {
    throw error;
  }
}

export async function createUser(
  email: string,
  password: string,
  full_name: string,
  role: UserRole
): Promise<void> {
  "use server";
  
  try {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("No user data returned");

    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: authData.user.id,
        full_name,
        email,
        role,
      });

    if (profileError) throw profileError;

    revalidatePath('/users');
  } catch (error) {
    console.error("Create user error:", error);
    throw error;
  }
}

// Add these types at the top
interface Product {
  id: string;
  name: string;
  description: string | null;
  min_stock_level: number;
  created_at: string;
  updated_at: string;
  inventory: {
    quantity: number;
    location: 'kamulu' | 'utawala';
  }[];
}

// Add these functions to your existing file
export async function getProducts(): Promise<Product[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        min_stock_level,
        created_at,
        updated_at,
        inventory (
          quantity,
          location
        )
      `)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

export async function getLocationProducts(location: 'kamulu' | 'utawala'): Promise<Product[]> {
  try {
    const supabase = await createClient();
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        min_stock_level,
        created_at,
        updated_at,
        inventory!inner (
          quantity,
          location
        )
      `)
      .eq('inventory.location', location)
      .order('name');

    if (error) throw error;
    return data;
  } catch (error) {
    throw error;
  }
}

// Add this function to handle product creation with inventory
export async function createProduct(
  name: string,
  description: string | null,
  min_stock_level: number
): Promise<void> {
  try {
    const supabase = await createClient();

    // First, create the product
    const { data: product, error: productError } = await supabase
      .from('products')
      .insert({
        name,
        description,
        min_stock_level,
      })
      .select()
      .single();

    if (productError) throw productError;

    // Then create inventory entries for both locations
    const { error: inventoryError } = await supabase
      .from('inventory')
      .insert([
        {
          product_id: product.id,
          location: 'kamulu',
          quantity: 0,
        },
        {
          product_id: product.id,
          location: 'utawala',
          quantity: 0,
        },
      ]);

    if (inventoryError) throw inventoryError;

    // Revalidate the products cache
    revalidatePath('/inventory/kamulu');
    revalidatePath('/inventory/utawala');
  } catch (error) {
    throw error;
  }
}

// Add this function to handle stock adjustments
export async function updateStockLevel(
  productId: string,
  location: 'kamulu' | 'utawala',
  quantity: number
): Promise<void> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('inventory')
      .update({ quantity })
      .eq('product_id', productId)
      .eq('location', location);

    if (error) throw error;

    revalidatePath('/inventory/kamulu');
    revalidatePath('/inventory/utawala');
  } catch (error) {
    throw error;
  }
}

// Add this type
interface TransferRecord {
  product_id: string;
  from_location: 'kamulu' | 'utawala';
  to_location: 'kamulu' | 'utawala';
  quantity: number;
  transferred_by: string;
  notes?: string;
}

// Add this function to record transfers
export async function recordTransfer(transfer: TransferRecord): Promise<void> {
  try {
    const supabase = await createClient();

    // First get current quantities
    const { data: fromInventory, error: fromError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', transfer.product_id)
      .eq('location', transfer.from_location)
      .single();

    const { data: toInventory, error: toError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('product_id', transfer.product_id)
      .eq('location', transfer.to_location)
      .single();

    if (fromError || toError) throw fromError || toError;
    if (!fromInventory || !toInventory) throw new Error("Inventory not found");

    // Calculate new quantities
    const newFromQuantity = fromInventory.quantity - transfer.quantity;
    const newToQuantity = toInventory.quantity + transfer.quantity;

    // Update both locations
    const [fromLocation, toLocation] = await Promise.all([
      supabase
        .from('inventory')
        .update({ quantity: newFromQuantity })
        .eq('product_id', transfer.product_id)
        .eq('location', transfer.from_location),
      
      supabase
        .from('inventory')
        .update({ quantity: newToQuantity })
        .eq('product_id', transfer.product_id)
        .eq('location', transfer.to_location)
    ]);

    if (fromLocation.error) throw fromLocation.error;
    if (toLocation.error) throw toLocation.error;

    // Then record the transfer
    const { error: transferError } = await supabase
      .from('transfers')
      .insert({
        product_id: transfer.product_id,
        from_location: transfer.from_location,
        to_location: transfer.to_location,
        quantity: transfer.quantity,
        transferred_by: transfer.transferred_by,
        status: 'completed'
      });

    if (transferError) throw transferError;

    revalidatePath('/inventory/kamulu');
    revalidatePath('/inventory/utawala');
  } catch (error) {
    console.error("Transfer error:", error);
    throw error;
  }
}
