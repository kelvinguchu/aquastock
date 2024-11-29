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

// Add other interfaces for Products, Inventory, Sales, etc. 