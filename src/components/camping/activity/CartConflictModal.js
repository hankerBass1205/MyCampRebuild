'use client';
import { format } from 'date-fns';
import { showCartAlert } from '@/utils/sweetalert';
import { motion, AnimatePresence } from 'framer-motion';

export default function CartConflictModal({
  open,
  existingItem,
  newOption,
  newQuantity,
  newStartDate,
  newEndDate,
  calculateTotalPrice,
  onConfirm,
  onCancel,
  onUpdate
}) {
  if (!open || !existingItem) return null;

  const handleConfirm = async () => {
    try {
      // 檢查所有必要數據
      if (!existingItem?.id || !newOption?.option_id) {
        console.error('缺少必要資料:', {
          cartId: existingItem?.id,
          optionId: newOption?.option_id
        });
        throw new Error('缺少必要資料');
      }

      const updateData = {
        quantity: newQuantity,
        startDate: newStartDate,
        endDate: newEndDate,
        optionId: newOption.option_id,
        totalPrice: calculateTotalPrice()
      };

      // console.log('準備發送更新請求:', {
      //   cartId: existingItem.id,
      //   updateData
      // });

      const response = await fetch(`/api/camping/cart/${existingItem.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData)
      });

      const responseData = await response.json();
      // console.log('收到伺服器回應:', responseData);

      if (!response.ok) {
        throw new Error(responseData.error || '更新購物車失敗');
      }

      // 成功後直接關閉 modal
      onCancel();
      
      // 使用 showCartAlert.success 顯示成功訊息
      await showCartAlert.success('購物車已更新', '商品數量已成功更新');

      // 調用父組件的更新函數，而不是重新整理頁面
      if (onUpdate) {
        onUpdate();
      }

    } catch (error) {
      console.error('更新購物車時發生錯誤:', error);
      // 使用 showCartAlert.error 顯示錯誤訊息
      await showCartAlert.error('更新失敗', error.message || '更新購物車時發生錯誤，請稍後再試');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-3"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="bg-white rounded-xl w-[95%] max-w-[460px] mx-auto overflow-hidden"
          >
            <div className="p-5">
              <h3 className="text-lg font-medium text-[#4A3C31] mb-3">
                購物車已有相同活動
              </h3>
              
              <div className="space-y-3">
                <p className="text-sm text-[#7C6C55] mb-2">您的購物車中已有此活動：</p>
                
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-[#F5F2EA] p-4 rounded-lg"
                >
                  <p className="font-medium text-[#4A3C31] mb-2 text-sm">現有預訂：</p>
                  <ul className="text-[#7C6C55] space-y-2 text-sm ps-1 mb-0">
                    <ListItem label="營位" value={existingItem.spot_name || '尚未選擇'} />
                    <ListItem label="數量" value={`${existingItem.quantity} 個`} />
                    <ListItem 
                      label="日期" 
                      value={`${format(new Date(existingItem.start_date), 'yyyy/MM/dd')} - ${format(new Date(existingItem.end_date), 'yyyy/MM/dd')}`} 
                    />
                    <ListItem label="金額" value={`NT$ ${existingItem.total_price?.toLocaleString() || 0}`} />
                  </ul>
                </motion.div>
                
                <motion.div 
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-[#F7F9F8] p-4 rounded-lg"
                >
                  <p className="font-medium text-[#4A3C31] mb-2 text-sm">新的選擇：</p>
                  <ul className="text-[#7C6C55] space-y-2 text-sm ps-1 mb-0">
                    <ListItem label="營位" value={newOption?.spot_name || '尚未選擇'} />
                    <ListItem label="數量" value={`${newQuantity} 個`} />
                    <ListItem 
                      label="日期" 
                      value={`${format(new Date(newStartDate), 'yyyy/MM/dd')} - ${format(new Date(newEndDate), 'yyyy/MM/dd')}`} 
                    />
                    <ListItem label="金額" value={`NT$ ${calculateTotalPrice()?.toLocaleString() || 0}`} />
                  </ul>
                </motion.div>
                
                <p className="text-sm text-[#7C6C55] text-center mt-3">
                  是否要更新為新選擇的內容？
                </p>
              </div>

              <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={onCancel}
                  className="w-full sm:w-auto px-5 py-2 border-2 border-[#8B7355] text-[#8B7355] rounded-full
                    hover:bg-[#8B7355]/5 transition-colors text-sm font-medium"
                >
                  保持原有預訂
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleConfirm}
                  className="w-full sm:w-auto px-5 py-2 bg-[#8B7355] text-white rounded-full
                    hover:bg-[#6B5335] transition-colors text-sm font-medium"
                >
                  更新預訂
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// 列表項目元件
const ListItem = ({ label, value }) => (
  <motion.li 
    whileHover={{ x: 1 }}
    className="flex items-start break-all group"
  >
    <span className="flex-shrink-0 mr-1.5 text-[#8B7355] group-hover:text-[#6B5335]">•</span>
    <span className="flex-1">
      <span className="text-[#4A3C31]">{label}：</span>
      {value}
    </span>
  </motion.li>
); 