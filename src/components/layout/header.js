"use client";

import "@/styles/shared/header.css";
import Image from "next/image";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import SearchBar from "@/components/header/search";
import SearchList from "@/components/header/searchList";
import { CartSidebar } from "@/components/camping/cart/CartSidebar";
import { ProductCartSidebar } from "@/components/product-cart/ProductCartSidebar"; // 商品購物車側邊欄
import { ProductFavSidebar } from "@/components/products/ProductFavSideBar"; //商品fav
import { FavoritesSidebar } from "@/components/camping/favorites/FavoritesSidebar";
// import { FaHeart } from "react-icons/fa";
// import { FavoritesIcon } from "@/components/camping/favorites/FavoritesIcon";
import { useProductCart } from "@/hooks/useProductCart";
import { FiMenu } from "react-icons/fi"; // 選單icon
import { IoClose } from "react-icons/io5"; // 關閉icon
// 通知組件
import NotificationBell from "@/components/common/NotificationBell";
import {
  ShoppingCart,
  ShoppingBag,
  Tent,
  Heart,
  Package,
  User,
  CircleUserRound,
  MapPin,
  Menu,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";

export default function Header() {
  // 使用者登入狀態管理
  const { data: session } = useSession();

  // 購物車和收藏清單的狀態管理
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCampingCartOpen, setIsCampingCartOpen] = useState(false);
  const [campingCartCount, setCampingCartCount] = useState(0);

  // 商品購物車
  const {
    productCartCount,
    fetchCart,
    isProductCartOpen,
    setIsProductCartOpen,
  } = useProductCart(); //從鉤子內抓取商品購物車數量狀態以及fetch函式用以抓取數量以及控制是否開啟的狀態用來往下傳
  const [isProductFavOpen, setIsProductFavOpen] = useState(false); //商品側欄開關
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false); //收藏清單開關
  const [isCampingFavorites, setIsCampingFavorites] = useState(false); //營區收藏清單開關
  const [productFavCount, setProductFavCount] = useState(0); // 新增商品收藏數量狀態
  const [campingFavCount, setCampingFavCount] = useState(0); // 新增營區收藏數量狀態

  // 手機版選單開關
  const [openMenu, setOpenMenu] = useState(false); // mean手機板開起 狀態

  // 延遲消失時間
  const [dropdownTimer, setDropdownTimer] = useState(null);

  // 手機版選單開關
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 手機版購物車和收藏清單開關
  const [isMobileCartDropdownOpen, setIsMobileCartDropdownOpen] = useState(false);
  const [isMobileFavDropdownOpen, setIsMobileFavDropdownOpen] = useState(false);

  // 手機版選單開關
  const toggleMeau = () => {
    setOpenMenu(!openMenu);
  };

  // const closeMenuClick = () => {
  //   setCloseMenu(!closeMenu);
  // };

  // 獲取購物車數量的API請求
  const fetchCartCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/camping/cart");
        const data = await response.json();
        setCampingCartCount(data.cartItems?.length || 0);
      }
    } catch (error) {
      console.error("獲取購物車數量失敗:", error);
      setCampingCartCount(0);
    }
  };

  // 優化獲取商品收藏數量
  const fetchProductFavCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/products/productFav");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();

        if (data.success) {
          setProductFavCount(data.wishlist?.length || 0);
        }
      }
    } catch (error) {
      console.error("獲取商品收藏數量失敗:", error);
      setProductFavCount(0);
    }
  };

  // 優化獲取營區收藏數量
  const fetchCampingFavCount = async () => {
    try {
      if (session?.user?.id) {
        const response = await fetch("/api/camping/favorites", {
          headers: {
            "Cache-Control": "no-cache", // 避免快取
          },
        });
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setCampingFavCount(data.favorites?.length || 0);
      }
    } catch (error) {
      console.error("獲取營區收藏數量失敗:", error);
    }
  };

  //搜尋功能
  // 添加狀態來管理搜尋框的值
  const [selectedValue, setSelectedValue] = useState("1"); // 初始值设为 "1"
  const [searchText, setSearchText] = useState("");
  const [searchQuery, setSearchQuery] = useState([]);
  const [allProducts, setAllProducts] = useState([]); // 存儲所有產品
  const inputRef = useRef(null); // 參考搜尋框
  const searchListRef = useRef(null); // 參考搜尋建議列表

  //   useEffect(() => {
  //     fetchSearch(selectedValue); // 组件加载时 fetch 初始数据
  //     setSearchQuery([]); // 清空搜索结果
  // }, [selectedValue]);  // 监听 selectedValue

  const handleSelectChange = (e) => {
    // const value = e.target.value;
    // console.log(value);
    setSelectedValue(e); // 更新選擇的值
    console.log("value:", e.value);
    fetchSearch(e);
    // console.log('45454564')
    // if (e === "1") {

    //   console.log('1111')
    // }else if (e === "2") {
    //   console.log('2222')
    //   console.log(e.target.value)
    // }else if (e === "3") {
    //   console.log('3333')
    // }
  };

  // useEffect(() => {
  //   handleFocus(selectedValue); // 组件加载时 fetch 初始数据
  // },[])

  const handleFocus = (selectedValue) => {
    console.log("selectedValue:", selectedValue); // 打印当前选中的值
    fetchSearch(selectedValue); // 根据选中的值获取数据
  };

  const fetchSearch = async (e) => {
    //監聽select 的值，根據值去fetch不同的api
    // console.log("fetchSearch 传入的值:", e);

    console.log("fetchSearch 传入的值:", e);
    // 只允许 "1"（产品） 和 "2"（文章），否则默认用 "1" 查询产品
    if (e === "1") {
      try {
        const response = await fetch("/api/search/product");
        const data = await response.json();
        setSearchQuery(data);
        setAllProducts(data); // 初始化完整商品数据
        console.log("搜索结果:", data);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
      return;
    } else if (e === "2") {
      try {
        const response = await fetch("/api/search/forum");
        const data = await response.json();
        setSearchQuery(data);
        setAllProducts(data); // 初始化完整商品数据
        console.log("搜索结果:", data);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
      console.log("22222");
      return;
    } else if (e === "3") {
      try {
        const response = await fetch("/api/search/camping");
        const data = await response.json();
        setSearchQuery(data);
        setAllProducts(data); // 初始化完整商品数据
        console.log("搜索结果:", data);
      } catch (error) {
        console.error("获取搜索结果失败:", error);
      }
      console.log("22222");
      return;
    }
  };

  const handleSearch = (query) => {
    setSearchText(query); // ✅ 更新 searchText 狀態
    if (query === "") {
      setSearchQuery([]); // ✅ 确保搜索框为空时，清空搜索结果
      return;
    }
    let searchList = [];
    if (selectedValue === "1") {
      searchList = allProducts.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase())
      );
    } else if (selectedValue === "2") {
      searchList = allProducts.filter((product) =>
        product.thread_title.toLowerCase().includes(query.toLowerCase())
      );
    } else if (selectedValue === "3") {
      searchList = allProducts.filter((product) =>
        product.title.toLowerCase().includes(query.toLowerCase())
      );
    }
    setSearchQuery(searchList);
  };

  // 點擊事件處理，點擊空白處時清空輸入框並隱藏搜尋列表
  const handleClickOutside = (e) => {
    if (
      inputRef.current?.contains(e.target) || // 搜索框
      e.target.closest(".swiper-button-disabled.swiper-button-prev") || // Swiper 上一页按钮
      e.target.closest(".swiper-button-prev") || // Swiper 上一页按钮
      e.target.closest(".swiper-button-next")
    ) {
      // Swiper 下一页按钮
      return; // 如果點擊的是搜尋框或搜尋列表，則不執行任何操作
    }
    setSearchQuery([]);
    setSearchText(""); // ✅ 清空輸入框內容
  };

  // 添加和清理點擊事件監聽
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [searchQuery]);

  // 添加和清理點擊事件監聽
  useEffect(() => {
    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [searchQuery]);

  // 處理營區購物車點擊事件
  const handleCampingCartClick = () => {
    setIsCartOpen(true);
    setIsCampingCartOpen(true);
  };

  // 處理商品購物車點擊事件
  const handleProductCartClick = (e) => {
    e.preventDefault(); // 阻止 <a> 預設行為
    setIsCartOpen(false); // 確保不影響老大的購物車
    setIsCampingCartOpen(false); // 避免誤開營區購物車
    setIsProductCartOpen(true); // 確保 **只開啟商品購物車**
  };

  // 處理收藏清單點擊事件
  const handleProductFavoritesClick = () => {
    setIsFavoritesOpen(false);
    setIsCampingFavorites(false);
    setIsProductFavOpen(true);
  };

  const handleCampingFavoritesClick = () => {
    setIsFavoritesOpen(true);
    setIsCampingFavorites(true);
    setIsProductFavOpen(false);
  };

  useEffect(() => {
    if (session?.user) {
      fetchCartCount(); // 營區購物車數量
      fetchCart(); //偷放一個商品購物車fetch
      fetchProductFavCount(); // 商品收藏數量
      fetchCampingFavCount(); // 營區收藏數量
    }

    const handleCartUpdate = () => {
      fetchCartCount();
      fetchCart();
    };

    const handleFavUpdate = () => {
      fetchProductFavCount();
      fetchCampingFavCount();
    };

    const handleProductFavUpdate = async () => {
      await fetchProductFavCount();
    };

    window.addEventListener("cartUpdate", handleCartUpdate);
    window.addEventListener("favoritesUpdate", handleFavUpdate);
    window.addEventListener("productFavUpdate", handleProductFavUpdate);
    window.addEventListener("campingFavUpdate", handleFavUpdate);

    return () => {
      window.removeEventListener("cartUpdate", handleCartUpdate);
      window.removeEventListener("favoritesUpdate", handleFavUpdate);
      window.removeEventListener("productFavUpdate", handleProductFavUpdate);
      window.removeEventListener("campingFavUpdate", handleFavUpdate);
    };
  }, [session]);

  const handleMouseEnter = () => {
    if (dropdownTimer) clearTimeout(dropdownTimer);
  };

  const handleMouseLeave = () => {
    const timer = setTimeout(() => {
      // 延長消失時間到 500ms
    }, 500);
    setDropdownTimer(timer);
  };

  return (
    <header
      className="header d-flex justify-content-between align-items-center"
      id="header"
    >
      {/* 左側導航區域 */}
      <article className="left-nav d-flex">
        <div className="logo">
          <Link href="/">
            <Image
              className="header-logo !w-[80px] !h-[55px] md:!w-[130px] md:!h-[90px] lg:!w-[140px] lg:!h-[97px]"
              src="/images/header/logo.png"
              width={154}
              height={106}
              alt="logo"
              priority
            />
          </Link>
        </div>
        <h1 className="d-none">camping</h1>
      </article>

      {/* 右側導航區域 */}
      <article className="right-nav">
        <ul
          className={`d-flex justify-content-between align-items-center mb-0 meau-ul ${
            openMenu ? "active" : ""
          }`}
        >
          {/* 主要導航選項 */}
          <li className="relative group">
            <Link
              href="/camping/activities"
              className="!flex !items-center !gap-2 !relative after:!content-[''] after:!absolute after:!bottom-[-2px] after:!left-0 after:!w-0 hover:after:!w-full after:!h-[2px] after:!bg-[#8B7355] after:!transition-all after:!duration-300"
            >
              <p className="m-0 py-2">找營區</p>
            </Link>

            {/* 下拉選單 - 只在桌機版顯示 */}
            <div
              className="!hidden md:group-hover:!block !absolute !top-full !left-0 !mt-4
                        !min-w-[280px] !bg-white !rounded-xl !shadow-lg !border !border-gray-100/50
                        before:!content-[''] before:!absolute before:!top-[-20px] before:!left-0 
                        before:!w-full before:!h-[20px] before:!bg-transparent"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div className="!p-2">
                {/* 北部營區 */}
                <Link
                  href="/camping/activities?location=新北&sortBy=date_desc&dateRange=%2C"
                  className="!block !w-full !p-2.5 !rounded-lg hover:!bg-[#F8F6F3]"
                >
                  <div className="!flex !items-center !gap-3">
                    <div className="!w-6 !h-6 !flex !items-center !justify-center">
                      <MapPin className="!w-4 !h-4 !text-[#8B7355]" />
                    </div>
                    <div>
                      <div className="!text-sm !text-[#4A3C31]">北部營區</div>
                      <div className="!text-xs !text-[#8B7355] !mt-0.5">
                        新北市、桃園市、新竹縣、宜蘭縣
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 中部營區 */}
                <Link
                  href="/camping/activities?location=苗栗&sortBy=date_desc&dateRange=%2C"
                  className="!block !w-full !p-2.5 !rounded-lg hover:!bg-[#F8F6F3] !mt-1"
                >
                  <div className="!flex !items-center !gap-3">
                    <div className="!w-6 !h-6 !flex !items-center !justify-center">
                      <MapPin className="!w-4 !h-4 !text-[#8B7355]" />
                    </div>
                    <div>
                      <div className="!text-sm !text-[#4A3C31]">中部營區</div>
                      <div className="!text-xs !text-[#8B7355] !mt-0.5">
                        苗栗縣、台中市、南投縣、雲林縣
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 南部營區 */}
                <Link
                  href="/camping/activities?location=嘉義&sortBy=date_desc&dateRange=%2C"
                  className="!block !w-full !p-2.5 !rounded-lg hover:!bg-[#F8F6F3] !mt-1"
                >
                  <div className="!flex !items-center !gap-3">
                    <div className="!w-6 !h-6 !flex !items-center !justify-center">
                      <MapPin className="!w-4 !h-4 !text-[#8B7355]" />
                    </div>
                    <div>
                      <div className="!text-sm !text-[#4A3C31]">南部營區</div>
                      <div className="!text-xs !text-[#8B7355] !mt-0.5">
                        嘉義縣、台南市、高雄市
                      </div>
                    </div>
                  </div>
                </Link>

                {/* 東部營區 */}
                <Link
                  href="/camping/activities?location=花蓮&sortBy=date_desc&dateRange=%2C"
                  className="!block !w-full !p-2.5 !rounded-lg hover:!bg-[#F8F6F3] !mt-1"
                >
                  <div className="!flex !items-center !gap-3">
                    <div className="!w-6 !h-6 !flex !items-center !justify-center">
                      <MapPin className="!w-4 !h-4 !text-[#8B7355]" />
                    </div>
                    <div>
                      <div className="!text-sm !text-[#4A3C31]">東部營區</div>
                      <div className="!text-xs !text-[#8B7355] !mt-0.5">
                        花蓮縣、台東縣
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          </li>
          <li className="item">
            <Link
              onClick={toggleMeau}
              href="/products"
              className="!relative  after:!content-[''] after:!absolute after:!bottom-[-1px] after:!left-0 after:!w-0 hover:after:!w-full after:!h-[2px] after:!bg-[#8B7355] after:!transition-all after:!duration-300"
            >
              <p className="m-0 py-2">商品列表</p>
            </Link>
          </li>
          <li className="item">
            <Link
              onClick={toggleMeau}
              href="/products-lease"
              className="!relative after:!content-[''] after:!absolute after:!bottom-[-1px] after:!left-0 after:!w-0 hover:after:!w-full after:!h-[2px] after:!bg-[#8B7355] after:!transition-all after:!duration-300"
            >
              <p className="m-0 py-2">商品租借</p>
            </Link>
          </li>
          <li className="item">
            <Link
              onClick={toggleMeau}
              href="/forum"
              className="!relative after:!content-[''] after:!absolute after:!bottom-[-1px] after:!left-0 after:!w-0 hover:after:!w-full after:!h-[2px] after:!bg-[#8B7355] after:!transition-all after:!duration-300"
            >
              <p className="m-0 py-2">社群討論區</p>
            </Link>
          </li>
          <li className="item">
            <Link
              onClick={toggleMeau}
              href="/member"
              className="!relative after:!content-[''] after:!absolute after:!bottom-[-1px] after:!left-0 after:!w-0 hover:after:!w-full after:!h-[2px] after:!bg-[#8B7355] after:!transition-all after:!duration-300"
            >
              <p className="m-0 py-2">會員專區</p>
            </Link>
          </li>

          {/* 搜尋欄 */}
          <li className="item search-bar">
            <SearchBar
              // onChange={handleSelectChange}
              value={searchText}
              onSearch={handleSearch}
              onFocus={handleFocus}
              ref={inputRef}
              selectedValue={selectedValue}
              setSelectedValue={handleSelectChange}
            />
          </li>

          {/* 購物車下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle !flex !items-center !relative"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <ShoppingCart
                  className="!w-[22px] !h-[22px] !text-[#4A3C31] !stroke-[1.3]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.div>
              {(productCartCount > 0 || campingCartCount > 0) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="!absolute !-top-1.5 !-right-2 !min-w-[18px] !h-[18px] !px-1 
                            !flex !items-center !justify-center
                            !bg-[#EF4444] !text-white !text-xs !font-medium !rounded-full"
                >
                  {productCartCount + campingCartCount}
                </motion.span>
              )}
            </a>

            <ul
              className="dropdown-menu !min-w-[240px] !p-1.5 
                          !bg-white/90 !backdrop-blur-[2px] !rounded-xl 
                          !shadow-[0_0_15px_rgba(0,0,0,0.05),0_5px_25px_rgba(0,0,0,0.08)] 
                          !border !border-gray-100/30"
            >
              {/* 商品購物車選項 */}
              <li className="me-0">
                <motion.div
                  className="!flex !items-center !gap-3 !p-3 !rounded-lg !cursor-pointer group"
                  onClick={handleProductCartClick}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="!w-9 !h-9 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg
                                group-hover:!bg-[#EAE6E0] !transition-colors !duration-200"
                  >
                    <ShoppingBag
                      className="!w-[19px] !h-[19px] !text-[#8B7355] !stroke-[1.3]
                                 group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="!flex-1 group-hover:!translate-x-1 !transition-transform !duration-200">
                    <div
                      className="!text-sm !font-medium !text-[#4A3C31] group-hover:!text-[#2A1810]
                                  !transition-colors !duration-200"
                    >
                      商品購物車
                    </div>
                    <div className="!text-xs !text-[#8B7355] !mt-0.5">
                      查看已選商品
                    </div>
                  </div>
                  {productCartCount > 0 && (
                    <span
                      className="!w-5 !h-5 !flex !items-center !justify-center 
                                   !bg-[#8B7355] !text-white !text-xs !rounded-full"
                    >
                      {productCartCount}
                    </span>
                  )}
                </motion.div>
              </li>

              {/* 分隔線 */}
              <li className="!my-1 !h-[1px] !bg-[#E5DED5]"></li>

              {/* 營區預約選項 */}
              <li className="me-0">
                <motion.div
                  className="!flex !items-center !gap-3 !p-3 !rounded-lg !cursor-pointer group"
                  onClick={handleCampingCartClick}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="!w-9 !h-9 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg
                                group-hover:!bg-[#EAE6E0] !transition-colors !duration-200"
                  >
                    <Tent
                      className="!w-[19px] !h-[19px] !text-[#8B7355] !stroke-[1.3]
                                 group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="!flex-1 group-hover:!translate-x-1 !transition-transform !duration-200">
                    <div
                      className="!text-sm !font-medium !text-[#4A3C31] group-hover:!text-[#2A1810]
                                  !transition-colors !duration-200"
                    >
                      營區預約
                    </div>
                    <div className="!text-xs !text-[#8B7355] !mt-0.5">
                      查看已選營區
                    </div>
                  </div>
                  {campingCartCount > 0 && (
                    <span
                      className="!w-5 !h-5 !flex !items-center !justify-center 
                                   !bg-[#8B7355] !text-white !text-xs !rounded-full"
                    >
                      {campingCartCount}
                    </span>
                  )}
                </motion.div>
              </li>
            </ul>
          </li>

          {/* 收藏清單下拉選單 */}
          <li className="dropdown-center item mt-1">
            <a
              className="dropdown-toggle !flex !items-center !relative"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              <motion.div
                whileHover={{ scale: 1.1 }}
                transition={{ type: "spring", stiffness: 400 }}
              >
                <Heart
                  className="!w-[22px] !h-[22px] !text-[#4A3C31] !stroke-[1.3]"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.div>
              {(productFavCount > 0 || campingFavCount > 0) && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="!absolute !-top-2 !-right-2 !min-w-[18px] !h-[18px] !px-1 
                            !flex !items-center !justify-center
                            !bg-[#EF4444] !text-white !text-xs !font-medium !rounded-full"
                >
                  {productFavCount + campingFavCount}
                </motion.span>
              )}
            </a>
            <ul
              className="dropdown-menu !min-w-[240px] !p-1.5 
                          !bg-white/90 !backdrop-blur-[2px] !rounded-xl 
                          !shadow-[0_0_15px_rgba(0,0,0,0.05),0_5px_25px_rgba(0,0,0,0.08)] 
                          !border !border-gray-100/30"
            >
              {/* 商品收藏選項 */}
              <li className="me-0">
                <motion.div
                  className="!flex !items-center !gap-3 !p-3 !rounded-lg !cursor-pointer group"
                  onClick={handleProductFavoritesClick}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="!w-9 !h-9 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg
                                group-hover:!bg-[#EAE6E0] !transition-colors !duration-200"
                  >
                    <Package
                      className="!w-[19px] !h-[19px] !text-[#8B7355] !stroke-[1.3]
                                 group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="!flex-1 group-hover:!translate-x-1 !transition-transform !duration-200">
                    <div
                      className="!text-sm !font-medium !text-[#4A3C31] group-hover:!text-[#2A1810]
                                  !transition-colors !duration-200"
                    >
                      商品收藏
                    </div>
                    <div className="!text-xs !text-[#8B7355] !mt-0.5">
                      查看已收藏商品
                    </div>
                  </div>
                  {productFavCount > 0 && (
                    <span
                      className="!w-5 !h-5 !flex !items-center !justify-center 
                                   !bg-[#8B7355] !text-white !text-xs !rounded-full"
                    >
                      {productFavCount}
                    </span>
                  )}
                </motion.div>
              </li>

              <li className="!my-1 !h-[1px] !bg-[#E5DED5]"></li>

              {/* 營區收藏選項 */}
              <li>
                <motion.div
                  className="!flex !items-center !gap-3 !p-3 !rounded-lg !cursor-pointer group"
                  onClick={handleCampingFavoritesClick}
                  whileHover={{ x: 4 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <div
                    className="!w-9 !h-9 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg
                                group-hover:!bg-[#EAE6E0] !transition-colors !duration-200"
                  >
                    <Tent
                      className="!w-[19px] !h-[19px] !text-[#8B7355] !stroke-[1.3]
                                 group-hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                  <div className="!flex-1 group-hover:!translate-x-1 !transition-transform !duration-200">
                    <div
                      className="!text-sm !font-medium !text-[#4A3C31] group-hover:!text-[#2A1810]
                                  !transition-colors !duration-200"
                    >
                      營區收藏
                    </div>
                    <div className="!text-xs !text-[#8B7355] !mt-0.5">
                      查看已收藏營區
                    </div>
                  </div>
                  {campingFavCount > 0 && (
                    <span
                      className="!w-5 !h-5 !flex !items-center !justify-center 
                                   !bg-[#8B7355] !text-white !text-xs !rounded-full"
                    >
                      {campingFavCount}
                    </span>
                  )}
                </motion.div>
              </li>
            </ul>
          </li>

          {/* 會員下拉選單 */}
          <li className="dropdown-center item">
            <a
              className="dropdown-toggle !flex !items-center !gap-2 !py-2 hover:!opacity-70 !transition-all !duration-200"
              data-bs-toggle="dropdown"
              aria-expanded="false"
              href="#"
            >
              {/* 會員icon */}
              <CircleUserRound className="!w-[26px] !h-[26px] !text-[#4A3C31]" />
              {session?.user && (
                <span className="!text-[#4A3C31] !text-base">
                  {session.user.name}
                </span>
              )}
            </a>

            <ul
              className="dropdown-menu !min-w-[280px] !p-0 
                          !bg-white/90 !backdrop-blur-[2px] !rounded-xl 
                          !shadow-[0_0_15px_rgba(0,0,0,0.05),0_5px_25px_rgba(0,0,0,0.08)] 
                          !border !border-gray-100/30"
            >
              {/* 已登入時顯示簡單問候 */}
              {session?.user && (
                <div className="!p-3 !border-b !border-[#E5DED5] hover:!bg-[#F8F6F3] !transition-all !duration-200">
                  <h3 className="!text-[#4A3C31] !text-lg !mb-0 !text-center">
                    個人選單
                  </h3>
                </div>
              )}

              {/* 未登入時顯示提醒文字 */}
              {!session?.user && (
                <div className="!p-6 !text-center">
                  <p className="!text-[#8B7355] !mb-1">尚未登入</p>
                  <p className="!text-sm !text-[#AAA] !mb-0">
                    登入後即可查看個人資料與訂單
                  </p>
                </div>
              )}

              {/* 已登入才顯示功能選項區塊 */}
              {session?.user && (
                <div className="!p-2">
                  <Link
                    href="/member/profile"
                    className="!block !px-3 !py-2.5 !rounded-lg hover:!bg-[#F8F6F3] !transition-colors !duration-200"
                  >
                    <div className="!flex !items-center !gap-3">
                      <div className="!w-8 !h-8 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg">
                        <User className="!w-4 !h-4 !text-[#8B7355]" />
                      </div>
                      <div>
                        <div className="!text-sm !font-medium !text-[#4A3C31]">
                          個人資料
                        </div>
                        <div className="!text-xs !text-[#8B7355]">
                          查看與編輯個人資料
                        </div>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href="/member/purchase-history"
                    className="!block !px-3 !py-2.5 !rounded-lg hover:!bg-[#F8F6F3] !transition-colors !duration-200"
                  >
                    <div className="!flex !items-center !gap-3">
                      <div className="!w-8 !h-8 !flex !items-center !justify-center !bg-[#F8F6F3] !rounded-lg">
                        <ShoppingBag className="!w-4 !h-4 !text-[#8B7355]" />
                      </div>
                      <div>
                        <div className="!text-sm !font-medium !text-[#4A3C31]">
                          訂單查詢
                        </div>
                        <div className="!text-xs !text-[#8B7355]">
                          查看訂單記錄與狀態
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {/* 登入/登出按鈕 */}
              <div className="!p-4 !border-t !border-[#E5DED5]">
                {session?.user ? (
                  <button
                    onClick={() => signOut()}
                    className="!w-full !py-1.5 !px-4 !bg-[#8B7355] hover:!bg-[#6B563D] !text-white !rounded-lg !transition-colors !duration-200"
                  >
                    登出
                  </button>
                ) : (
                  <Link href="/auth/login">
                    <button className="!w-full !py-1.5 !px-4 !bg-[#8B7355] hover:!bg-[#6B563D] !text-white !rounded-lg !transition-colors !duration-200">
                      會員登入
                    </button>
                  </Link>
                )}
              </div>
            </ul>
          </li>
          <li className="item close-meau" onClick={toggleMeau}>
            <IoClose />
          </li>
          {/* 通知 */}
          <li className="flex items-center">
            <NotificationBell />
          </li>
        </ul>
      </article>

      {/* 側邊購物車組件 */}
      <CartSidebar
        isOpen={isCartOpen}
        setIsOpen={setIsCartOpen}
        isCampingCart={isCampingCartOpen}
      />

      {/* 側邊商品購物車組件 */}
      <ProductCartSidebar
        isOpen={isProductCartOpen} // 🛠️ 只由 isProductCartOpen 控制
        setIsOpen={setIsProductCartOpen}
      />

      {/* 側邊收藏清單組件 */}
      <FavoritesSidebar
        isOpen={isFavoritesOpen}
        setIsOpen={setIsFavoritesOpen}
        isCampingFavorites={isCampingFavorites}
      />
      {/* 商品Fav */}
      <ProductFavSidebar
        isOpen={isProductFavOpen}
        setIsOpen={setIsProductFavOpen}
      />

      {/* 右側功能區 */}
      {/* <div className="flex items-center">
        <NotificationBell />
      </div> */}
      {/* 只在 searchQuery 非空时显示 SearchList */}
      {searchQuery?.length > 0 && (
        <SearchList
          searchQuery={searchQuery}
          selectedValue={selectedValue}
          ref={searchListRef}
        />
      )}

      {/* 手機板下拉選單(舊版先註解) */}
      {/* <button className="navMenu" onClick={toggleMeau}>
          <FiMenu />
      </button> */}

      {/* 手機版下拉選單 */}
      <div
        className={`
        fixed inset-0 bg-black/50 backdrop-blur-sm z-50 xl:hidden
        transition-opacity duration-300
        ${isMobileMenuOpen ? "opacity-100" : "opacity-0 pointer-events-none"}
      `}
      >
        <div
          className={`
          absolute right-0 top-0 h-full w-[280px] bg-white shadow-xl
          transform transition-transform duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "translate-x-full"}
        `}
        >
          {/* 選單頂部 */}
          <div className="flex items-center justify-between p-4 border-b border-[#E5DED5]">
            <h3 className="text-[#4A3C31] font-medium">選單</h3>
            <button
              className="p-2 text-[#4A3C31] hover:text-[#8B7355] transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 選單內容 */}
          <div className="p-4 space-y-4">
            <Link 
              href="/camping/activities?location=all&sortBy=date_desc"
              className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              找營區
            </Link>
            <Link 
              href="/products/list"
              className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              商品列表
            </Link>
            <Link 
              href="/products-lease/list"
              className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              商品租借
            </Link>
            <Link 
              href="/forum"
              className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              社群討論區
            </Link>
            <Link 
              href="/member/profile"
              className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              會員專區
            </Link>
          </div>

          {/* 會員相關選項 */}
          <div className="mt-4 p-4 border-t border-[#E5DED5]">
            {session?.user ? (
              <>
                <div className="px-4 py-2 text-[#4A3C31] font-medium">
                  {session.user.name}
                </div>
                <Link
                  href="/member/profile"
                  className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  個人資料
                </Link>
                <Link
                  href="/member/purchase-history"
                  className="block px-4 py-2 text-[#4A3C31] hover:bg-[#F8F6F3] rounded-lg transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  訂單查詢
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full mt-2 px-4 py-2 bg-[#8B7355] text-white rounded-lg hover:bg-[#6B563D] transition-colors"
                >
                  登出
                </button>
              </>
            ) : (
              <Link
                href="/auth/login"
                className="block w-full px-4 py-2 bg-[#8B7355] text-white text-center rounded-lg hover:bg-[#6B563D] transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                會員登入
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 平板/手機版功能按鈕組 */}
      <div className="xl:hidden flex items-center gap-2 mt-2.5">
        {/* 購物車按鈕組 */}
        <div className="relative">
          <button
            className="p-2 text-[#4A3C31] hover:text-[#8B7355] transition-colors relative"
            onClick={() => {
              setIsMobileFavDropdownOpen(false);  // 關閉收藏下拉選單
              setIsMobileCartDropdownOpen(!isMobileCartDropdownOpen);
            }}
          >
            <ShoppingBag className="w-5 h-5" />
            {(productCartCount > 0 || campingCartCount > 0) && (
              <span className="absolute top-[-8px] right-[-4px] w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {productCartCount + campingCartCount}
              </span>
            )}
          </button>

          {/* 購物車下拉選單 */}
          {isMobileCartDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#4A3C31] hover:bg-[#F8F6F3] transition-colors"
                onClick={() => {
                  setIsProductCartOpen(true);
                  setIsMobileCartDropdownOpen(false);
                }}
              >
                <Package className="w-5 h-5 text-[#8B7355]" />
                <div className="flex-1 text-left">
                  <div className="text-sm">商品購物車</div>
                  <div className="text-xs text-[#8B7355]">查看選購商品</div>
                </div>
                {productCartCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#8B7355] text-white text-xs rounded-full">
                    {productCartCount}
                  </span>
                )}
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#4A3C31] hover:bg-[#F8F6F3] transition-colors"
                onClick={() => {
                  handleCampingCartClick();
                  setIsMobileCartDropdownOpen(false);
                }}
              >
                <Tent className="w-5 h-5 text-[#8B7355]" />
                <div className="flex-1 text-left">
                  <div className="text-sm">營區預約</div>
                  <div className="text-xs text-[#8B7355]">查看預約營區</div>
                </div>
                {campingCartCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#8B7355] text-white text-xs rounded-full">
                    {campingCartCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 收藏按鈕組 */}
        <div className="relative">
          <button
            className="p-2 text-[#4A3C31] hover:text-[#8B7355] transition-colors relative"
            onClick={() => {
              setIsMobileCartDropdownOpen(false);  // 關閉購物車下拉選單
              setIsMobileFavDropdownOpen(!isMobileFavDropdownOpen);
            }}
          >
            <Heart className="w-5 h-5" />
            {(productFavCount > 0 || campingFavCount > 0) && (
              <span className="absolute top-[-8px] right-[-8px] w-[18px] h-[18px] bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center">
                {productFavCount + campingFavCount}
              </span>
            )}
          </button>

          {isMobileFavDropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg overflow-hidden z-50">
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#4A3C31] hover:bg-[#F8F6F3] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleProductFavoritesClick();
                  setIsMobileFavDropdownOpen(false);
                }}
              >
                <Package className="w-5 h-5 text-[#8B7355]" />
                <div className="flex-1 text-left">
                  <div className="text-sm">商品收藏</div>
                  <div className="text-xs text-[#8B7355]">查看收藏商品</div>
                </div>
                {productFavCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#8B7355] text-white text-xs rounded-full">
                    {productFavCount}
                  </span>
                )}
              </button>
              <button
                className="w-full flex items-center gap-3 px-4 py-3 text-[#4A3C31] hover:bg-[#F8F6F3] transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  handleCampingFavoritesClick();
                  setIsMobileFavDropdownOpen(false);
                }}
              >
                <Tent className="w-5 h-5 text-[#8B7355]" />
                <div className="flex-1 text-left">
                  <div className="text-sm">營區收藏</div>
                  <div className="text-xs text-[#8B7355]">查看收藏營區</div>
                </div>
                {campingFavCount > 0 && (
                  <span className="w-5 h-5 flex items-center justify-center bg-[#8B7355] text-white text-xs rounded-full">
                    {campingFavCount}
                  </span>
                )}
              </button>
            </div>
          )}
        </div>

        {/* 通知按鈕 */}
        <div className="flex items-center">
          <NotificationBell onClick={() => {
            setIsMobileCartDropdownOpen(false);
            setIsMobileFavDropdownOpen(false);
          }} />
        </div>

        {/* 漢堡選單按鈕 */}
        <button
          className="p-2 text-[#4A3C31] hover:text-[#8B7355] transition-colors"
          onClick={() => {
            setIsMobileCartDropdownOpen(false);
            setIsMobileFavDropdownOpen(false);
            setIsMobileMenuOpen(true);
          }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
