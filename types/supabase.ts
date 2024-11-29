export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          email: string;
          role: "admin" | "accountant" | "clerk" | "user";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string;
          email: string;
          role: "admin" | "accountant" | "clerk" | "user";
        };
        Update: {
          full_name?: string;
          email?: string;
          role?: "admin" | "accountant" | "clerk" | "user";
        };
      };
      products: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          min_stock_level: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          name: string;
          description?: string;
          min_stock_level: number;
        };
        Update: {
          name?: string;
          description?: string;
          min_stock_level?: number;
        };
      };
      inventory: {
        Row: {
          id: string;
          product_id: string;
          location: 'kamulu' | 'utawala';
          quantity: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          location: 'kamulu' | 'utawala';
          quantity: number;
        };
        Update: {
          quantity?: number;
        };
      };
      transfers: {
        Row: {
          id: string;
          product_id: string;
          from_location: 'kamulu' | 'utawala';
          to_location: 'kamulu' | 'utawala';
          quantity: number;
          status: 'pending' | 'completed' | 'cancelled';
          transferred_by: string;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          from_location: 'kamulu' | 'utawala';
          to_location: 'kamulu' | 'utawala';
          quantity: number;
          transferred_by: string;
          notes?: string;
          status?: 'pending' | 'completed' | 'cancelled';
        };
        Update: {
          status?: 'pending' | 'completed' | 'cancelled';
          notes?: string;
        };
      };
    };
  };
}; 