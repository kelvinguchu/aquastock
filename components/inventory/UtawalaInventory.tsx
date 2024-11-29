"use client";

import { ProductList } from "./ProductList";

export default function UtawalaInventory() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Utawala Inventory</h2>
      <ProductList location="utawala" />
    </div>
  );
} 