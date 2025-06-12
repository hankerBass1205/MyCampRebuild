"use client";
import { ToastContainer, toast as toastify } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaCheck,
  FaTimes,
  FaExclamationTriangle,
  FaInfo,
  FaSpinner,
  FaBell,
} from "react-icons/fa";

// 自定義 Icon 組件 - 添加顏色參數
const CustomIcon = ({ icon: Icon, color }) => (
  <Icon className={`text-xl ${color}`} />
);

// 添加自定義樣式 - 更新進度條顏色和 RWD
const customStyles = `
  .Toastify__progress-bar-theme--light {
    background: linear-gradient(to right, #34d399, #10b981) !important;
  }
  
  .Toastify__progress-bar--success {
    background: linear-gradient(to right, #34d399, #10b981) !important;
  }
  
  .Toastify__progress-bar--error {
    background: linear-gradient(to right, #fb7185, #f43f5e) !important;
  }
  
  .Toastify__progress-bar--warning {
    background: linear-gradient(to right, #fbbf24, #f59e0b) !important;
  }
  
  .Toastify__progress-bar--info {
    background: linear-gradient(to right, #38bdf8, #0ea5e9) !important;
  }

  .Toastify__spinner {
    border-color: var(--gray-4) !important;
  }

  .Toastify__toast-container {
    font-size: var(--font-size-sm);
    font-weight: var(--fw-medium);
    min-width: 300px;
    max-width: 500px;
    top: 130px;
    right: 20px;
  }

  /* 手機版樣式 */
  @media (max-width: 768px) {
    .Toastify__toast-container {
      min-width: 200px;
      max-width: 300px;
      top: 60px;
      right: 10px;
      left: auto;
      padding: 0 10px;
    }

    .Toastify__toast {
      font-size: 0.875rem;
      padding: 8px 12px;
      min-height: auto;
      margin-bottom: 8px;
    }

    .Toastify__toast-body {
      padding: 6px 8px;
    }

    .Toastify__close-button {
      padding: 4px;
    }

    .Toastify__progress-bar {
      height: 3px;
    }
  }

  /* 更小螢幕的樣式 */
  @media (max-width: 480px) {
    .Toastify__toast-container {
      min-width: 160px;
      max-width: 240px;
      top: 100px;
    }

    .Toastify__toast {
      font-size: 0.8125rem;
      padding: 6px 10px;
    }
  }
`;

// Toast Container 元件
export const ToastContainerComponent = () => (
  <>
    <style>{customStyles}</style>
    <ToastContainer
      position="top-right"
      autoClose={2000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick
      pauseOnFocusLoss
      draggable
      pauseOnHover
      theme="light"
      style={{
        fontSize: "var(--font-size-sm)",
        fontWeight: "var(--fw-medium)",
      }}
    />
  </>
);

// 基本設定
const defaultOptions = {
  position: "top-right",
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "light",
  newestOnTop: false,
};

// 統一的吐司服務
export const toast = {
  // 成功提示 (綠色)
  success: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "success",
      icon: <CustomIcon icon={FaCheck} color="text-emerald-500" />,
      autoClose: 1500,
      className: "border-l-4 border-emerald-500",
      style: {
        background: "linear-gradient(to right, #f0fdf4, #ffffff)",
        color: "#059669",
        fontWeight: 500,
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 錯誤提示
  error: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "error",
      icon: <CustomIcon icon={FaTimes} color="text-rose-500" />,
      autoClose: 3000,
      className: "border-l-4 border-rose-500",
      style: {
        background: "linear-gradient(to right, #fff1f2, #ffffff)",
        color: "#e11d48",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 警告提示
  warning: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "warning",
      icon: <CustomIcon icon={FaExclamationTriangle} color="text-amber-500" />,
      autoClose: 3000,
      className: "border-l-4 border-amber-500",
      style: {
        background: "linear-gradient(to right, #fefce8, #ffffff)",
        color: "#d97706",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 一般信息
  info: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "info",
      icon: <CustomIcon icon={FaInfo} color="text-sky-500" />,
      autoClose: 2000,
      className: "border-l-4 border-sky-500",
      style: {
        background: "linear-gradient(to right, #f0f9ff, #ffffff)",
        color: "#0284c7",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 載入中提示
  loading: (message = "載入中...") => {
    return toastify.loading(message, {
      ...defaultOptions,
      icon: <FaSpinner className="animate-spin text-xl text-slate-600" />,
      autoClose: false,
      className: "border-l-4 border-slate-400",
      style: {
        background: "linear-gradient(to right, #f8fafc, #ffffff)",
        color: "#475569",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 更新已存在的 toast
  update: (toastId, message, type = "success") => {
    toastify.update(toastId, {
      render: message,
      type: type,
      autoClose: 1500,
      isLoading: false,
    });
  },
};

// 購物車相關吐司，畫面上 cartToast.以下方法呼叫
export const cartToast = {
  addSuccess: () => toast.success("已加入購物車"),
  removeSuccess: () => toast.success("已移除商品"),
  updateSuccess: () => toast.success("購物車已更新"),
  error: (message) => toast.error(message || "操作失敗，請稍後再試"),
  loading: () => toast.loading("處理中..."),
};

// 收藏相關吐司
export const favoriteToast = {
  addSuccess: () => toast.success("已加入收藏"),
  removeSuccess: () => toast.success("已取消收藏"),
  error: (message) => toast.error(message || "操作失敗，請稍後再試"),
};

// 表單相關吐司
export const formToast = {
  submitSuccess: () => toast.success("提交成功"),
  submitError: (message) => toast.error(message || "提交失敗"),
  saving: () => toast.loading("儲存中..."),
  validateError: () => toast.error("請檢查輸入內容"),
};

// ===== 活動搜尋相關提示 =====
export const searchToast = {
  // 成功提示（用於顯示搜尋成功訊息）
  success: (message = "搜尋完成") => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 警告提示（用於顯示非嚴重的警告訊息）
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 錯誤提示（用於顯示非嚴重的錯誤訊息）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 提示訊息（用於顯示一般資訊）
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// ===== 討論區相關提示 =====
export const discussionToast = {
  // 成功提示
  success: (message) => {
    toastify(message, {
      type: "success",
      icon: <CustomIcon icon={FaCheck} color="text-emerald-500" />,
      autoClose: 1500,
      className: "border-l-4 border-emerald-500",
      style: {
        background: "linear-gradient(to right, #f0fdf4, #ffffff)",
        color: "#059669",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },
  
  // 錯誤提示
  error: (message) => {
    toastify(message, {
      type: "error",
      icon: <CustomIcon icon={FaTimes} color="text-rose-500" />,
      autoClose: 3000,
      className: "border-l-4 border-rose-500",
      style: {
        background: "linear-gradient(to right, #fff1f2, #ffffff)",
        color: "#e11d48",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },
  
  // 警告提示
  warning: (message) => {
    toastify(message, {
      type: "warning",
      icon: <CustomIcon icon={FaExclamationTriangle} color="text-amber-500" />,
      autoClose: 3000,
      className: "border-l-4 border-amber-500",
      style: {
        background: "linear-gradient(to right, #fefce8, #ffffff)",
        color: "#d97706",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },
};

// ===== 設定相關提示 =====
export const settingsToast = {
  // 成功提示（用於顯示操作成功訊息）
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 一般錯誤提示（用於顯示非重要錯誤）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 警告提示（用於顯示警告訊息）
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// ===== 預訂相關提示 =====
export const bookingToast = {
  // 成功提示（用於顯示操作成功訊息）
  success: (message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 錯誤提示（用於顯示一般錯誤訊息）
  error: (message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
    });
  },
};

// 結帳相關提示
export const checkoutToast = {
  success: (message = "操作成功") => {
    toast.success(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  error: (message = "操作失敗") => {
    toast.error(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  warning: (message) => {
    toast.warning(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
  },
};

// ===== 通知相關提示 =====
export const notificationToast = {
  // 刪除成功提示
  deleteSuccess: (type = "all") => {
    toast.success(`已刪除${type === "all" ? "所有" : type}通知`, {
      position: "top-right",
      autoClose: 1500,
    });
  },

  // 錯誤提示
  error: (message) => {
    toast.error(message || "操作失敗，請稍後再試", {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 連線狀態提示
  connectionError: () => {
    toast.error("連線已斷開，請重新整理頁面", {
      position: "top-right",
      autoClose: 3000,
    });
  },

  // 發送成功提示
  sendSuccess: () => {
    toast.success("通知發送成功", {
      position: "top-right",
      autoClose: 1500,
    });
  },

  //  登入歡迎提示
  info: (message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  },
};

// ===== 訂單相關提示 =====
export const orderToast = {
  // 訂單成功提示
  success: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "success",
      icon: <CustomIcon icon={FaCheck} color="text-emerald-500" />,
      autoClose: 2000,
      className: "border-l-4 border-emerald-500",
      style: {
        background: "linear-gradient(to right, #f0fdf4, #ffffff)",
        color: "#059669",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 訂單錯誤提示
  error: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "error",
      icon: <CustomIcon icon={FaTimes} color="text-rose-500" />,
      autoClose: 3000,
      className: "border-l-4 border-rose-500",
      style: {
        background: "linear-gradient(to right, #fff1f2, #ffffff)",
        color: "#e11d48",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 訂單通知提示
  notification: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "info",
      icon: <CustomIcon icon={FaInfo} color="text-blue-500" />,
      autoClose: 2500,
      className: "border-l-4 border-blue-500",
      style: {
        background: "linear-gradient(to right, #eff6ff, #ffffff)",
        color: "#3b82f6",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 訂單警告提示
  warning: (message) => {
    toastify(message, {
      ...defaultOptions,
      type: "warning",
      icon: <CustomIcon icon={FaExclamationTriangle} color="text-amber-500" />,
      autoClose: 3000,
      className: "border-l-4 border-amber-500",
      style: {
        background: "linear-gradient(to right, #fefce8, #ffffff)",
        color: "#d97706",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },
};

// ===== 活動相關提示 =====
export const activityToast = {
  // 錯誤提示
  error: (message) => {
    toastify(message, {
      type: "error",
      icon: <CustomIcon icon={FaTimes} color="text-rose-500" />,
      autoClose: 3000,
      className: "border-l-4 border-rose-500",
      style: {
        background: "linear-gradient(to right, #fff1f2, #ffffff)",
        color: "#e11d48",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },

  // 一般提示
  info: (message) => {
    toastify(message, {
      type: "info",
      icon: <CustomIcon icon={FaInfo} color="text-blue-500" />,
      autoClose: 2500,
      className: "border-l-4 border-blue-500",
      style: {
        background: "linear-gradient(to right, #eff6ff, #ffffff)",
        color: "#3b82f6",
        fontWeight: 500,
        fontSize: '0.95rem',
        boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.05)',
        borderRadius: '0.75rem',
      },
    });
  },
};
