// ===== 通用提示訊息服務 =====
import Swal from 'sweetalert2';

// 基本設定
const defaultOptions = {
  confirmButtonColor: 'var(--secondary-1)',
  cancelButtonColor: 'var(--gray-7)',
  cancelButtonText: '取消',
  confirmButtonText: '確定',
  customClass: {
    cancelButton: 'border border-gray-400 text-gray-600 hover:bg-gray-50',
  }
};

// 成功提示（自動關閉）
export const showSuccess = async (title, text = '') => {
  return Swal.fire({
    icon: 'success',
    title,
    text,
    timer: 1500,
    showConfirmButton: false,
    ...defaultOptions
  });
};

// 錯誤提示
export const showError = async (title, text) => {
  return Swal.fire({
    icon: 'error',
    title,
    text,
    ...defaultOptions
  });
};

// 需要確認的提示（一般）
export const showConfirm = async (title, text) => {
  return Swal.fire({
    icon: 'info',
    title,
    text,
    showCancelButton: true,
    ...defaultOptions
  });
};

// 新增：需要確認的危險操作提示
export const showDangerConfirm = async (title, text) => {
  return Swal.fire({
    icon: 'warning',
    title,
    text,
    showCancelButton: true,
    confirmButtonText: '確定刪除',
    cancelButtonText: '取消',
    confirmButtonColor: 'var(--status-error)', // 使用紅色
    cancelButtonColor: 'transparent',
    customClass: {
      cancelButton: 'border border-gray-400 text-gray-600 hover:bg-gray-50',
    }
  });
};

// 登入相關提示
export const showLoginAlert = {
  warning: () => Swal.fire({
    icon: 'warning',
    title: '請先登入',
    text: '請先登入後再進行操作',
    showCancelButton: true,
    ...defaultOptions
  }),
  
  error: (message) => Swal.fire({
    icon: 'error',
    title: '登入失敗',
    text: '請先登入後再進行操作',
    ...defaultOptions
  }),

  // 新增 Google 登入錯誤處理
  googleError: (message) => Swal.fire({
    icon: 'warning',
    title: '登入方式不符',
    text: '請使用 Google 帳號登入',
    confirmButtonText: '確定',
    ...defaultOptions
  })
};

// 註冊相關提示
export const showRegisterAlert = {
  // 註冊成功
  success: async () => {
    return Swal.fire({
      icon: 'success',
      title: '註冊成功！',
      text: '系統將自動為您登入...',
      timer: 1500,
      timerProgressBar: true,
      showConfirmButton: false,
      customClass: {
        popup: 'animate__animated animate__fadeInUp'
      },
      ...defaultOptions
    });
  },
  
  // 註冊失敗
  failure: async (message) => {
    return showError(
      '註冊失敗',
      message || '註冊時發生錯誤，請稍後再試'
    );
  },
  
  // 系統錯誤
  error: async () => {
    return showError(
      '系統錯誤',
      '註冊時發生錯誤，請稍後再試'
    );
  },

  // Email 已存在
  emailExists: async () => {
    return showError(
      '註冊失敗',
      '此電子信箱已被註冊'
    );
  }
};

// 忘記密碼相關提示
export const showForgotPasswordAlert = {
  // 發送驗證碼成功
  sendOTPSuccess: async () => {
    return showSuccess(
      '驗證碼已發送',
      '請查看您的信箱'
    );
  },

  // 驗證碼驗證成功
  verifyOTPSuccess: async () => {
    return showSuccess(
      '驗證成功',
      '請設定新密碼'
    );
  },

  // 重設密碼成功
  resetSuccess: async () => {
    return showSuccess(
      '密碼重設成功',
      '請使用新密碼登入'
    );
  },

  // 信箱未註冊
  emailNotFound: async () => {
    return showError(
      '信箱未註冊',
      '此信箱尚未註冊，請確認後重試'
    );
  },

  // 驗證碼錯誤
  invalidOTP: async () => {
    return showError(
      '驗證碼無效',
      '請確認驗證碼是否正確'
    );
  },

  // 系統錯誤
  error: async (message = '操作失敗，請稍後再試') => {
    return showError(
      '系統錯誤',
      message
    );
  }
};

// 新增購物車相關提示
export const showCartAlert = {
  // 成功提示
  success: async (title, text = '') => {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      timer: 1500,
      showConfirmButton: false,
      ...defaultOptions
    });
  },

  // 錯誤提示
  error: async (title, text = '') => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 確認對話框
  confirm: async (title, text) => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: '確定',
      cancelButtonText: '取消',
      ...defaultOptions
    });
  }
};

// ===== 結帳完成頁面專用提示 =====
export const showCompleteAlert = {
  // 訂單狀態提示（需要用戶確認的重要狀態）
  orderStatus: async (status, message) => {
    const statusConfig = {
      confirmed: {
        icon: 'success',
        title: '訂單確認成功',
        text: message || '您的訂單已確認成功！'
      },
      pending: {
        icon: 'info',
        title: '訂單處理中',
        text: message || '您的訂單正在處理中，請稍候...'
      },
      cancelled: {
        icon: 'error',
        title: '訂單已取消',
        text: message || '您的訂單已被取消'
      }
    };

    const config = statusConfig[status] || {
      icon: 'info',
      title: '訂單狀態更新',
      text: message
    };

    return Swal.fire({
      ...config,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 嚴重錯誤提示（需要用戶注意的錯誤）
  criticalError: async (title, text) => {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  }
};

// ===== 系統錯誤提示 =====
export const showSystemAlert = {
  // 添加 success 方法
  success: (message = '操作成功') => Swal.fire({
    icon: 'success',
    title: '成功',
    text: message,
    timer: 1500,
    showConfirmButton: false,
    ...defaultOptions
  }),

  error: (message = '系統發生錯誤') => Swal.fire({
    icon: 'error',
    title: '系統錯誤',
    text: message,
    confirmButtonText: '確定',
    ...defaultOptions
  }),
  
  unexpectedError: () => Swal.fire({
    icon: 'error',
    title: '系統錯誤',
    text: '發生未預期的錯誤，請稍後再試',
    confirmButtonText: '確定',
    ...defaultOptions
  })
};

// ===== 收藏相關提示 =====
export const showFavoriteAlert = {
  // 系統錯誤
  error: async (message = '操作失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '系統錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 確認移除收藏
  confirmRemove: async (title = '確認移除', text = '確定要移除此收藏嗎？') => {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      showCancelButton: true,
      confirmButtonText: '確定移除',
      cancelButtonText: '取消',
      ...defaultOptions
    });
  },

  // 無收藏提示
  empty: async () => {
    return Swal.fire({
      icon: 'info',
      title: '尚無收藏',
      text: '您目前沒有收藏任何活動',
      confirmButtonText: '去探索活動',
      ...defaultOptions
    });
  }
};

// ===== 活動搜尋相關提示 =====
export const showSearchAlert = {
  // 搜尋錯誤提示（用於顯示搜尋過程中的嚴重錯誤）
  error: async (message = '搜尋失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '搜尋錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 日期範圍錯誤提示（用於提示用戶日期選擇不正確）
  dateRangeError: async (message = '請選擇正確的日期範圍') => {
    return Swal.fire({
      icon: 'warning',
      title: '日期範圍錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 價格範圍錯誤提示（用於提示用戶價格輸入不正確）
  priceRangeError: async (message = '請輸入正確的價格範圍') => {
    return Swal.fire({
      icon: 'warning',
      title: '價格範圍錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  }
};

// ===== 討論區相關提示 =====
export const showDiscussionAlert = {
  // 確認刪除提示
  confirmDelete: async () => {
    return Swal.fire({
      icon: 'warning',
      title: '確認刪除',
      text: '確定要刪除這則評論嗎？',
      showCancelButton: true,
      confirmButtonText: '確定刪除',
      cancelButtonText: '取消',
      ...defaultOptions
    });
  },

  // 成功提示
  success: async (message) => {
    return Swal.fire({
      icon: 'success',
      title: '成功',
      text: message,
      timer: 1500,
      showConfirmButton: false,
      ...defaultOptions
    });
  },

  // 系統錯誤提示
  error: async (message = '操作失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '系統錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 警告提示
  warning: async (message) => {
    return Swal.fire({
      icon: 'warning',
      title: '提示',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 分享成功提示
  shareSuccess: async () => {
    return Swal.fire({
      icon: 'success',
      title: '分享成功',
      text: '連結已複製到剪貼簿',
      timer: 1500,
      showConfirmButton: false,
      ...defaultOptions
    });
  }
};

// ===== 設定相關提示 =====
export const showSettingsAlert = {
  // 系統錯誤提示（用於顯示系統層級錯誤）
  error: async (message = '操作失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '系統錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 密碼錯誤提示（用於顯示密碼驗證失敗）
  passwordError: async (message = '密碼錯誤') => {
    return Swal.fire({
      icon: 'error',
      title: '密碼驗證失敗',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 表單驗證錯誤提示（用於顯示表單驗證失敗）
  validationError: async (message = '請檢查輸入資料') => {
    return Swal.fire({
      icon: 'warning',
      title: '資料驗證失敗',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  }
};

// ===== 預訂相關提示 =====
export const showBookingAlert = {
  // 確認取消預訂提示（用於取消預訂前的確認）
  confirmCancel: async () => {
    return Swal.fire({
      icon: 'warning',
      title: '確認取消預訂',
      text: '確定要取消這筆預訂嗎？',
      showCancelButton: true,
      confirmButtonText: '確定取消',
      cancelButtonText: '返回',
      ...defaultOptions
    });
  },

  // 系統錯誤提示（用於顯示嚴重錯誤）
  error: async (message = '操作失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '系統錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  }
};

// ===== 通知相關提示 =====
export const showNotificationAlert = {
  // 確認刪除提示
  confirmDelete: async (type = 'all') => {
    return Swal.fire({
      icon: 'warning',
      title: '確認刪除',
      text: `確定要刪除${type === 'all' ? '所有' : type}通知嗎？`,
      showCancelButton: true,
      confirmButtonText: '確定刪除',
      confirmButtonColor: 'var(--status-error)', // 使用紅色
      cancelButtonText: '取消',
      cancelButtonColor: 'transparent',
      customClass: {
        cancelButton: 'border border-gray-400 text-gray-600 hover:bg-gray-50',
      }
    });
  },

  // 刪除成功提示
  deleteSuccess: async () => {
    return Swal.fire({
      icon: 'success',
      title: '刪除成功',
      timer: 1500,
      showConfirmButton: false
    });
  },

  // 系統錯誤提示
  error: async (message = '操作失敗') => {
    return Swal.fire({
      icon: 'error',
      title: '系統錯誤',
      text: message,
      confirmButtonText: '確定',
      ...defaultOptions
    });
  },

  // 確認發送對話框
  confirmSend: ({ title, content, targetRole, type }) => {
    return Swal.fire({
      title: '確認發送通知',
      html: `
        <div class="text-left">
          <p class="mb-2"><strong>發送對象：</strong>${targetRole}</p>
          <p class="mb-2"><strong>通知類型：</strong>${type}</p>
          <p class="mb-2"><strong>通知標題：</strong>${title}</p>
          <p class="mb-2"><strong>通知內容：</strong>${content}</p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: '確認發送',
      cancelButtonText: '取消',
      confirmButtonColor: 'var(--secondary-brown)',
      cancelButtonColor: 'var(--gray-6)'
    });
  },

  // 發送成功提示
  sendSuccess: async () => {
    return Swal.fire({
      icon: 'success',
      title: '發送成功',
      text: '通知已成功發送給指定用戶',
      timer: 1500,
      showConfirmButton: false,
      ...defaultOptions
    });
  },

  // 發送失敗提示
  sendError: async (message) => {
    return Swal.fire({
      icon: 'error',
      title: '發送失敗',
      text: message || '通知發送失敗，請稍後再試',
      ...defaultOptions
    });
  }
}; 