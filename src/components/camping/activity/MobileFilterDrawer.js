import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaFilter, FaTimes, FaMapMarkerAlt, FaCalendarAlt, FaSortAmountDown } from 'react-icons/fa';
import { DatePicker, Select } from 'antd';
import dayjs from 'dayjs';

export function MobileFilterDrawer({ 
  isOpen, 
  onClose, 
  filters,
  onFilterChange,
  locationGroups,
  sortOptions,
  priceRangeOptions 
}) {
  // 日期限制
  const today = dayjs().startOf("day");
  const maxDate = dayjs().add(1, "year");

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩層 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black z-40"
          />
          
          {/* 抽屜內容 */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30 }}
            className="fixed bottom-0 left-0 right-0 
                     bg-white rounded-t-3xl z-50 
                     max-h-[90vh] overflow-y-auto"
          >
            {/* 頂部把手和標題 */}
            <div className="sticky top-0 bg-white px-4 pt-3 pb-2
                          border-b border-gray-100 flex items-center justify-between">
              <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto" />
              <h3 className="text-lg font-medium text-gray-900">篩選條件</h3>
              <button onClick={onClose} className="p-2">
                <FaTimes className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 篩選選項 */}
            <div className="p-4 space-y-6">
              {/* 地區選擇 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaMapMarkerAlt className="text-blue-500" />
                  選擇地區
                </h4>
                <Select
                  className="w-full"
                  value={filters.location}
                  onChange={(value) => onFilterChange({ ...filters, location: value })}
                  options={[
                    { value: 'all', label: '全部地區' },
                    ...locationGroups.flatMap(group => 
                      group.items.map(item => ({
                        value: item.value,
                        label: item.label
                      }))
                    )
                  ]}
                />
              </div>

              {/* 日期選擇 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaCalendarAlt className="text-green-500" />
                  活動日期
                </h4>
                <div className="flex gap-2">
                  <DatePicker
                    value={filters.startDate ? dayjs(filters.startDate) : null}
                    onChange={(date) => {
                      onFilterChange({
                        ...filters,
                        startDate: date ? date.format('YYYY-MM-DD') : null
                      });
                    }}
                    format="YYYY/MM/DD"
                    placeholder="開始日期"
                    className="w-full"
                    disabledDate={(current) => {
                      return current && (current < today || current > maxDate);
                    }}
                  />
                  <DatePicker
                    value={filters.endDate ? dayjs(filters.endDate) : null}
                    onChange={(date) => {
                      onFilterChange({
                        ...filters,
                        endDate: date ? date.format('YYYY-MM-DD') : null
                      });
                    }}
                    format="YYYY/MM/DD"
                    placeholder="結束日期"
                    className="w-full"
                    disabledDate={(current) => {
                      return current && (current < today || current > maxDate);
                    }}
                  />
                </div>
              </div>

              {/* 價格範圍 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">價格範圍</h4>
                <Select
                  className="w-full"
                  value={filters.priceRange}
                  onChange={(value) => onFilterChange({ ...filters, priceRange: value })}
                  options={priceRangeOptions}
                />
              </div>

              {/* 排序方式 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700 flex items-center gap-2">
                  <FaSortAmountDown className="text-purple-500" />
                  排序方式
                </h4>
                <Select
                  className="w-full"
                  value={filters.sortBy}
                  onChange={(value) => onFilterChange({ ...filters, sortBy: value })}
                  options={sortOptions}
                />
              </div>
            </div>

            {/* 底部按鈕 */}
            <div className="sticky bottom-0 p-4 bg-white border-t border-gray-100">
              <button
                onClick={onClose}
                className="w-full py-2 bg-[#8C8275] text-white rounded-lg
                         hover:bg-[#4A3C31] transition-colors duration-300"
              >
                套用篩選
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}