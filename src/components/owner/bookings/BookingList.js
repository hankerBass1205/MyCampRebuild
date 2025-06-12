"use client";
import { useState, useEffect, useMemo } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { FaEye } from 'react-icons/fa6';
import BaseTable from '../common/BaseTable';
import { 
  showBookingAlert,
} from "@/utils/sweetalert";
import {
  bookingToast,
} from "@/utils/toast";

// 在文件頂部定義統一的訂單狀態樣式
const ORDER_STATUS = {
  pending: {
    text: '待確認',
    className: 'bg-[#FFE4C8] text-[#95603B]'  // 深橙色文字配淺橙色背景
  },
  confirmed: {
    text: '已確認',
    className: 'bg-[#DCEDC2] text-[#4F6F3A]'  // 深綠色文字配淺綠色背景
  },
  cancelled: {
    text: '已取消',
    className: 'bg-[#FFDADA] text-[#A15555]'  // 深紅色文字配淺紅色背景
  }
};

// 新增 Filter 組件
function BookingFilter({ filters, setFilters }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 下訂日期範圍 */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">下訂日期範圍</label>
        <div className="flex space-x-2">
          <input
            type="date"
            value={filters.orderDateRange.start}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              orderDateRange: { ...prev.orderDateRange, start: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="self-center text-gray-400">至</span>
          <input
            type="date"
            value={filters.orderDateRange.end}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              orderDateRange: { ...prev.orderDateRange, end: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* 入營日期範圍 */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">入營日期範圍</label>
        <div className="flex space-x-2">
          <input
            type="date"
            value={filters.stayDateRange.start}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              stayDateRange: { ...prev.stayDateRange, start: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <span className="self-center text-gray-400">至</span>
          <input
            type="date"
            value={filters.stayDateRange.end}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              stayDateRange: { ...prev.stayDateRange, end: e.target.value }
            }))}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
        </div>
      </div>

      {/* 訂單狀態和付款狀態 */}
      <div>
        <label className="block text-sm text-gray-500 mb-1">訂單狀態</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部</option>
          <option value="pending">待確認</option>
          <option value="confirmed">已確認</option>
          <option value="cancelled">已取消</option>
        </select>
      </div>

      <div>
        <label className="block text-sm text-gray-500 mb-1">付款狀態</label>
        <select
          value={filters.paymentStatus}
          onChange={(e) => setFilters(prev => ({ ...prev, paymentStatus: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
        >
          <option value="">全部</option>
          <option value="pending">待付款</option>
          <option value="paid">已付款</option>
          <option value="failed">未付款</option>
          <option value="refunded">已退款</option>
        </select>
      </div>
    </div>
  );
}

export default function BookingList() {
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [filters, setFilters] = useState({
    orderDateRange: { start: '', end: '' },
    stayDateRange: { start: '', end: '' },
    status: '',
    paymentStatus: ''
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // 定義表格欄位
  const columns = useMemo(() => [
    {
      id: 'booking_id',
      header: '預訂編號',
      accessorFn: row => `#${String(row.booking_id || '').padStart(4, '0')}`,
      size: 120,
    },
    {
      id: 'booking_date',
      header: '下訂日期',
      accessorFn: row => {
        try {
          const date = new Date(row.booking_date);
          return new Intl.DateTimeFormat('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Taipei'
          }).format(date);
        } catch {
          return '';
        }
      },
      size: 150,
    },
    {
      id: 'activity',
      header: '活動/營位',
      cell: ({ row }) => {
        const activity = row.original.activity_name 
          ? `${row.original.activity_name}${row.original.activity_title ? ` - ${row.original.activity_title}` : ''}`
          : '';
        const spot = row.original.spot_name || '';
        
        return (
          <div className="flex flex-col py-2">
            <span className="text-sm font-medium">{activity}</span>
            {spot && <span className="text-xs text-gray-600">{spot}</span>}
          </div>
        );
      },
      size: 250,
    },
    {
      id: 'dates',
      header: '入營期間',
      cell: ({ row }) => {
        const checkIn = row.original.check_in_date ? new Date(row.original.check_in_date) : null;
        const checkOut = row.original.check_out_date ? new Date(row.original.check_out_date) : null;
        
        if (!checkIn || !checkOut) return '-';
        
        return (
          <div className="flex flex-col py-1">
            <div className="text-sm">
              入營：{new Intl.DateTimeFormat('zh-TW', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).format(checkIn)}
            </div>
            <div className="text-sm">
              拔營：{new Intl.DateTimeFormat('zh-TW', { 
                year: 'numeric', 
                month: '2-digit', 
                day: '2-digit' 
              }).format(checkOut)}
            </div>
          </div>
        );
      },
      size: 150,
    },
    {
      id: 'contact_name',
      header: '聯絡人',
      accessorKey: 'contact_name',
      size: 120,
    },
    {
      id: 'contact_phone',
      header: '聯絡電話',
      accessorKey: 'contact_phone',
      size: 150,
    },
    {
      id: 'quantity',
      header: '數量',
      accessorKey: 'quantity',
      size: 80,
    },
    {
      id: 'total_price',
      header: '總金額',
      accessorFn: row => {
        const price = Math.round(Number(row.total_price));
        return new Intl.NumberFormat('zh-TW', {
          style: 'currency',
          currency: 'TWD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(price);
      },
      size: 120,
    },
    {
      id: 'payment_status',
      header: '付款狀態',
      cell: ({ row }) => {
        const status = row.original.payment_status;
        const statusConfig = PAYMENT_STATUS[status] || {
          text: '未知狀態',
          className: 'bg-[#E2E2E2] text-[#666666]'
        };

        return (
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
            {statusConfig.text}
          </span>
        );
      },
      size: 100,
    },
    {
      id: 'status',
      header: '訂單狀態',
      cell: ({ row }) => {
        const status = row.original.status;
        const statusConfig = ORDER_STATUS[status] || ORDER_STATUS.pending;
        
        return (
          <span className={`px-3 py-1.5 rounded-full text-xs font-medium ${statusConfig.className}`}>
            {statusConfig.text}
          </span>
        );
      },
      size: 100,
    },
    {
      id: 'actions',
      header: '操作',
      cell: ({ row }) => (
        <button 
          onClick={() => handleView(row.original)}
          className="p-2 rounded-full hover:bg-[#E3D5CA] transition-colors duration-200 group"
          title="查看詳情"
        >
          <FaEye className="w-5 h-5 text-[#7D6D61] group-hover:text-[#5F6F52]" />
        </button>
      ),
      size: 80,
    },
  ], []);

  // 獲取訂單數據
  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/owner/bookings');
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.data);
      } else {
        toast.error(data.error || '獲取訂單列表失敗');
      }
    } catch (error) {
      console.error('獲取訂單列表失敗:', error);
      toast.error('獲取訂單列表失敗');
    } finally {
      setLoading(false);
    }
  };

  // 處理查看詳情
  const handleView = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  // 付款狀態對應的莫蘭迪色系
  const PAYMENT_STATUS = {
    pending: {
      text: '待付款',
      className: 'bg-[#FFE4C8] text-[#95603B]'  // 深橙色文字配淺橙色背景
    },
    paid: {
      text: '已付款',
      className: 'bg-[#DCEDC2] text-[#4F6F3A]'  // 深綠色文字配淺綠色背景
    },
    failed: {
      text: '未付款',
      className: 'bg-[#FFDADA] text-[#A15555]'  // 深紅色文字配淺紅色背景
    },
    refunded: {
      text: '已退款',
      className: 'bg-[#E2E2E2] text-[#666666]'  // 深灰色文字配淺灰色背景
    }
  };

  // 修改狀態更新處理函數
  const handleStatusUpdate = async (newStatus) => {
    // 如果狀態相同，則不執行更新
    if (selectedBooking.status === newStatus) return;

    try {
      // 顯示確認對話框
      const result = await showBookingAlert.confirmStatusUpdate(
        newStatus, 
        ORDER_STATUS[newStatus].text
      );

      if (result.isConfirmed) {
        // 顯示載入中
        await showBookingAlert.loading();

        const response = await fetch(`/api/owner/bookings/${selectedBooking.booking_id}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        });

        const data = await response.json();

        if (response.ok) {
          await showBookingAlert.updateSuccess(ORDER_STATUS[newStatus].text);
          
          // 更新本地狀態
          setSelectedBooking(prev => ({
            ...prev,
            status: newStatus
          }));
          // 重新獲取訂單列表
          fetchBookings();
        } else {
          throw new Error(data.error || '更新失敗');
        }
      }
    } catch (error) {
      console.error('更新狀態失敗:', error);
      await showBookingAlert.error(error.message);
    }
  };

  // 處理過濾後的數據
  const filteredData = useMemo(() => {
    return bookings.filter(booking => {
      // 下訂日期範圍過濾
      const orderDate = new Date(booking.booking_date);
      const orderDateMatch = (!filters.orderDateRange.start || orderDate >= new Date(filters.orderDateRange.start)) &&
                           (!filters.orderDateRange.end || orderDate <= new Date(filters.orderDateRange.end));

      // 入營日期範圍過濾
      const checkInDate = new Date(booking.check_in_date);
      const stayDateMatch = (!filters.stayDateRange.start || checkInDate >= new Date(filters.stayDateRange.start)) &&
                           (!filters.stayDateRange.end || checkInDate <= new Date(filters.stayDateRange.end));

      // 訂單狀態過濾
      const statusMatch = !filters.status || booking.status === filters.status;

      // 付款狀態過濾
      const paymentMatch = !filters.paymentStatus || booking.payment_status === filters.paymentStatus;

      return orderDateMatch && stayDateMatch && statusMatch && paymentMatch;
    });
  }, [bookings, filters]);

  // 可以在組件外部或內部添加全局樣式（可選）
  useEffect(() => {
    // 自定義 SweetAlert2 的全局樣式
    const style = document.createElement('style');
    style.innerHTML = `
      .swal2-popup {
        background-color: #FAFAF9 !important;
      }
      .swal2-icon.swal2-success {
        border-color: #87A878 !important;
        color: #87A878 !important;
      }
      .swal2-icon.swal2-error {
        border-color: #E7BCBC !important;
        color: #8B6F6F !important;
      }
      .swal2-icon.swal2-question {
        border-color: #B5A397 !important;
        color: #7D6D61 !important;
      }
      .swal2-timer-progress-bar {
        background: #D4E6B5 !important;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // 取消預訂
  const handleCancelBooking = async (bookingId) => {
    const result = await showBookingAlert.confirmCancel();
    if (!result.isConfirmed) return;

    try {
      const response = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT'
      });

      if (!response.ok) throw new Error('取消預訂失敗');

      bookingToast.success('預訂已成功取消');
      // 重新載入預訂列表
      fetchBookings();
    } catch (error) {
      await showBookingAlert.error(error.message);
    }
  };

  // 確認預訂
  const handleConfirmBooking = async (bookingId) => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/confirm`, {
        method: 'PUT'
      });

      if (!response.ok) throw new Error('確認預訂失敗');

      bookingToast.success('預訂已成功確認');
      // 重新載入預訂列表
      fetchBookings();
    } catch (error) {
      await showBookingAlert.error(error.message);
    }
  };

  if (loading) {
    return <div className="p-6">載入中...</div>;
  }

  return (
    <>
      {/* 簡化外層容器，移除多餘的 flex-1 和 min-h-0 */}
      <div className="h-[calc(100vh-4rem)] pt-16 flex flex-col overflow-hidden">
        <h1 className="text-2xl font-bold mb-6">訂單管理</h1>
        {/* 直接放置 BaseTable，移除額外的 div 包裹 */}
        <BaseTable
          data={filteredData}
          columns={columns}
          initialSort={[{ id: 'booking_date', desc: true }]}
          pageSize={15}
          enableSearch={true}
          searchPlaceholder="搜尋訂單編號、聯絡人、電話..."
          enableColumnFilters={true}
          filterComponent={<BookingFilter filters={filters} setFilters={setFilters} />}
        />
      </div>

      {/* 查看詳情彈窗 */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-8 shadow-xl transition-all">
                  {selectedBooking && (
                    <>
                      <Dialog.Title as="h3" className="text-xl font-medium leading-6 text-[#5F6F52] border-b pb-6 mb-6">
                        訂單詳情 #{String(selectedBooking.booking_id).padStart(6, '0')}
                      </Dialog.Title>

                      <div className="space-y-6">
                        {/* 基本資訊 */}
                        <div className="bg-[#FAFAF9] p-8 rounded-lg">
                          <h4 className="font-medium text-[#5F6F52] mb-6">訂單資訊</h4>
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-sm text-gray-500 mb-3">活動名稱</p>
                              <p className="text-[#7D6D61]">{selectedBooking.activity_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-3">數量</p>
                              <p className="text-[#7D6D61]">{selectedBooking.quantity} 位</p>
                            </div>
                          </div>
                        </div>

                        {/* 付款資訊 */}
                        <div className="bg-[#FAFAF9] p-8 rounded-lg">
                          <h4 className="font-medium text-[#5F6F52] mb-6">付款資訊</h4>
                          <div className="space-y-6">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">總金額</span>
                              <span className="text-[#7D6D61] font-medium">
                                {new Intl.NumberFormat('zh-TW', {
                                  style: 'currency',
                                  currency: 'TWD',
                                  minimumFractionDigits: 0,
                                }).format(selectedBooking.total_price)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-500">付款狀態</span>
                              <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                                PAYMENT_STATUS[selectedBooking.payment_status]?.className
                              }`}>
                                {PAYMENT_STATUS[selectedBooking.payment_status]?.text}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* 入營資訊 */}
                        <div className="bg-[#FAFAF9] p-8 rounded-lg">
                          <h4 className="font-medium text-[#5F6F52] mb-6">入營資訊</h4>
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-sm text-gray-500 mb-3">入營日期</p>
                              <p className="text-[#7D6D61]">
                                {new Date(selectedBooking.check_in_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-3">拔營日期</p>
                              <p className="text-[#7D6D61]">
                                {new Date(selectedBooking.check_out_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* 聯絡資訊 */}
                        <div className="bg-[#FAFAF9] p-8 rounded-lg">
                          <h4 className="font-medium text-[#5F6F52] mb-6">聯絡資訊</h4>
                          <div className="grid grid-cols-2 gap-8">
                            <div>
                              <p className="text-sm text-gray-500 mb-3">姓名</p>
                              <p className="text-[#7D6D61]">{selectedBooking.contact_name}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-3">電話</p>
                              <p className="text-[#7D6D61]">{selectedBooking.contact_phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 按鈕區域 */}
                      <div className="mt-8 pt-6 border-t border-gray-200">
                        {/* 訂單狀態區域 */}
                        <div className="flex flex-col space-y-4 mb-6">
                          <h4 className="font-medium text-[#5F6F52]">訂單狀態</h4>
                          <div className="flex space-x-4">
                            {selectedBooking.status === 'pending' ? (
                              // 只有待確認狀態才顯示操作按鈕
                              <>
                                <button
                                  onClick={() => handleStatusUpdate('confirmed')}
                                  className="px-6 py-3 rounded-md bg-[#DCEDC2] text-[#4F6F3A] hover:bg-[#C5E0A5] transition-colors"
                                >
                                  確認訂單
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate('cancelled')}
                                  className="px-6 py-3 rounded-md bg-[#FFDADA] text-[#A15555] hover:bg-[#FFB6B6] transition-colors"
                                >
                                  取消訂單
                                </button>
                              </>
                            ) : (
                              // 非待確認狀態顯示提示文字
                              <p className="text-[#95603B]">
                                已{ORDER_STATUS[selectedBooking.status]?.text}的訂單無法修改狀態
                              </p>
                            )}
                          </div>
                        </div>

                        {/* 當前狀態顯示 */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-gray-500">當前狀態：</span>
                            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                              ORDER_STATUS[selectedBooking.status]?.className
                            }`}>
                              {ORDER_STATUS[selectedBooking.status]?.text}
                            </span>
                          </div>

                          <button
                            onClick={() => setIsModalOpen(false)}
                            className="px-6 py-3 rounded-md text-[#7D6D61] hover:bg-[#E3D5CA] transition-colors"
                          >
                            關閉
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
