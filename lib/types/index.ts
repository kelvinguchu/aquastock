import type { ReactComponentElement } from "react";

export type UserRole = 'admin' | 'accountant' | 'clerk' | 'user'
export type InventoryLocation = 'kamulu' | 'utawala'
export type TransactionType = 'sale' | 'transfer' | 'purchase'
export type RequestStatus = 'pending' | 'approved' | 'rejected'
export type NotificationStatus = 'new' | 'acknowledged' | 'resolved'
export type PaymentMethod = 'cash' | 'bank_transfer' | 'mpesa' | 'cheque'

export interface Profile {
  id: string
  full_name: string | null
  role: UserRole
  email: string
  phone_number: string | null
  created_at: string
  updated_at: string
}

export interface SaleMetrics {
  dailySales: Array<{
    date: string;
    total_amount: number;
    items?: string[];
  }>;
  currentDaySales: number;
  previousDaySales: number;
  totalSales: number;
  pendingSales: number;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color?: string;
    theme?: {
      [key: string]: string;
    };
    icon?: React.ComponentType;
  };
}

export interface ChartData {
  month: string;
  sales: number;
}

export interface InventoryMetrics {
  lowStockCount: number;
  totalValue: number;
  lowStockItems: any[]; // You can define a more specific type if needed
}

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  recentSales: any[]; // You can define a more specific type if needed
}

export interface InventoryValueItem {
  quantity: number;
  products?: {
    unit_price: number;
  };
}
