"use client";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineCog,
  HiOutlineUserCircle,
  HiOutlineLockClosed,
  HiOutlineExclamationCircle,
} from "react-icons/hi";
import SettingsModal from "./SettingsModal";
// 通知組件
import NotificationBell from "@/components/common/NotificationBell";

export default function OwnerHeader() {
  const { data: session } = useSession();
  const [showDropdown, setShowDropdown] = useState(false);
  const [ownerData, setOwnerData] = useState(null);
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: null,
  });

  // 將獲取資料邏輯抽出成函數
  const fetchOwnerData = async () => {
    try {
      const response = await fetch("/api/owner/profile");
      if (!response.ok) throw new Error("獲取資料失敗");
      const data = await response.json();
      setOwnerData(Array.isArray(data) ? data[0] : data);
    } catch (error) {
      console.error("獲取資料錯誤:", error);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchOwnerData();
    }
  }, [session]);

  const handleModalOpen = (type) => {
    setModalConfig({ isOpen: true, type });
    setShowDropdown(false);
  };

  const handleModalClose = () => {
    setModalConfig({ isOpen: false, type: null });
  };

  return (
    <div className="h-[72px] w-[calc(100%-256px)] bg-white/80 backdrop-blur-sm border-b border-[#A8C2B5]/20 
                    px-6 flex items-center justify-end fixed top-0 right-0 z-40">
      <div className="flex items-center space-x-4">
        {/* 使用者身份與姓名 */}
        <div className="flex items-center space-x-2.5 text-[#2C4A3B] text-base">
          <HiOutlineUserCircle className="w-5 h-5" />
          <span className="font-medium text-[15px]">營主：</span>
          {ownerData?.name ? (
            <span className="text-[15px]">{ownerData.name}</span>
          ) : (
            <div className="flex items-center space-x-1.5 text-amber-600">
              <HiOutlineExclamationCircle className="w-4 h-4" />
              <button
                onClick={() => {
                  setModalConfig({
                    isOpen: true,
                    type: "profile",
                  });
                }}
                className="text-[15px] hover:underline"
              >
                請設定個人資料
              </button>
            </div>
          )}
        </div>

        {/* 設定按鈕 */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="h-10 w-10 rounded-full bg-white flex items-center justify-center
                     hover:bg-[#F8F9FA] transition-all duration-200 
                     text-[#2C4A3B] font-medium border border-[#A8C2B5]/20"
          >
            <HiOutlineCog className="w-6 h-6" />
          </button>

          {/* 下拉選單 */}
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2.5 w-44 rounded-lg 
                          bg-white shadow-lg border border-[#A8C2B5]/20">
              <button
                onClick={() => handleModalOpen("profile")}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150
                         border-b border-[#A8C2B5]/10"
              >
                <HiOutlineUser className="w-5 h-5 mr-3" />
                <span>個人資料</span>
              </button>

              <button
                onClick={() => handleModalOpen("password")}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150
                         border-b border-[#A8C2B5]/10"
              >
                <HiOutlineLockClosed className="w-5 h-5 mr-3" />
                <span>修改密碼</span>
              </button>

              <button
                onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
                className="w-full flex items-center px-5 py-3.5 text-[15px] text-[#2C4A3B]
                         hover:bg-[#A8C2B5]/10 transition-colors duration-150"
              >
                <HiOutlineLogout className="w-5 h-5 mr-3" />
                <span>登出系統</span>
              </button>
            </div>
          )}
        </div>
        
        {/* 通知組件 */}
        <NotificationBell />
      </div>

      {/* Modal 組件 */}
      <SettingsModal
        isOpen={modalConfig.isOpen}
        onClose={handleModalClose}
        type={modalConfig.type}
        ownerData={ownerData}
        onUpdate={fetchOwnerData}
      />
    </div>
  );
}
