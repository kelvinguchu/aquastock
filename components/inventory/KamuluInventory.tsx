"use client";

import { ProductList } from "./ProductList";

export default function KamuluInventory() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Kamulu Inventory</h2>
      <ProductList location="kamulu" />
    </div>
  );
} 