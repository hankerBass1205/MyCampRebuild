"use client";

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { motion, AnimatePresence } from "framer-motion"; // 引入 framer-motion
export default function ProfileDetails() {
  const { data: session, status, update: updateSession } = useSession();
  const router = useRouter();
  const [user, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [password, setPassword] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loginType, setLoginType] = useState("");
  const [points, setPoints] = useState(0);
  const itemsPerPage = 4;
  const [levelName, setLevelName] = useState(""); // 會員等級名稱
  const [levelDescription, setLevelDescription] = useState(""); // 會員等級描述
  const [otherBenefits, setOtherBenefits] = useState(""); // 其他權益
  const [pointsToNextLevel, setPointsToNextLevel] = useState("0"); // 升級所需點數
  const [loading, setLoading] = useState(true); // 加載狀態
  const [isFormChanged, setIsFormChanged] = useState(false); // 表單是否有變更
  const [selectedFile, setSelectedFile] = useState(null); // 用於存儲選擇的文件
  const [uploadProgress, setUploadProgress] = useState(0); // 上傳進度
  const [birthday, setBirthday] = useState(""); // 生日
  const [phoneError, setPhoneError] = useState(""); // 電話號碼錯誤信息
  const [nameError, setNameError] = useState(""); // 姓名錯誤信息
  const [passwordError, setPasswordError] = useState(""); // 密碼錯誤信息
  const [userId, setUserId] = useState(""); // 用戶 ID
  const [userEmail, setUserEmail] = useState(""); // 用戶電子郵件
  const [userLineId, setUserLineId] = useState(""); // 用戶 Line ID
  // 移除錯誤的 formattedDate 變數
  const AVATAR_OPTIONS = [
    "avatar1.png",
    "avatar2.png",
    "avatar3.png",
    "avatar4.png",
    "avatar5.png",
    "default-avatar.png",
  ];

  // 新增的年齡計算函數
  const calculateAge = (birthDateString) => {
    if (!birthDateString) return null;
    // 將生日轉換為Date物件，不附加時間以避免時區問題
    const birthDate = new Date(birthDateString);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();

    // 如果當前月份小於生日月份，或當前月份等於生日月份但當前日期小於生日日期，則年齡減1
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  useEffect(() => {
    // if (status === "loading") return; // 等待會話加載完成

    if (!session) {
      Swal.fire({
        icon: "error",
        title: "請先登入",
        text: "請先登入會員",
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });
      router.push("/auth/login");
      return;
    }

    const userId = session.user.id; // 從會話中獲取用戶 ID

    axios
      .get(`/api/member/profile/${userId}`) // 在 API 請求中包含 userId
      .then((response) => {
        const userData = response.data;
        if (!userData) {
          throw new Error("用戶資料加載失敗");
        }
        setProfile(userData);
        setName(userData.name);
        setAddress(userData.address);
        setPhone(userData.phone);
        setAvatar(userData.avatar);
        setLevelName(userData.level_name);
        setLevelDescription(userData.level_description);
        setOtherBenefits(userData.other_benefits);

        // 修正生日處理，確保格式正確
        if (userData.birthday) {
          // 只取日期部分，忽略時間部分，避免時區問題
          const dateOnly = userData.birthday.split("T")[0];
          setBirthday(dateOnly);
        } else {
          setBirthday("");
        }

        // 計算升級所需積分
        if (userData.level_id < 5) {
          setPointsToNextLevel(
            (userData.required_points - userData.points || 0).toString()
          );
        } else {
          setPointsToNextLevel("已達最高等級");
        }

        // 檢查點數是否達到下一階
        if (
          userData.level_id < 5 &&
          userData.points >= userData.required_points
        ) {
          const newLevelId = userData.level_id + 1;
          axios
            .put(`/api/member/profile/${userId}`, {
              ...userData,
              level_id: newLevelId,
            })
            .then((response) => {
              const updatedUserData = response.data;
              setProfile(updatedUserData);
              setLevelName(updatedUserData.level_name);
              setLevelDescription(updatedUserData.level_description);
              setOtherBenefits(updatedUserData.other_benefits);
              setPointsToNextLevel(
                (
                  updatedUserData.required_points - updatedUserData.points || 0
                ).toString()
              );
              // 自動刷新頁面
              window.location.reload();
            })
            .catch((error) => {
              console.error("更新等級失敗:", error);
            });
        }
        setLoading(false); // 數據加載完成
      })
      .catch((error) => {
        setLoading(false); // 數據加載完成
        console.error("There was an error fetching the profile!", error);
      });
  }, [session, status]);

  const handleUpdate = async () => {
    try {
      const result = await Swal.fire({
        title: "確定要更新資料嗎?",
        // iconHtml: '<img src="/images/icons/camping-alert.svg" width="50">',
        showCancelButton: true,
        // confirmButtonColor: "#4A6B3D",
        cancelButtonColor: "#9B7A5A",
        confirmButtonText: "確認更新",
        cancelButtonText: "取消",
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });

      if (result.isConfirmed) {
        // 更新使用者資料
        const userId = session.user.id;
        if (password && user.login_type === "email") {
          const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/;
          if (!passwordRegex.test(password)) {
            await Swal.fire({
              title: "密碼無效",
              text: "密碼必須包含至少一個字母和一個數字，且長度至少為6位",
              confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
            });
            return;
          }
        }

        const response = await axios.put(`/api/member/profile/${userId}`, {
          name,
          address,
          phone,
          avatar,
          password: user.login_type === "email" ? password : null, // 只有一般登入才更新密碼
          level_id: user.level_id,
          birthday, // 添加生日字段
        });

        if (
          response.data.error &&
          response.data.error.includes("電話號碼格式無效")
        ) {
          setPhoneError(response.data.error);
        } else {
          setPhoneError("");

          // 手動更新 session
          session.user.name = name;
          session.user.address = address;
          session.user.phone = phone;
          session.user.avatar = avatar;
          await updateSession({ ...session });
          // 手動更新本地狀態
          setProfile((prevProfile) => ({
            ...prevProfile,
            name,
            address,
            phone,
            avatar,
          }));

          await Swal.fire({
            icon: "success",
            title: "更新成功！",
            // iconHtml: '<img src="/images/icons/camping-success.svg" width="50">',
            // confirmButtonColor: "#4A6B3D",
            confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
          });

          setIsFormChanged(false); // 重置表單變更狀態
        }
      }
    } catch (error) {
      await Swal.fire({
        title: "更新失敗",
        text: "請稍後再試",
        // iconHtml: '<img src="/images/icons/camping-error.svg" width="50">',
        confirmButtonColor: "#5b4034", // 修改確認按鈕顏色
      });
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    setName(value);
    const hasNumber = /\d/.test(value);
    if (!value) {
      setNameError("姓名不得為空");
    } else if (hasNumber) {
      setNameError("姓名不得包含數字");
    } else {
      setNameError(""); // 清除錯誤訊息
    }
    setIsFormChanged(true);
  };

  const handleAddressChange = (e) => {
    setAddress(e.target.value);
    setIsFormChanged(true);
  };

  const handlePhoneChange = (e) => {
    const value = e.target.value;
    setPhone(value);
    if (phoneError) {
      setPhoneError("");
    }
    if (!value) {
      setPhoneError("電話號碼為必填");
    } else if (!validatePhone(value)) {
      setPhoneError("請輸入有效的電話號碼");
    }
    setIsFormChanged(true);
  };

  const handleBlur = () => {
    if (!phone) {
      setPhoneError("電話號碼為必填");
    }
  };

  const validatePhone = (number) => {
    const regex = /^(09\d{8}|0\d{1,2}-\d{7,8})$/; // 匹配台灣手機號碼或市話號碼格式
    return regex.test(number);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    setIsFormChanged(true);
  };

  const handleBirthdayChange = (e) => {
    // 直接取得日期值，不做額外時區處理
    setBirthday(e.target.value);
    setIsFormChanged(true);
  };
  const handleAvatarChange = async (selectedAvatar) => {
    try {
      const userId = session?.user?.id;

      const response = await axios.patch(
        `/api/member/profile/avatar/${userId}`,
        { avatar: selectedAvatar } // 確保只傳遞文件名
      );

      if (response.data.success) {
        // 更新本地狀態
        setAvatar(response.data.avatar);
        // 更新 session 中的用戶頭像
        session.user.avatar = response.data.avatar;
        // 關閉模態框
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error("更新失敗:", error);
    }
  };

  // 根據 level_id 返回會員等級名稱
  const getLevelName = (levelId) => {
    switch (levelId) {
      case 1:
        return "新手";
      case 2:
        return "銅牌";
      case 3:
        return "銀牌";
      case 4:
        return "金牌";
      case 5:
        return "鑽石";
      default:
        return "未知等級";
    }
  };
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await axios.post(
        "/api/member/profile/avatar/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const percent = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            setUploadProgress(percent);
          },
        }
      );
      if (response.data.success) {
        setAvatar(response.data.avatar);
        session.user.avatar = response.data.avatar;
        Swal.fire("成功", "頭像已更新", "success");
        setUploadProgress(0);
      }
    } catch (error) {
      Swal.fire("錯誤", "頭像更新失敗", "error");
      setUploadProgress(0);
    }
  };
  const getBadgeStyle = () => {
    const styles = {
      1: { color: "#8B4513", icon: "beginner.png" },
      2: { color: "#CD7F32", icon: "bronze.png" },
      3: { color: "#C0C0C0", icon: "silver.png" },
      4: { color: "#FFD700", icon: "gold.png" },
      5: { color: "#B9F2FF", icon: "diamond.gif" },
    };
    return styles[user.level_id] || styles[1];
  };
  const UPLOAD_BASE_URL = "/uploads/avatars/"; // 用於上傳文件的基礎URL
  // const AVATAR_BASE_URL = "../images/member/"; // 定義頭像基礎URL
  const DEFAULT_AVATAR = `${UPLOAD_BASE_URL}default-avatar.png`; // 預設頭像路徑
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    if (isNaN(date)) {
      return "無效日期";
    }
    return date.toLocaleDateString("zh-TW", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  const progress =
    user?.level_id < 5 ? (user?.points / user?.required_points) * 100 : 100;

  if (status === "loading" || loading || !user) {
    return (
      <div className="profile-container">
        <AnimatePresence>
          {Array(4) // 假設您希望顯示 4 個骨架屏
            .fill()
            .map((_, index) => (
              <motion.div
                key={index}
                className="profile-skeleton"
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -50 }}
                transition={{ duration: 0.5 }}
              />
            ))}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="profile-container">
      {/* 等級信息區塊 */}
      <section className="profile-section level-info">
        <h3>會員等級</h3>

        <div className="level-header">
          <img src={`/images/member/${getBadgeStyle().icon}`} alt="等級圖標" />
          <h2>{levelName}</h2>
        </div>

        <div className="progress-bar">
          <div style={{ width: `${progress}%` }}></div>
        </div>

        <div className="points-grid">
          <div className="point-item">
            <label>當前積分</label>
            <div className="point-value">{user.points}</div>
          </div>
          <div className="point-item">
            <label>{user.level_id < 5 ? "升級需求" : "已達頂級"}</label>
            <div className="point-value">
              {user.level_id < 5 ? user.required_points : "∞"}
            </div>
          </div>
        </div>
      </section>

      {/* 賬號安全區塊 */}
      <section className="profile-section account-security">
        <h3>帳號安全</h3>
        <div className="form-group">
          <label>電子郵件</label>
          <span>{user.login_type === "line" ? "Line" : user.email}</span>
        </div>
        {user.login_type === "email" && !user.line_user_id && (
          <div className="form-group">
            <label>修改密碼</label>
            <input
              type="password"
              placeholder="輸入新密碼"
              value={password}
              onChange={handlePasswordChange}
            />
          </div>
        )}
        {user.login_type === "google" && (
          <div className="form-group">
            <label>Google 帳號</label>
            <span>{user.email}</span>
          </div>
        )}
        {user.line_user_id && (
          <div className="form-group">
            <label>Line 帳號</label>
            <span>{user.line_user_id}</span>
          </div>
        )}
      </section>

      {/* 個人信息區塊 */}
      <section className="profile-section personal-info">
        <h3>個人資訊</h3>
        <div className="info-grid">
          <div className="form-group">
            <label>姓名</label>
            <input value={name} onChange={handleNameChange} />
            {nameError && <span className="error-message">{nameError}</span>}
          </div>
          <div className="form-group">
            <label>出生日期</label>
            <input
              type="date"
              value={birthday}
              onChange={handleBirthdayChange}
            />
          </div>
          <div className="form-group">
            <label>年齡</label>
            {birthday && (
              <span className="age-badge">{calculateAge(birthday)}歲</span>
            )}
          </div>

          <div className="form-group">
            <label>會員資格</label>
            <span>{formatDate(user.created_at)}</span>
          </div>
        </div>

        <div className="avatar-editor">
          <img
            src={avatar ? `${UPLOAD_BASE_URL}${avatar}` : DEFAULT_AVATAR}
            alt="用戶頭像"
            className="avatar-image"
            width={100}
            height={100}
            onError={(e) => {
              e.target.onerror = null; // 防止循環觸發
              e.target.src = DEFAULT_AVATAR;
            }}
          />
          <button className="edit-btn" onClick={() => setIsModalOpen(true)}>
            <span>更換頭像</span>
          </button>
        </div>
      </section>

      {/* 聯絡方式區塊 */}
      <section className="profile-section contact-info">
        <h3>聯絡方式</h3>
        <div className="form-group">
          <label>電話號碼</label>
          <input value={phone} onChange={handlePhoneChange} />
          {phoneError && <span className="error-message">{phoneError}</span>}
        </div>
        <div className="form-group">
          <label>住家地址</label>
          <input value={address} onChange={handleAddressChange} />
        </div>
        {isFormChanged && (
          <button
            className="save-btn"
            onClick={handleUpdate}
            disabled={!!phoneError || !!nameError || !name || !phone}
          >
            保存修改
          </button>
        )}
        {(phoneError || nameError) && (
          <div className="error-message">
            {nameError && <span className="error-message"> {nameError}</span>}
            {phoneError && <span className="error-message"> {phoneError}</span>}
          </div>
        )}
      </section>

      {/* 頭像選擇模態框 */}
      {isModalOpen && (
        <div className="avatar-modal">
          {/* 保持原有模態框邏輯 */}
          <div className="modal-content">
            <span className="close" onClick={() => setIsModalOpen(false)}>
              &times;
            </span>
            <h2>選擇頭像</h2>
            <div className="avatar-selection m-auto">
              {AVATAR_OPTIONS.map((img) => (
                <img
                  key={img}
                  src={`/images/member/${img}`} // 確保路徑正確
                  onClick={() => handleAvatarChange(img)}
                  style={{
                    border:
                      avatar === `/images/member/${img}`
                        ? "2px solid #5b4034"
                        : "none",
                  }}
                />
              ))}
            </div>

            <div className="file-upload">
              <input
                type="file"
                id="custom-avatar"
                accept="image/*"
                onChange={handleFileUpload}
                className="upload-input"
              />
              <label htmlFor="custom-avatar" className="upload-label">
                {uploadProgress > 0 ? (
                  `上傳中... ${uploadProgress}%`
                ) : (
                  <>
                    <i className="bi bi-cloud-upload"></i>
                    上傳自定義頭像
                  </>
                )}
              </label>
              <p className="upload-hint">支持 JPG/PNG 格式，最大5MB</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
