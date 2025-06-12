"use client";
import { useState } from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  flexRender,
} from '@tanstack/react-table';
import { HiChevronLeft, HiChevronRight, HiSearch, HiFilter } from 'react-icons/hi';

export default function BaseTable({
  data,
  columns,
  initialSort = [],
  pageSize = 15,
  className = "",
  enableSearch = true,
  enableColumnFilters = true,
  enableSorting = true,
  searchPlaceholder = "搜尋...",
  filterComponent = null,
  onRowClick = null,
  rowClassName = "",
  headerClassName = "",
  emptyMessage = "無資料",
}) {
  const [sorting, setSorting] = useState(initialSort);
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableSorting,
    enableColumnFilters,
    initialState: {
      pagination: { pageSize },
    },
  });

  const handleResetFilters = () => {
    setGlobalFilter('');
    setColumnFilters([]);
    table.resetSorting();
    if (filterComponent) {
      filterComponent.props.setFilters({
        orderDateRange: { start: '', end: '' },
        stayDateRange: { start: '', end: '' },
        status: '',
        paymentStatus: ''
      });
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow flex flex-col h-full ${className}`}>
      {/* 工具列 - 固定在頂部 */}
      {(enableSearch || filterComponent) && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 flex items-center justify-between gap-4">
          {/* 左側搜尋框 */}
          {enableSearch && (
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                value={globalFilter}
                onChange={e => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#87A878]"
              />
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            </div>
          )}
          
          {/* 右側按鈕群組 */}
          <div className="flex items-center gap-3">
            {/* 重置篩選按鈕 */}
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm border border-[#87A878] text-[#87A878] rounded-lg hover:bg-[#F7F9F5] transition-colors"
            >
              重置篩選
            </button>

            {/* 篩選器開關按鈕 */}
            {filterComponent && (
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <HiFilter className={`w-5 h-5 ${showFilters ? 'text-[#87A878]' : 'text-gray-500'}`} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* 篩選面板 - 固定在搜尋列下方 */}
      {showFilters && filterComponent && (
        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
          {filterComponent}
        </div>
      )}

      {/* 表格區域 - 可滾動區域 */}
      <div className="flex-1 min-h-0 relative flex flex-col">
        <div className="absolute inset-0 overflow-auto">
          <table className="w-full border-collapse">
            <thead className={`bg-gray-50 sticky top-0 z-10 ${headerClassName}`}>
              {table.getHeaderGroups().map(headerGroup => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map(header => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none border-b border-gray-200"
                      style={{ width: header.column.columnDef.size }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        {header.column.getIsSorted() && (
                          <span>{header.column.getIsSorted() === "asc" ? " ↑" : " ↓"}</span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.length > 0 ? (
                table.getRowModel().rows.map(row => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick && onRowClick(row.original)}
                    className={`hover:bg-gray-50 ${onRowClick ? 'cursor-pointer' : ''} ${rowClassName}`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <td key={cell.id} className="px-6 py-4 whitespace-nowrap border-b border-gray-200">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 分頁控制 - 固定在底部 */}
      <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between border-t border-gray-200 bg-gray-50">
        <div className="flex-1 flex justify-between items-center">
          <span className="text-sm text-gray-700">
            第 {table.getState().pagination.pageIndex + 1} 頁，
            共 {table.getPageCount()} 頁
            （共 {table.getPreFilteredRowModel().rows.length} 筆資料）
          </span>
          <div className="flex items-center space-x-2">
            <select
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
              className="border rounded px-2 py-1 text-sm"
            >
              {[10, 15, 20, 30, 50].map(size => (
                <option key={size} value={size}>顯示 {size} 筆</option>
              ))}
            </select>
            <div className="flex space-x-2">
              <button
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                <HiChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
                className="px-3 py-1 border rounded text-sm disabled:opacity-50"
              >
                <HiChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 