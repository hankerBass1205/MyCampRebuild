"use client";
// ===== React 相關引入 =====
import { useState, useEffect, useMemo } from "react"; // 引入 React 狀態管理和生命週期鉤子
import { useSession, signIn } from "next-auth/react"; // 引入使用者身份驗證功能
import dayjs from 'dayjs';
import 'dayjs/locale/zh-tw'; // 引入繁體中文語系
dayjs.locale('zh-tw'); // 設定語系

// ===== UI 組件和圖標引入 =====
import {
  FaEdit,
  FaTrash,
  FaHeart,
  FaRegHeart,
  FaReply,
  FaShare,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa"; // 引入編輯和刪除圖標組件

// ===== 自定義組件引入 =====
import StarRating from "./StarRating"; // 引入星級評分組件
// import DiscussionCarousel from "./DiscussionCarousel"; // 引入評論輪播展示組件

// ===== 自定義提示工具引入 =====
import { showDiscussionAlert } from "@/utils/sweetalert";

import {
  discussionToast, // 保留這個用於顯示提醒
} from "@/utils/toast";

import { motion, AnimatePresence } from "framer-motion"; // 需要安裝 framer-motion

export default function DiscussionSection({ activityId }) {
  const { data: session, status } = useSession();
  const [discussions, setDiscussions] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [content, setContent] = useState("");
  const [rating, setRating] = useState(5);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDiscussionId, setEditingDiscussionId] = useState(null);
  const [likedDiscussions, setLikedDiscussions] = useState(new Set());
  const [showReplyForm, setShowReplyForm] = useState(null);
  const [replyContent, setReplyContent] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // 'newest', 'highest', 'lowest'
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3; // 預設顯示的評論數量
  const [replies, setReplies] = useState({}); // 儲存所有評論的回覆
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true); // 添加初始載入狀態

  // 添加 formatDate 函數
  const formatDate = (date) => {
    if (!date) return '';
    const now = dayjs();
    const target = dayjs(date);
    
    // 如果是今天，顯示時間
    if (target.isSame(now, 'day')) {
      return target.format('HH:mm');
    }
    // 如果是昨天，顯示「昨天」
    if (target.isSame(now.subtract(1, 'day'), 'day')) {
      return '昨天';
    }
    // 如果是今年，只顯示月份和日期
    if (target.isSame(now, 'year')) {
      return target.format('MM/DD');
    }
    // 其他情況顯示完整日期
    return target.format('YYYY/MM/DD');
  };

  // 修改獲取討論列表的函數
  const fetchDiscussions = async () => {
    try {
      setIsInitialLoading(true);
      // 1. 先獲取所有討論
      const res = await fetch(`/api/camping/activities/${activityId}/discussions`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // 2. 一次性獲取所有回覆
      const repliesRes = await fetch(
        `/api/camping/activities/${activityId}/discussions/replies/all`
      );
      const repliesData = await repliesRes.json();

      // 3. 將回覆數據整理成以討論 ID 為 key 的對象
      const repliesMap = repliesData.replies.reduce((acc, reply) => {
        if (!acc[reply.discussion_id]) {
          acc[reply.discussion_id] = [];
        }
        acc[reply.discussion_id].push(reply);
        return acc;
      }, {});

      // 4. 將回覆數據合併到討論中
      const discussionsWithReplies = data.discussions.map(discussion => ({
        ...discussion,
        replies: repliesMap[discussion.id] || []
      }));

      setDiscussions(discussionsWithReplies);
      setAverageRating(data.averageRating);
      setTotalCount(data.total);
    } catch (error) {
      discussionToast.error("無法載入評論，請稍後再試");
      console.error("獲取評論失敗:", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  // 獲取用戶ID的輔助函數
  const getUserId = (session) => {
    if (!session || !session.user) return null;
    
    // 如果有 userId 直接使用
    if (session.userId) {
      return session.userId;
    }
    
    return null;
  };

  // 獲取用戶名稱的輔助函數
  const getUserName = (session) => {
    if (!session || !session.user) return null;
    
    // 如果有 userName 直接使用
    if (session.userName) {
      return session.userName;
    }
    
    return '未設定名稱';
  };

  // 提交評論（新增或編輯）
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!session || !session.user) {
      discussionToast.warning("請先登入後再發布評論");
      return;
    }

    if (!content.trim()) {
      discussionToast.warning("請輸入評論內容");
      return;
    }

    setIsLoading(true);
    try {
      // 只發送後端需要的資料
      const discussionData = {
        content: content.trim(),
        rating: Number(rating)  // 確保 rating 是數字
      };

      // console.log('準備提交的評論數據:', discussionData);

      let res;
      if (editingDiscussionId) {
        res = await fetch(
          `/api/camping/activities/${activityId}/discussions/${editingDiscussionId}`,
          {
            method: "PUT",
            headers: { 
              "Content-Type": "application/json"
            },
            body: JSON.stringify(discussionData),
          }
        );
      } else {
        res = await fetch(`/api/camping/activities/${activityId}/discussions`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json"
          },
          body: JSON.stringify(discussionData),
        });
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "提交評論失敗");
      }

      discussionToast.success(
        editingDiscussionId ? "評論更新成功" : "評論發布成功"
      );
      
      setContent("");
      setRating(5);
      setEditingDiscussionId(null);
      fetchDiscussions();
    } catch (error) {
      console.error("評論提交錯誤:", error);
      discussionToast.error(error.message || "評論提交失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  // 編輯評論
  const handleEdit = (discussion) => {
    setContent(discussion.content);
    setRating(discussion.rating);
    setEditingDiscussionId(discussion.id);
  };

  // 取消編輯
  const handleCancelEdit = () => {
    setContent("");
    setRating(5);
    setEditingDiscussionId(null);
    fetchDiscussions();
  };

  // 刪除評論
  const handleDelete = async (discussionId) => {
    // 使用 SweetAlert 顯示刪除確認
    const result = await showDiscussionAlert.confirmDelete();
    if (!result.isConfirmed) return;

    try {
      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}`,
        { method: "DELETE" }
      );

      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      // 使用 Toast 顯示刪除成功提示
      discussionToast.success("評論已成功刪除");
      fetchDiscussions();
    } catch (error) {
      // 使用 SweetAlert 顯示系統錯誤
      await showDiscussionAlert.error(error.message || "刪除失敗，請稍後再試");
    }
  };

  // 處理點讚
  const handleLike = async (discussionId) => {
    if (!session) {
      await showDiscussionAlert.warning("請先登入後再進行點讚");
      return;
    }

    try {
      // 修正 API 路徑
      const response = await fetch(`/api/camping/activities/discussions/${discussionId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('點讚失敗');
      }

      const data = await response.json();

      // 更新本地狀態
      setLikedDiscussions(prev => {
        const newSet = new Set(prev);
        if (data.liked) {
          newSet.add(discussionId);
        } else {
          newSet.delete(discussionId);
        }
        return newSet;
      });

      // 更新點讚數量
      setDiscussions(prev => prev.map(disc => {
        if (disc.id === discussionId) {
          return {
            ...disc,
            likes_count: disc.likes_count + (data.liked ? 1 : -1)
          };
        }
        return disc;
      }));

      // 顯示成功提示
      discussionToast.success(data.liked ? "點讚成功" : "已取消點讚");

    } catch (error) {
      console.error('點讚失敗:', error);
      discussionToast.error("點讚失敗，請稍後再試");
    }
  };

  // 處理分享
  const handleShare = async (discussion) => {
    try {
      await navigator.share({
        title: "營地評論分享",
        text: `${discussion.content} - ${discussion.user_name}的評論`,
        url: window.location.href,
      });
    } catch (error) {
      // 如果瀏覽器不支援分享API，則複製連結
      navigator.clipboard.writeText(window.location.href);
      await showDiscussionAlert.shareSuccess();
    }
  };

  // 排序邏輯
  const getSortedDiscussions = (discussions, sortBy) => {
    const sortedDiscussions = [...discussions];
    
    switch (sortBy) {
      case 'newest':
        return sortedDiscussions.sort((a, b) => 
          new Date(b.created_at) - new Date(a.created_at)
        );
      
      case 'highest':
        return sortedDiscussions.sort((a, b) => 
          b.rating - a.rating || // 先按評分排序
          new Date(b.created_at) - new Date(a.created_at) // 評分相同時按時間排序
        );
      
      case 'lowest':
        return sortedDiscussions.sort((a, b) => 
          a.rating - b.rating ||
          new Date(b.created_at) - new Date(a.created_at)
        );
        
      default:
        return sortedDiscussions;
    }
  };

  // 初始加載評論
  useEffect(() => {
    fetchDiscussions();
  }, [activityId]);

  // 找出用戶的評論
  const userDiscussion = useMemo(() => {
    if (!session || !discussions.length) return null;

    // 根據不同登入類型獲取正確的用戶ID
    const currentUserId = session.user?.id?.toString();
    const currentLineUserId = session.user?.line_user_id;

    return discussions.find(discussion => 
      // 檢查一般/Google登入的ID
      discussion.user_id?.toString() === currentUserId ||
      // 檢查 LINE 登入的ID
      discussion.user_id?.toString() === currentLineUserId
    );
  }, [session, discussions]);

  // 檢查是否是用戶自己的評論
  const isOwnDiscussion = (discussion) => {
    if (!session || !session.user) return false;

    const currentUserId = session.user.id?.toString();
    const currentLineUserId = session.user.line_user_id;
    const discussionUserId = discussion.user_id?.toString();

    return discussionUserId === currentUserId || 
           discussionUserId === currentLineUserId;
  };

  // 取得要顯示的評論
  const getDisplayedDiscussions = () => {
    const sortedDiscussions = [...otherDiscussions].sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at) - new Date(a.created_at);
      } else if (sortBy === 'highest') {
        return b.rating - a.rating;
      } else {
        return a.rating - b.rating;
      }
    });

    return isExpanded 
      ? sortedDiscussions 
      : sortedDiscussions.slice(0, INITIAL_DISPLAY_COUNT);
  };

  // 獲取特定討論的回覆列表
  const fetchReplies = async (discussionId) => {
    try {
      // console.log("正在獲取討論回覆:", discussionId); // 添加日誌

      const res = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies`
      );
      const data = await res.json();

      if (!res.ok) {
        console.error("API 錯誤:", data.error, data.details); // 添加詳細錯誤信息
        throw new Error(data.error);
      }

      setReplies((prev) => ({
        ...prev,
        [discussionId]: data.replies,
      }));
    } catch (error) {
      console.error("獲取回覆失敗:", error);
      discussionToast.error("無法載入回覆，請稍後再試");
    }
  };

  // 處理回覆按鈕點擊
  const handleReplyClick = (discussionId) => {
    if (!session) {
      showDiscussionAlert.warning("請先登入後再回覆");
      return;
    }
    setShowReplyForm(showReplyForm === discussionId ? null : discussionId);
    setReplyContent('');
  };

  // 修改回覆提交函數，實現即時更新
  const handleReplySubmit = async (discussionId) => {
    if (!session) {
      showDiscussionAlert.warning("請先登入後再回覆");
      return;
    }

    if (!replyContent.trim()) {
      discussionToast.warning("請輸入回覆內容");
      return;
    }

    try {
      setIsSubmittingReply(true);
      const response = await fetch(
        `/api/camping/activities/${activityId}/discussions/${discussionId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: replyContent.trim()
          })
        }
      );

      if (!response.ok) {
        throw new Error('回覆發送失敗');
      }

      const { reply } = await response.json();

      // 只更新特定討論的回覆列表
      setDiscussions(prevDiscussions => 
        prevDiscussions.map(discussion => {
          if (discussion.id === discussionId) {
            return {
              ...discussion,
              replies: [...(discussion.replies || []), {
                id: reply.id,
                content: replyContent.trim(),
                user_name: session.userName || session.user.name,
                user_image: session.user.image,
                created_at: new Date().toISOString(),
                user_id: session.user.id
              }]
            };
          }
          return discussion;
        })
      );

      // 清空回覆內容並關閉回覆表單
      setReplyContent('');
      setShowReplyForm(null);
      
      discussionToast.success('回覆發送成功');
    } catch (error) {
      console.error('回覆發送失敗:', error);
      discussionToast.error('回覆發送失敗，請稍後再試');
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // 在 useEffect 中加載回覆
  useEffect(() => {
    if (discussions.length > 0) {
      discussions.forEach((discussion) => {
        fetchReplies(discussion.id);
      });
    }
  }, [discussions]);

  // 在 useEffect 中獲取用戶已點讚的評論
  useEffect(() => {
    const fetchLikedDiscussions = async () => {
      if (session?.user?.id) {
        try {
          // 修正 API 路徑
          const response = await fetch('/api/camping/activities/discussions/likes');
          if (response.ok) {
            const data = await response.json();
            setLikedDiscussions(new Set(data.likedDiscussionIds));
          }
        } catch (error) {
          console.error('獲取點讚記錄失敗:', error);
        }
      }
    };

    fetchLikedDiscussions();
  }, [session]);

  // 用於調試的 useEffect
  // useEffect(() => {
  //   if (session && session.user) {
  //     console.log('用戶登入資訊:', {
  //       id: session.user.id,
  //       name: session.user.name,
  //       loginType: session.user.loginType,
  //       fullSession: session
  //     });
  //   }
  // }, [session]);

  // 過濾其他人的評論（排除自己的評論）
  const otherDiscussions = useMemo(() => {
    if (!session || !discussions.length) return discussions;
    
    // 根據不同登入類型獲取正確的用戶ID
    const currentUserId = session.user?.id?.toString();
    const currentLineUserId = session.user?.line_user_id;

    return discussions.filter(discussion => 
      discussion.user_id?.toString() !== currentUserId && 
      discussion.user_id?.toString() !== currentLineUserId
    );
  }, [session, discussions]);

  // 在 averageRating 附近添加星級統計函數
  const getRatingStats = () => {
    const stats = {
      5: 0, 4: 0, 3: 0, 2: 0, 1: 0
    };
    
    discussions.forEach(discussion => {
      stats[discussion.rating]++;
    });
    
    return stats;
  };

  // 在評論列表區域添加載入效果
  if (isInitialLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <motion.div
              className="h-8 w-8"
              animate={{
                rotate: 360
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear"
              }}
            >
              <svg
                className="text-[#8B7355]"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 4.75V6.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.5"
                />
                <path
                  d="M17.1266 6.87347L16.0659 7.93413"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.6"
                />
                <path
                  d="M19.25 12L17.75 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.7"
                />
                <path
                  d="M17.1266 17.1265L16.0659 16.0659"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.8"
                />
                <path
                  d="M12 17.75V19.25"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity="0.9"
                />
                <path
                  d="M7.9342 16.0659L6.87354 17.1265"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6.25 12L4.75 12"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7.9342 7.93413L6.87354 6.87347"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </motion.div>
            <span className="text-[#8B7355] font-medium">評論載入中...</span>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((index) => (
              <motion.div
                key={index}
                className="h-24 bg-[#F0EBE8] rounded-lg"
                initial={{ opacity: 0.3 }}
                animate={{ opacity: 0.7 }}
                transition={{
                  duration: 0.8,
                  repeat: Infinity,
                  repeatType: "reverse",
                  delay: index * 0.2
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-6">
      {/* 標題區塊 */}
      <motion.div
        className="flex flex-col sm:flex-row items-center md:items-start sm:items-center gap-2 pb-3 border-b border-gray-100"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <div className="flex items-center gap-2">
          <motion.svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 text-[#8B7355]"
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
            animate={{
              scale: [1, 1.1, 1],
              y: [-1, 1, -1],
              rotate: [-3, 3, -3]
            }}
            transition={{
              duration: 3,
              ease: "easeInOut",
              repeat: Infinity,
            }}
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.9021 3.5901 15.6665 4.59721 17.1199C4.70168 17.2707 4.7226 17.4653 4.64529 17.6317L3.42747 20.2519C3.23699 20.5853 3.47768 21 3.86159 21H12Z"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M8 12H16M8 8H13M8 16H11"
            />
          </motion.svg>
          <h2 className="text-[16px] md:text-xl font-bold text-[#8B7355] m-0">
            評論區
          </h2>
        </div>
      </motion.div>

      {/* 評論狀態提示 - 只在未登入且有評論時顯示 */}
      {!session && userDiscussion && (
        <div className="bg-[#F9F6F3] rounded-lg p-4 mb-4 flex items-center gap-3">
          <div className="bg-[#E8E4DE] rounded-full p-2">
            <svg className="w-4 h-4 text-[#8B7355]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm text-[#8B7355]">您已發表過評論</p>
            <p className="text-xs text-[#9F9189]  mb-0">
              發表於 {formatDate(userDiscussion.created_at)}
            </p>
          </div>
        </div>
      )}

      {/* 我的評論區塊 - 只在登入且有評論時顯示 */}
      {session && userDiscussion && (
        <div className="mb-4">
          <div className="bg-[#E8E4DE]/30 px-3 sm:px-4 py-2 rounded-lg mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-[#8B7355]">我的評論</span>
              <span className="text-xs text-[#9F9189]">
                • 您已於 {formatDate(userDiscussion.created_at)} 發表評論
              </span>
            </div>
          </div>
          {/* 評論卡片 */}
          <div className="bg-white rounded-lg p-3 sm:p-4 border border-[#F0EBE8]">
            <div className="flex justify-between items-start mb-2 sm:mb-3">
              {/* 使用者資訊 */}
              <div className="flex items-start gap-2 sm:gap-3">
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-[#8B7355]">
                    {userDiscussion?.user_name}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                    <StarRating 
                      value={userDiscussion?.rating} 
                      readOnly 
                      size="small"
                    />
                    <span className="text-xs sm:text-sm text-[#9F9189]">
                      {formatDate(userDiscussion?.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 編輯選項 */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(userDiscussion)}
                  className="p-1.5 text-[#8B7355] hover:bg-[#F0EBE8] rounded-full transition-colors"
                >
                  <FaEdit className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
                <button
                  onClick={() => handleDelete(userDiscussion.id)}
                  className="p-1.5 text-red-500 hover:bg-[#F0EBE8] rounded-full transition-colors"
                >
                  <FaTrash className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {/* 評論內容 */}
            <p className="text-xs sm:text-sm text-[#4A4A4A] mb-2 sm:mb-3">
              {userDiscussion?.content}
            </p>

            {/* 互動按鈕 */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleLike(userDiscussion.id)}
                className={`flex items-center gap-1.5 text-xs sm:text-sm
                  ${likedDiscussions.has(userDiscussion.id) 
                    ? 'text-[#8B7355]' 
                    : 'text-[#9F9189] hover:text-[#8B7355]'
                  } transition-colors`}
              >
                {likedDiscussions.has(userDiscussion.id) ? (
                  <FaHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                ) : (
                  <FaRegHeart className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                )}
                {userDiscussion?.likes_count || 0}
              </button>

              <button
                onClick={() => handleReplyClick(userDiscussion.id)}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#9F9189] hover:text-[#8B7355] transition-colors"
              >
                <FaReply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                回覆 ({userDiscussion?.replies_count || 0})
              </button>

              <button
                onClick={() => handleShare(userDiscussion)}
                className="flex items-center gap-1.5 text-xs sm:text-sm text-[#9F9189] hover:text-[#8B7355] transition-colors"
              >
                <FaShare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                分享
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 評分統計區塊 */}
      <div className="bg-white rounded-lg p-4 md:p-6 mb-0">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 左側平均分數 */}
          <div className="flex md:flex-col items-center justify-center gap-2 md:gap-1.5">
            <div className="flex flex-col items-center">
              <div className="text-4xl md:text-5xl font-bold text-[#8B7355]">
                {averageRating.toFixed(1)}
              </div>
              <div className="text-sm text-[#9F9189] mt-1">
                平均評分
              </div>
            </div>
            <div className="flex flex-col items-center">
              <StarRating 
                value={Math.round(averageRating)} 
                readOnly 
                size="large"
                className="scale-90 md:scale-100"
              />
              <div className="text-sm text-[#9F9189] mt-1">
                {discussions.length} 則評論
              </div>
            </div>
          </div>

          {/* 右側評分分布 */}
          <div className="flex-1 flex flex-col justify-center space-y-2.5">
            {[5, 4, 3, 2, 1].map(rating => {
              const count = getRatingStats()[rating];
              const percentage = (count / discussions.length) * 100 || 0;
              
              return (
                <div key={rating} className="flex items-center gap-3">
                  {/* 星級 */}
                  <div className="w-8 text-sm font-medium text-[#8B7355]">
                    {rating}星
                  </div>
                  
                  {/* 進度條 */}
                  <div className="relative flex-1 h-3 bg-[#F0EBE8] rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="absolute h-full bg-[#8B7355] rounded-full"
                    />
                  </div>
                  
                  {/* 數據 */}
                  <div className="w-10 text-sm text-[#9F9189]">
                    {count}則
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 引導提示 */}
      {!session ? (
        <div className="text-sm text-[#9F9189] bg-[#FAF9F8] p-3 rounded-lg">
          ✨ <span className="text-[#B6AD9A]">登入</span>後即可分享您的露營體驗，幫助更多露友做選擇！
        </div>
      ) : discussions.length === 0 ? (
        <div className="text-sm text-[#9F9189] bg-[#FAF9F8] p-3 rounded-lg">
          🏕️ 還沒有評論，成為第一位分享體驗的露友吧！
        </div>
      ) : null}

      {/* 評分和評論輸入區 */}
      {session ? (
        userDiscussion && !editingDiscussionId ? (
          // 已經評論過的提示 (當不在編輯模式時顯示)
          <div className="bg-[#FDFCFB] px-4  py-2rounded-lg border border-[#E8E4DE] rounded-lg">
            <div className="flex items-center gap-3 text-[#9F9189]">
              <div className="w-10 h-10 rounded-full bg-[#F0EBE8] flex items-center justify-center">
                <span className="text-lg">✓</span>
              </div>
              <div className="flex flex-col justify-center items-start py-2">
                <p className="text-sm  font-medium text-[#5D564D] mb-0">您已發表過評論</p>
                <p className="text-xs mb-0">
                  發表於 {formatDate(userDiscussion.created_at)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          // 評論輸入區 (用於新評論或編輯模式)
          <div className="bg-white p-6 rounded-lg border border-[#F0EBE8] space-y-4">
            {/* 編輯模式提示 */}
            {editingDiscussionId && (
              <div className="bg-[#FAF9F8] p-4 rounded-lg mb-4 border border-[#E8E4DE]">
                <div className="flex items-center gap-2 mb-3">
                  <span className="bg-[#B6AD9A] text-white px-2 py-1 rounded-lg text-sm">編輯模式</span>
                  <span className="text-[#9F9189]">✍️ 您正在編輯評論</span>
                </div>
                

                <ul className="text-sm text-[#8B7E7E] space-y-2 list-disc list-inside mb-0">
                  <li>您可以修改評分和評論內容</li>
                  <li>完成編輯後點擊「更新評論」</li>
                  <li>若要放棄修改，請點擊「取消編輯」</li>
                </ul>

                <div className="flex justify-end">
                  <button
                    onClick={handleCancelEdit}
                    className="text-[#9F9189] hover:text-[#8B7E7E] no-underline"
                  >
                    ← 取消編輯並返回
                  </button>
                </div>
              </div>
            )}
            
            {/* 字數提示 */}
            <div className="flex justify-between items-center text-sm text-[#9F9189] mb-2">
              <span>
                {editingDiscussionId ? '正在編輯您的評論' : '撰寫新評論'}
              </span>
              <span>
                {content.length}/50 字
              </span>
            </div>

            {/* 評分區域 */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-[#8B7E7E]">評分</span>
                <div className="scale-90 sm:scale-100">
                  <StarRating 
                    value={rating}
                    onChange={setRating}
                    readOnly={false}
                  />
                </div>
              </div>
              
              {rating > 0 && (
                <span className="text-xs sm:text-sm text-[#9F9189]  sm:ml-0">
                  {rating === 5 && "太棒了！"}
                  {rating === 4 && "很好！"}
                  {rating === 3 && "還不錯"}
                  {rating === 2 && "有待改進"}
                  {rating === 1 && "需要加油"}
                </span>
              )}
            </div>

            {/* 評論輸入區 */}
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={() => setShowHint(true)}
                onBlur={() => setShowHint(false)}
                className="w-full 
                  px-2 sm:px-3 
                  py-1.5 sm:py-2 
                  text-xs sm:text-sm
                  border border-[#F0EBE8] 
                  rounded-lg 
                  bg-white 
                  placeholder-[#BFB8B8]
                  outline-none
                  focus:border-[#B6AD9A]
                  hover:border-[#D3CDC6]
                  transition-all duration-200
                  resize-none"
                placeholder="分享您的體驗..."
                rows={window.innerWidth < 640 ? "3" : "4"}
              />
              {content.length > 0 && (
                <div className="absolute 
                  bottom-1 sm:bottom-2 
                  right-1 sm:right-2 
                  text-xs sm:text-sm 
                  text-[#9F9189]"
                >
                  {content.length}/50
                </div>
              )}
            </div>

            {/* 發布按鈕 */}
            <div className="flex justify-end">
              <button
                onClick={handleSubmit}
                disabled={isLoading || content.length === 0}
                className={`px-4 py-1.5 sm:px-6 md:py-2 rounded-lg text-white text-xs sm:text-sm 
                  transition-all duration-200 flex items-center gap-2
                  ${content.length === 0 
                    ? 'bg-[#D3CDC6] cursor-not-allowed'
                    : 'bg-[#9F9189] hover:bg-[#8B7E7E] hover:shadow-md'
                  }`}
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"/>
                    {editingDiscussionId ? '更新中...' : '發布中...'}
                  </>
                ) : (
                  <>
                    {editingDiscussionId ? (
                      <>
                        <FaEdit className="w-4 h-4" />
                        更新評論
                      </>
                    ) : (
                      '發布評論'
                    )}
                  </>
                )}
              </button>
            </div>
          </div>
        )
      ) : (
        // 未登入提示
        <div className="bg-[#FDFCFB] p-6 rounded-lg border border-[#E8E4DE] text-center">
          <p className="text-[#9F9189] mb-3">登入後即可發表評論</p>
          <button 
            onClick={() => signIn()}
            className="px-6 py-2 bg-[#9F9189] text-white rounded-lg
              hover:bg-[#8B7E7E] transition-colors duration-200"
          >
            立即登入
          </button>
        </div>
      )}

      {/* 評論列表區域 */}
      <div className="mt-6 space-y-6">
        {/* 其他評論區塊 */}
        <div className="bg-[#FDFCFB] p-3 sm:p-4 rounded-lg border border-[#E8E4DE]">
          {/* 標題與排序 */}
          <div className="mb-3 sm:mb-4">
            <div className="text-xs sm:text-sm text-[#9F9189] mb-3">
              {otherDiscussions.length > 0 
                ? `其他 ${otherDiscussions.length} 則評論` 
                : '尚無其他評論'}
            </div>

            {/* 排序標籤 */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSortBy('newest')}
                className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all
                  ${sortBy === 'newest' 
                    ? 'bg-[#8B7355] text-white' 
                    : 'bg-[#F0EBE8] text-[#8B7E7E] hover:bg-[#E8E4DE]'
                  }`}
              >
                最新評論
              </button>
              <button
                onClick={() => setSortBy('highest')}
                className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all
                  ${sortBy === 'highest' 
                    ? 'bg-[#8B7355] text-white' 
                    : 'bg-[#F0EBE8] text-[#8B7E7E] hover:bg-[#E8E4DE]'
                  }`}
              >
                最高評分
              </button>
              <button
                onClick={() => setSortBy('lowest')}
                className={`px-2.5 sm:px-4 py-1 sm:py-2 rounded-full text-xs sm:text-sm whitespace-nowrap transition-all
                  ${sortBy === 'lowest' 
                    ? 'bg-[#8B7355] text-white' 
                    : 'bg-[#F0EBE8] text-[#8B7E7E] hover:bg-[#E8E4DE]'
                  }`}
              >
                最低評分
              </button>
            </div>
          </div>
          
          {/* 評論列表 */}
          <div className="space-y-3 sm:space-y-4">
            {getDisplayedDiscussions().map(discussion => (
              <div 
                key={discussion.id} 
                className="bg-white rounded-lg p-3 sm:p-4 shadow-sm border border-[#F0EBE8]"
              >
                {/* 評論卡片內容 */}
                <div className="flex justify-between items-start mb-2 sm:mb-3">
                  <div className="flex items-start gap-2">
                    <div>
                      <h3 className="text-sm sm:text-base font-medium text-[#8B7355]">
                        {discussion.user_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                        <StarRating 
                          value={discussion.rating} 
                          readOnly 
                          size="small"
                        />
                        <span className="text-xs sm:text-sm text-[#9F9189]">
                          {formatDate(discussion.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-xs sm:text-sm text-[#4A4A4A] mb-2 sm:mb-3">
                  {discussion.content}
                </p>

                {/* 互動按鈕 */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleLike(discussion.id)}
                    className={`flex items-center gap-1.5 text-xs sm:text-sm
                      ${likedDiscussions.has(discussion.id) 
                        ? 'text-[#8B7355]' 
                        : 'text-[#9F9189] hover:text-[#8B7355]'
                      } transition-colors`}
                  >
                    <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill={likedDiscussions.has(discussion.id) ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    {discussion.likes_count || 0}
                  </button>

                  <button
                    onClick={() => handleReplyClick(discussion.id)}
                    className="flex items-center gap-1.5 text-xs sm:text-sm text-[#9F9189] hover:text-[#8B7355] transition-colors"
                  >
                    <FaReply className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    回覆 ({discussion.replies_count || 0})
                  </button>
                </div>

                {/* 回覆表單 */}
                {showReplyForm === discussion.id && (
                  <div className="mt-3 space-y-2">
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="輸入回覆..."
                      className="w-full p-2 border border-gray-200 rounded-lg resize-none focus:outline-none focus:border-[#5C8D5C]"
                      rows="3"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setShowReplyForm(null);
                          setReplyContent('');
                        }}
                        className="px-3 py-1 text-sm text-gray-500 hover:text-gray-700"
                      >
                        取消
                      </button>
                      <button
                        onClick={() => handleReplySubmit(discussion.id)}
                        disabled={isSubmittingReply || !replyContent.trim()}
                        className={`px-4 py-1 rounded-lg text-white text-sm transition-colors
                          ${isSubmittingReply || !replyContent.trim()
                            ? 'bg-gray-400 cursor-not-allowed'
                            : 'bg-[#5C8D5C] hover:bg-[#4F7B4F]'
                          }`}
                      >
                        {isSubmittingReply ? '發送中...' : '發送'}
                      </button>
                    </div>
                  </div>
                )}

                {/* 顯示回覆列表 */}
                {discussion.replies?.length > 0 && (
                  <div className="mt-3 pl-4 space-y-2 border-l-2 border-gray-100">
                    {discussion.replies.map((reply) => (
                      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-sm font-medium">{reply.user_name}</div>
                        <div className="text-sm mt-1">{reply.content}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(reply.created_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* 查看更多按鈕 */}
          {otherDiscussions.length > INITIAL_DISPLAY_COUNT && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full mt-4 py-2 px-4 text-sm text-[#8B7355] hover:text-[#6B5744] 
                         bg-[#F0EBE8] hover:bg-[#E8E4DE] rounded-lg transition-colors
                         flex items-center justify-center gap-1"
            >
              {isExpanded ? (
                <>
                  收合評論
                  <FaChevronUp className="w-3 h-3" />
                </>
              ) : (
                <>
                  查看更多評論 ({otherDiscussions.length - INITIAL_DISPLAY_COUNT})
                  <FaChevronDown className="w-3 h-3" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
