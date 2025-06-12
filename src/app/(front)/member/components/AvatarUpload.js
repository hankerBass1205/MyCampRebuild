// components/AvatarUpload.js
import React from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";

const AvatarUpload = ({ avatar, setAvatar }) => {
  const { data: session } = useSession();

  const AVATAR_OPTIONS = [
    "avatar1.png",
    "avatar2.png",
    "avatar3.png",
    "avatar4.png",
    "avatar5.png",
    "default-avatar.png",
  ];

  const handleAvatarChange = async (selectedAvatar) => {
    try {
      const userId = session?.user?.id;

      if (!userId) {
        Swal.fire("錯誤", "用戶未登入", "error");
        return;
      }

      console.log("發送頭像更新請求:", selectedAvatar);

      const response = await axios.patch(
        `/api/member/profile/avatar/${userId}`,
        { avatar: selectedAvatar },
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      console.log("API 回應:", response.data);

      if (response.data.success) {
        setAvatar(response.data.avatar);
        Swal.fire("成功", "頭像已更新", "success");
      }
    } catch (error) {
      console.error("更新失敗詳細錯誤:", {
        message: error.message,
        response: error.response?.data,
      });

      Swal.fire("錯誤", error.response?.data?.error || "更新頭像失敗", "error");
    }
  };

  return (
    <div className="avatar-grid">
      {AVATAR_OPTIONS.map((file) => (
        <div
          key={file}
          className={`avatar-item ${avatar.includes(file) ? "selected" : ""}`}
          onClick={() => handleAvatarChange(file)}
        >
          <img
            src={`/images/member/${file}`}
            alt="avatar"
            onError={(e) => {
              e.target.src = "/images/member/default-avatar.png";
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default AvatarUpload;
