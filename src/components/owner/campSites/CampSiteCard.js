'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineUsers, HiOutlineCash, HiOutlinePencil, HiOutlineTrash } from 'react-icons/hi';
import Swal from 'sweetalert2';

export default function CampSiteCard({ 
  campSite, 
  onStatusChange, 
  onEdit, 
  onDelete,
  isApplicationApproved 
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: campSite.name,
    capacity: campSite.capacity,
    maxQuantity: campSite.max_quantity || 0,
    price: campSite.price,
    description: campSite.description || '',
    status: campSite.status
  });

  const statusColors = {
    0: 'text-red-500',
    1: 'text-green-500'
  };

  const handleStatusToggle = async () => {
    const result = await Swal.fire({
      title: '確認更改狀態？',
      text: `是否要${campSite.status === 1 ? '停用' : '啟用'}此營位？`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#6B8E7B',
      cancelButtonColor: '#d33',
      confirmButtonText: '確認',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      onStatusChange(campSite.spot_id, campSite.status === 1 ? 0 : 1);
    }
  };

  const handleEdit = async (submitData) => {
    try {
      const response = await fetch(`/api/owner/camp-spots/${campSite.spot_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submitData)
      });

      const data = await response.json();
      if (data.success) {
        setIsEditing(false);
        Swal.fire({
          icon: 'success',
          title: '成功',
          text: '營位資料已更新',
          timer: 1500,
          showConfirmButton: false
        });
        if (onEdit) onEdit();
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('更新營位失敗:', error);
      Swal.fire({
        icon: 'error',
        title: '錯誤',
        text: error.message || '更新營位失敗'
      });
    }
  };

  const handleDelete = async () => {
    const result = await Swal.fire({
      title: '確認刪除？',
      text: '刪除後將無法復原，且已有訂單的營位無法刪除',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6B8E7B',
      confirmButtonText: '確認刪除',
      cancelButtonText: '取消'
    });

    if (result.isConfirmed) {
      onDelete(campSite.spot_id, campSite.name);
    }
  };

  const EditForm = ({ campSite, onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
      name: campSite.name || '',
      capacity: campSite.capacity || 0,
      maxQuantity: campSite.max_quantity || 0,
      price: campSite.price || 0,
      description: campSite.description || '',
      status: campSite.status
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      
      // 確保所有必要欄位都有值且格式正確
      const submitData = {
        name: formData.name.trim(),
        capacity: parseInt(formData.capacity, 10),
        maxQuantity: parseInt(formData.maxQuantity, 10),
        price: parseFloat(formData.price),
        description: formData.description?.trim() || null,
        status: parseInt(formData.status, 10)
      };

      // 驗證必要欄位
      if (!submitData.name || !submitData.capacity || !submitData.price || !submitData.maxQuantity) {
        Swal.fire({
          icon: 'error',
          title: '錯誤',
          text: '請填寫所有必要欄位'
        });
        return;
      }

      onSubmit(submitData);
    };

    return (
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">營位名稱 <span className="text-red-500">*</span></label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">容納人數 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">可預訂數量 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border rounded"
              value={formData.maxQuantity}
              onChange={(e) => setFormData({ ...formData, maxQuantity: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">價格 <span className="text-red-500">*</span></label>
            <input
              type="number"
              min="0"
              className="w-full p-2 border rounded"
              value={formData.price}
              onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              className="w-full p-2 border rounded"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows="3"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <button 
              type="button" 
              className="px-4 py-2 border rounded hover:bg-gray-100"
              onClick={onCancel}
            >
              取消
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-[#6B8E7B] text-white rounded hover:bg-[#5e7d6c]"
            >
              儲存
            </button>
          </div>
        </div>
      </form>
    );
  };

  if (!isApplicationApproved) {
    return (
      <motion.div
        className="bg-gray-100 rounded-lg shadow-sm p-3 opacity-60"
      >
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-base font-medium text-gray-800">{campSite.name}</h3>
        </div>

        <div className="grid grid-cols-3 gap-2 text-sm mb-3">
          <div className="flex items-center text-gray-600">
            <HiOutlineUsers className="w-4 h-4 mr-1 text-gray-400" />
            <span>{campSite.capacity}人</span>
          </div>
          <div className="flex items-center text-gray-600">
            <HiOutlineCash className="w-4 h-4 mr-1 text-gray-400" />
            <span>${campSite.price}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <span>可預訂：{campSite.max_quantity || 0}帳</span>
          </div>
        </div>

        <div className="text-sm text-gray-500 text-center py-2">
          營地審核中，暫時無法操作
        </div>
      </motion.div>
    );
  }

  if (isEditing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-white rounded-lg shadow-sm p-3"
      >
        <EditForm campSite={campSite} onSubmit={handleEdit} onCancel={() => setIsEditing(false)} />
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all p-3"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium text-gray-800">{campSite.name}</h3>
      </div>

      <div className="grid grid-cols-3 gap-2 text-sm mb-3">
        <div className="flex items-center text-gray-600">
          <HiOutlineUsers className="w-4 h-4 mr-1 text-[#6B8E7B]" />
          <span>{campSite.capacity}人</span>
        </div>
        <div className="flex items-center text-gray-600">
          <HiOutlineCash className="w-4 h-4 mr-1 text-[#6B8E7B]" />
          <span>${campSite.price}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <span>可預訂：{campSite.max_quantity || 0}帳</span>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => setIsEditing(true)}
          className="flex-1 py-1.5 text-sm text-[#6B8E7B] border border-[#6B8E7B] rounded hover:bg-[#6B8E7B] hover:text-white transition-colors"
        >
          <HiOutlinePencil className="w-4 h-4 inline mr-1" />
          編輯
        </button>
        <button 
          onClick={handleStatusToggle}
          className={`flex-1 py-1.5 text-sm rounded transition-colors ${
            campSite.status === 1
              ? 'text-red-500 border border-red-500 hover:bg-red-500 hover:text-white'
              : 'text-green-500 border border-green-500 hover:bg-green-500 hover:text-white'
          }`}
        >
          {campSite.status === 1 ? '停用' : '啟用'}
        </button>
        <button
          onClick={handleDelete}
          className="flex-1 py-1.5 text-sm text-[#9C9187] border border-[#9C9187] rounded hover:bg-[#9C9187] hover:text-white transition-colors"
        >
          <HiOutlineTrash className="w-4 h-4 inline mr-1" />
          刪除
        </button>
      </div>
    </motion.div>
  );
} 