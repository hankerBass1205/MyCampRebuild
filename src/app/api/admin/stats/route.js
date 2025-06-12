import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // 取得概覽數據
    const [[overviewStats]] = await db.query(`
      SELECT 
        COUNT(*) as totalOrders,
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COUNT(CASE WHEN payment_status = 1 THEN 1 END) as paidOrders,
        COUNT(CASE WHEN order_status = 2 THEN 1 END) as completedOrders
      FROM product_orders
    `);

    // 取得每月營收數據
    const [revenueData] = await db.query(`
      SELECT 
        MONTH(created_at) as month,
        COALESCE(SUM(total_amount), 0) as revenue
      FROM product_orders 
      WHERE payment_status = 1 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 1 YEAR)
      GROUP BY MONTH(created_at)
      ORDER BY month
    `);

    // 取得訂單狀態分布
    const [orderStatusData] = await db.query(`
      SELECT 
        order_status,
        COUNT(*) as count
      FROM product_orders 
      GROUP BY order_status
      ORDER BY order_status
    `);

    // 取得付款狀態分布
    const [paymentStatusData] = await db.query(`
      SELECT 
        payment_status,
        COUNT(*) as count
      FROM product_orders 
      GROUP BY payment_status
      ORDER BY payment_status
    `);

    // 新增訂單分析
    const [[orderAnalytics]] = await db.query(`
      SELECT 
        ROUND(AVG(total_amount), 2) as avgOrderValue,
        MAX(total_amount) as maxOrderValue,
        MIN(total_amount) as minOrderValue,
        COUNT(DISTINCT member_id) as uniqueCustomers
      FROM product_orders
      WHERE order_status != 3
    `);

    // 配送方式統計
    const [deliveryStats] = await db.query(`
      SELECT 
        delivery_method,
        COUNT(*) as count
      FROM product_orders
      GROUP BY delivery_method
      ORDER BY count DESC
    `);

    // 付款方式統計
    const [paymentMethodStats] = await db.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        ROUND(SUM(total_amount), 2) as total_amount
      FROM product_orders
      GROUP BY payment_method
      ORDER BY count DESC
    `);

    // 訂單時段分析
    const [timeStats] = await db.query(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as count
      FROM product_orders
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `);

    // 格式化數據
    const formattedStats = {
      overview: {
        totalOrders: Number(overviewStats.totalOrders) || 0,
        totalRevenue: Number(overviewStats.totalRevenue) || 0,
        paidOrders: Number(overviewStats.paidOrders) || 0,
        completedOrders: Number(overviewStats.completedOrders) || 0
      },
      revenueData: Array(12).fill(0).map((_, i) => {
        const monthData = revenueData.find(d => d.month === i + 1);
        return monthData ? Number(monthData.revenue) : 0;
      }),
      orderStatusData: Array(4).fill(0).map((_, i) => {
        const statusData = orderStatusData.find(d => d.order_status === i);
        return statusData ? Number(statusData.count) : 0;
      }),
      paymentStatusData: Array(3).fill(0).map((_, i) => {
        const statusData = paymentStatusData.find(d => d.payment_status === i);
        return statusData ? Number(statusData.count) : 0;
      })
    };

    return NextResponse.json({
      ...formattedStats,
      analytics: {
        avgOrderValue: Number(orderAnalytics.avgOrderValue) || 0,
        maxOrderValue: Number(orderAnalytics.maxOrderValue) || 0,
        minOrderValue: Number(orderAnalytics.minOrderValue) || 0,
        uniqueCustomers: Number(orderAnalytics.uniqueCustomers) || 0
      },
      deliveryStats: deliveryStats.map(item => ({
        method: item.delivery_method,
        count: Number(item.count)
      })),
      paymentMethodStats: paymentMethodStats.map(item => ({
        method: item.payment_method,
        count: Number(item.count),
        amount: Number(item.total_amount)
      })),
      timeStats: Array(24).fill(0).map((_, i) => {
        const hourData = timeStats.find(d => d.hour === i);
        return hourData ? Number(hourData.count) : 0;
      })
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    return NextResponse.json({
      overview: { 
        totalOrders: 0, 
        totalRevenue: 0, 
        paidOrders: 0, 
        completedOrders: 0 
      },
      revenueData: Array(12).fill(0),
      orderStatusData: Array(4).fill(0),
      paymentStatusData: Array(3).fill(0),
      analytics: {
        avgOrderValue: 0,
        maxOrderValue: 0,
        minOrderValue: 0,
        uniqueCustomers: 0
      },
      deliveryStats: [],
      paymentMethodStats: [],
      timeStats: Array(24).fill(0)
    });
  }
} 