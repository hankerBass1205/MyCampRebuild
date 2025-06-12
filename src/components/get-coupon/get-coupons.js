"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import AOS from "aos";
import "aos/dist/aos.css";
import { showCartAlert } from "@/utils/sweetalert"; // 老大做好的 SweetAlert

export default function GetCoupons() {
  const router = useRouter(); // 路由
  const [coupons, setCoupons] = useState([]);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [ userLevel, setUserLevel] = useState(0);
  const { data: session, status } = useSession();

  if (!session?.user?.id) {
    showCartAlert.confirm("請先登入才能抽優惠卷").then((result) => {
      if (result.isConfirmed) { // 如果點擊確認按鈕
        router.push("/auth/login");
      }else{
        // router.push("/");
      }
    });
    return;
  }
  useEffect(() => {
    // 获取用户等级，假设 session 包含 user.level
    console.log("Session user data:", session.user.level_id);
    if(session.user.level_id){
      setUserLevel(session.user.level_id)
      
    }
  }, [session]);

  // 监听 userLevel 的变化并打印
    useEffect(() => {
      console.log("User level updated:", userLevel); // 这将打印 userLevel 更新后的值
    }, [userLevel]); // 只有 userLevel 发生变化时才会执行

  useEffect(() => {
    AOS.init({
      duration: 700,
      easing: "ease-in-out",
      once: false,
      mirror: true,
    });

    const handleScroll = () => {
      AOS.refresh();
    };
    window.addEventListener("scroll", handleScroll);
    const fetchGetCoupons = async () => {
      try {
        const response = await fetch("/api/get-coupon");
        const data = await response.json();
        // 根据用户等级过滤优惠券
        const filteredCoupons = data.filter(coupon => coupon.level_id === userLevel || coupon.level_id === null); //
        setCoupons(filteredCoupons);
        console.log("Filtered coupons:", filteredCoupons);
      } catch (error) {
        console.error("Failed to fetch coupons:", error);
      }
    };
    if(userLevel){
      fetchGetCoupons();
    }
    console.log("User level:", userLevel); // 打印用户等级
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
    
  }, [userLevel]); // 依赖 userLevel，当等级变化时重新获取优惠券
  
  const addCoupon = async (coupon) => {
   

    const user_id = session.user.id; // 获取用户 ID
    const body = {
      user_id,
      name: coupon.name,
      coupon_code: coupon.coupon_code,
      start_date: coupon.start_date,
      end_date: coupon.end_date,
      discount: coupon.discount_type,
      discount_value: coupon.discount_value,
      min_purchase: coupon.min_purchase,
      max_discount: coupon.max_discount,
    };
    console.log("Sending coupon code:", coupon.coupon_code);
    try {
      const response = await fetch("/api/user-coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const text = await response.text(); // 读取响应文本
      console.log("Response Text:", text); // 打印响应内容
      console.log("Sending coupon code:", coupon.code);

      // 如果响应内容是 JSON 格式，则进行解析
      const data = response.ok ? JSON.parse(text) : { message: text };
      if (response.ok) {
        showCartAlert.success(data.message); // 显示成功提示
      } else {
        showCartAlert.error(data.message); // 显示错误提示
      }
    } catch (error) {
      console.error("Failed to add coupon:", error);
    }
  };

  const handleClick = (id) => {
    setSelectedCoupon((prev) => (prev === id ? null : id));
  };

  const getBackgroundImage = (level) => {
		switch (level) {
			case 1:
				return "url('/images/get-coupon/card.png')";
			case 2:
				return "url('/images/get-coupon/card1.png')";
			case 3:
				return "url('/images/get-coupon/card2.png')";
			case 4:
				return "url('/images/get-coupon/card3.png')";
			case 5:
				return "url('/images/get-coupon/card4.png')";
			default:
				return "url('/images/get-coupon/card.png')";
		}
	};

  return (
		<>
			<section className="get-coupons">
				<div className="container">
					<div className="main">
						<article className="title">
							<h3>優惠卷領取</h3>
						</article>
						<article className="content">
							<article className="content main-coupons">
								<h2 className="coupon-title">優惠卷撲克牌抽抽樂</h2>
								<div
									className="coupon-growp"
									data-aos="fade-down"
									data-aos-easing="linear"
									data-aos-duration={700}
								>
									{coupons.length > 0 ? (
										coupons.map((coupon) => (
											<div
												key={coupon.id}
												id={coupon.id}
												className={`item-coupon ${
													selectedCoupon === coupon.id ? "active" : ""
												}`}
												onClick={() => handleClick(coupon.id)}
												style={{
													pointerEvents:
														selectedCoupon !== null &&
														selectedCoupon !== coupon.id
															? "none"
															: "auto",
												}}
											>
												<div className="front">
													<div className="left">
														<div className="top">
															<p>{coupon.coupon_code}</p>
															<p>
																{coupon.discount_type === "percentage"
																	? `${coupon.discount_value}%`
																	: coupon.discount_type === "fixed"
																	? `NT ${coupon.discount_value}`
																	: coupon.discount_value}
															</p>
															<p>{coupon.description}</p>
															<div className="title">{coupon.name}</div>
															<div className="">
																最低消費:{coupon.min_purchase}
															</div>
														</div>
														<p>
															{coupon.start_date
																.replace("T", " ")
																.replace("Z", "")
																.replace(".000", "")}{" "}
															開始
														</p>
														<p>
															{coupon.end_date
																.replace("T", " ")
																.replace("Z", "")
																.replace(".000", "")}{" "}
															結束
														</p>
													</div>
													<div
														className="right"
														onClick={() => addCoupon(coupon)}
													>
														<p>領取</p>
													</div>
												</div>
												<div
													className="back"
													style={{
														backgroundImage: getBackgroundImage(userLevel),
													}}
												></div>
											</div>
										))
									) : (
										<p>目前沒有可領取的優惠券</p>
									)}
								</div>
							</article>
							<div className="coupon-txt">
								<h3>運費券領取暨使用規則</h3>
								<ol>
									<li>
										本規則所稱運費券(或稱運費抵用券)是指網站所提供予會員抵減、抵扣、減免運費或其他提供運費優惠價格、優惠方案之電子券。
									</li>
									<li>
										會員限於網站下標商品或服務並於填寫結帳單時選用「PChomePay支付連」為付款方式，始能使用運費券進行折抵；當會員領取運費抵用券時即代表會員同意運費券領取暨使用規則(下稱本規則)。
									</li>
									<li>
										每期活動提供不特定數量之運費抵用券予會員，具有領取運費抵用券資格之會員可透過專屬活動頁領取，同一會員可領取運費抵用券張數視當期所提供之張數為準。
									</li>
									<li>
										使用同一手機號碼完成註冊之會員視為同一會員，同一會員僅具有一個運費抵用券領取資格，同一會員使用其所註冊之一個會員帳號領取運費抵用券過後，即不得再使用其他會員帳號領取。
									</li>
									<li>
										會員當期未領取之運費抵用券，則其領取資格於該期結束後自動失效，未領取之張數不得累計至下期。
									</li>
									<li>
										運費抵用券有使用期限，會員應依之指示於使用期限內使用完畢，逾期自動失效，並不得再主張任何權利。
									</li>
									<li>
										運費抵用券之使用名額有限，用完為止。已領取運費抵用券之會員不代表一定能使用運費抵用券抵減運費金額或獲得運費優惠價格，仍須以會員使用運費抵用券之該筆交易結帳時成功使用為準。
									</li>
									<li>
										運費抵用券僅得於所指定或標示之賣場及商品使用，實際可以使用運費抵用券之賣場及商品，以當期所指定或標示之為準。
									</li>
									<li>
										運費抵用券所適用之超商類型、折抵門檻、折抵運費金額或獲得之運費優惠價格等使用限制及條件，依會員使用運費抵用券之該筆交易訂單結帳時系統所顯示之限制及條件為準。
									</li>
									<li>
										會員每日可以使用之運費抵用券張數不限，將依據會員所領取之有效運費抵用券數量用完為止。
									</li>
									<li>同一筆訂單交易，會員僅得使用一張運費抵用券。</li>
									<li>
										使用運費抵用券之該筆交易若有取消交易或是交易未完成的情況，將返還與該運費抵用券成功使用時相同效期(使用期限)之運費抵用券予會員並恢復至未使用之狀態，會員得否於下一筆交易結帳時成功使用運費抵用券，仍需以當時之實際使用限制及條件為準。
									</li>
									<li>
										未領取、超過使用期限、使用名額已滿或是其他無法成功使用之運費抵用券將自動失效，會員不得再主張權利。
									</li>
									<li>運費抵用券不得轉讓、兌換現金或其他利益。</li>
									<li>本規則以中華民國法令為準據法。</li>
									<li>
										關於會員間因本規則或因使用運費抵用券所生之爭議，如因此而涉訟，除法令另有強制或禁止之規定者應依其規定者外，以台灣台北地方法院為第一審管轄法院。
									</li>
									<li>
										保留隨時修改、變更或終止本規則、運費抵用券活動內容或是相關事宜之權利。修改後之運費抵用券規則、內容或是相關事宜，露天拍賣得於網站公告，不另行個別通知。
									</li>
									<li>
										對於本規則、運費抵用券活動內容、注意事項及所有關於運費抵用券之事宜保有最終解釋權。
									</li>
								</ol>
								{/* <img class="coupon-toggle" src="assets/images/coupon/arrow_up.png"> */}
							</div>
						</article>
					</div>
				</div>
			</section>
		</>
	);
}