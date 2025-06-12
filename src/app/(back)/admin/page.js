'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import { 
  UserOutlined, 
  ShoppingCartOutlined, 
  HomeOutlined, 
  DollarOutlined 
} from '@ant-design/icons';

// 動態引入 ApexCharts 組件以避免 SSR 問題
const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false });

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
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

  // 營收趨勢圖配置
  const revenueChartOptions = {
    chart: {
      type: 'area',
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.7,
        opacityTo: 0.3
      }
    },
    dataLabels: {
      enabled: false
    },
    colors: ['#00b96b'],
    xaxis: {
      categories: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    title: {
      text: '月營收趨勢',
      align: 'left'
    }
  };

  // 訂單狀態圓餅圖配置
  const orderStatusOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['待處理', '處理中', '已完成', '已取消'],
    colors: ['#ffd666', '#40a9ff', '#52c41a', '#ff4d4f'],
    title: {
      text: '訂單狀態分布',
      align: 'left'
    }
  };

  // 付款狀態圓餅圖配置
  const paymentStatusOptions = {
    chart: {
      type: 'donut',
      height: 350
    },
    labels: ['未付款', '已付款', '已退款'],
    colors: ['#ffd666', '#52c41a', '#ff4d4f'],
    title: {
      text: '付款狀態分布',
      align: 'left'
    }
  };

  // 新增時段分析圖表配置
  const timeStatsOptions = {
    chart: {
      type: 'bar',
      height: 350
    },
    plotOptions: {
      bar: {
        borderRadius: 4
      }
    },
    xaxis: {
      categories: Array(24).fill(0).map((_, i) => `${i}時`),
      title: {
        text: '訂單時段分布'
      }
    },
    yaxis: {
      title: {
        text: '訂單數量'
      }
    },
    colors: ['#00b96b']
  };

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/admin/stats');
        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* 概覽卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="總訂單數"
              value={stats.overview.totalOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#40a9ff' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已付款訂單"
              value={stats.overview.paidOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="已完成訂單"
              value={stats.overview.completedOrders}
              prefix={<ShoppingCartOutlined />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="總營收"
              value={stats.overview.totalRevenue}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 新增訂單分析卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="平均訂單金額"
              value={stats.analytics?.avgOrderValue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最高訂單金額"
              value={stats.analytics?.maxOrderValue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="最低訂單金額"
              value={stats.analytics?.minOrderValue}
              precision={2}
              prefix="$"
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="不重複客戶數"
              value={stats.analytics?.uniqueCustomers}
              prefix={<UserOutlined />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
      </Row>

      {/* 圖表區域 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={24}>
          <Card>
            <ReactApexChart
              options={revenueChartOptions}
              series={[{
                name: '營收',
                data: stats.revenueData
              }]}
              type="area"
              height={350}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactApexChart
              options={orderStatusOptions}
              series={stats.orderStatusData}
              type="donut"
              height={350}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card>
            <ReactApexChart
              options={paymentStatusOptions}
              series={stats.paymentStatusData}
              type="donut"
              height={350}
            />
          </Card>
        </Col>
        
        {/* 新增時段分析圖表 */}
        <Col xs={24} lg={24}>
          <Card>
            <ReactApexChart
              options={timeStatsOptions}
              series={[{
                name: '訂單數',
                data: stats.timeStats || []
              }]}
              type="bar"
              height={350}
            />
          </Card>
        </Col>

        {/* 配送方式和付款方式分析 */}
        <Col xs={24} lg={12}>
          <Card title="配送方式分析">
            {stats.deliveryStats?.map(item => (
              <div key={item.method} className="mb-4">
                <Statistic
                  title={item.method}
                  value={item.count}
                  suffix="筆訂單"
                />
              </div>
            ))}
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card title="付款方式分析">
            {stats.paymentMethodStats?.map(item => (
              <div key={item.method} className="mb-4">
                <Statistic
                  title={item.method}
                  value={item.count}
                  suffix={`筆訂單 (總額: $${item.amount.toFixed(2)})`}
                />
              </div>
            ))}
          </Card>
        </Col>
      </Row>
    </div>
  );
}