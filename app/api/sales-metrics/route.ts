import { createClient } from "@/lib/supabase/server";
import { format, subMonths, startOfDay, endOfDay, subDays } from "date-fns";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const now = new Date();
    const thirtyDaysAgo = subMonths(now, 1);

    // Get daily sales for the last 30 days
    const { data: dailySales, error } = await supabase
      .from("sales")
      .select(`
        created_at,
        total_amount,
        sale_items (
          quantity,
          products (
            name
          )
        )
      `)
      .gte("created_at", thirtyDaysAgo.toISOString())
      .eq("status", "approved");

    if (error) throw error;

    // Process sales data
    const processedDailySales = dailySales?.reduce((acc: any[], sale) => {
      const date = format(new Date(sale.created_at), "yyyy-MM-dd");
      const existingDate = acc.find(item => item.date === date);
      
      const items = sale.sale_items?.map((item: any) => 
        `${item.products.name} (${item.quantity})`
      );

      if (existingDate) {
        existingDate.total_amount += sale.total_amount;
        existingDate.items = [...(existingDate.items || []), ...(items || [])];
      } else {
        acc.push({
          date,
          total_amount: sale.total_amount,
          items,
        });
      }
      return acc;
    }, []) || [];

    // Get current day's sales
    const currentDayStart = startOfDay(now);
    const { data: currentDay } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", currentDayStart.toISOString())
      .eq("status", "approved");

    // Get previous day's sales
    const previousDayStart = startOfDay(subDays(now, 1));
    const previousDayEnd = endOfDay(subDays(now, 1));
    const { data: previousDay } = await supabase
      .from("sales")
      .select("total_amount")
      .gte("created_at", previousDayStart.toISOString())
      .lte("created_at", previousDayEnd.toISOString())
      .eq("status", "approved");

    // Get pending sales count
    const { count: pendingSales } = await supabase
      .from("sales")
      .select("*", { count: "exact" })
      .eq("status", "pending");

    const sumSales = (sales: Array<{ total_amount: number }>) =>
      sales?.reduce((sum, sale) => sum + sale.total_amount, 0) || 0;

    return NextResponse.json({
      dailySales: processedDailySales,
      currentDaySales: sumSales(currentDay || []),
      previousDaySales: sumSales(previousDay || []),
      totalSales: sumSales(dailySales || []),
      pendingSales: pendingSales || 0,
    });
  } catch (error) {
    console.error("Error in sales metrics API:", error);
    return NextResponse.json(
      { error: "Failed to fetch sales metrics" },
      { status: 500 }
    );
  }
} 