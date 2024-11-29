"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  DollarSign,
  Package,
  ShoppingCart,
  Users,
  AlertTriangle,
} from "lucide-react";
import type { Profile } from "@/lib/types";
import { format } from "date-fns";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface DashboardContentProps {
  user: Profile;
}

export function DashboardContent({ user }: DashboardContentProps) {
  // Fetch dashboard data
  const { data: salesData } = useQuery({
    queryKey: ['dashboard-sales'],
    queryFn: async () => {
      const response = await fetch('/api/sales');
      return response.json();
    },
  });

  const { data: inventoryData } = useQuery({
    queryKey: ['dashboard-inventory'],
    queryFn: async () => {
      const response = await fetch('/api/inventory');
      return response.json();
    },
  });

  const { data: customersData } = useQuery({
    queryKey: ['dashboard-customers'],
    queryFn: async () => {
      const response = await fetch('/api/customers');
      return response.json();
    },
  });

  // Calculate metrics
  const totalSales = salesData?.reduce((acc: number, sale: any) => acc + sale.total_amount, 0) || 0;
  const pendingSales = salesData?.filter((sale: any) => sale.status === 'pending').length || 0;
  const totalCustomers = customersData?.length || 0;
  const lowStockItems = inventoryData?.filter((item: any) => 
    item.quantity <= item.min_stock_level
  ).length || 0;

  // Prepare chart data
  const last7DaysSales = salesData?.filter((sale: any) => {
    const saleDate = new Date(sale.created_at);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    return saleDate >= sevenDaysAgo && sale.status === 'approved';
  }).reduce((acc: any, sale: any) => {
    const date = format(new Date(sale.created_at), 'MMM dd');
    acc[date] = (acc[date] || 0) + sale.total_amount;
    return acc;
  }, {});

  const salesChartData = Object.entries(last7DaysSales || {}).map(([date, amount]) => ({
    date,
    amount,
  }));

  const renderMetricCards = () => {
    if (user.role === 'admin' || user.role === 'accountant') {
      return (
        <>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">KES {totalSales.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">
                +20.1% from last month
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Sales</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingSales}</div>
              <div className="text-xs text-muted-foreground">
                Requires approval
              </div>
            </CardContent>
          </Card>
        </>
      );
    }
    return null;
  };

  const renderSalesChart = () => {
    if (user.role === 'admin' || user.role === 'accountant') {
      return (
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Sales Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={salesChartData}>
                <XAxis
                  dataKey="date"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `KES ${value}`}
                />
                <Tooltip />
                <Bar
                  dataKey="amount"
                  fill="#adfa1d"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="flex-1 space-y-6 p-8 pt-6 w-[80vw]">
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {renderMetricCards()}

            {/* Always visible cards */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalCustomers}</div>
                <div className="text-xs text-muted-foreground">
                  Active customers
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{lowStockItems}</div>
                <div className="text-xs text-muted-foreground">
                  Requires attention
                </div>
              </CardContent>
            </Card>
          </div>

          {renderSalesChart()}

          {/* Recent Activity - Modified based on role */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            {(user.role === 'admin' || user.role === 'accountant') && (
              <Card className="col-span-4">
                <CardHeader>
                  <CardTitle>Recent Sales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    {salesData?.slice(0, 5).map((sale: any) => (
                      <div key={sale.id} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {sale.customer_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(sale.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div className="ml-auto font-medium">
                          KES {sale.total_amount}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Low Stock Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  {inventoryData
                    ?.filter((item: any) => item.quantity <= item.min_stock_level)
                    .slice(0, 5)
                    .map((item: any) => (
                      <div key={item.id} className="flex items-center">
                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-none">
                            {item.product.name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="ml-auto">
                          <Badge variant="destructive">Low Stock</Badge>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          {/* Add additional analytics content here */}
        </TabsContent>
      </Tabs>
    </div>
  );
} 