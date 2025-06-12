"use client";

import { showCartAlert } from "@/utils/sweetalert";


export default function QnA() {
    const addQA = async (e) => {
      e.preventDefault();
      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const telephone = document.getElementById("tel")?.value.trim();
      const address = document.getElementById("address")?.value.trim();
      const message = document.getElementById("message")?.value.trim();

      if (!name || !email || !telephone || !address || !message) {
        showCartAlert.error("請填寫所有欄位");
        return; // 結束函式
      }
      const data = {
        name,
        email,
        telephone,
        address,
        message,
      }
      try{
        const response = await fetch("/api/home/qna", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(data),
        });
        const text = await response.text();
        // const data = response.ok ? JSON.parse(text) : {message: text}; 
        if(response.ok){
          showCartAlert.success("已送出表單");
        }else{
          console.log('45454');
        }
      }catch(error){
        console.error(`表單送出失敗: ${error.message}`);
      }
    };
    return(
        <>
            <section className="d-flex fa !mt-16">
          <h2
            className="title-style text-center !mb-6 md:!mb-14"
            data-aos="fade-down"
            data-aos-easing="linear"
            data-aos-duration={700}
          >
            Q&amp;A
          </h2>
          <div className="FQA-main container">
            <div
              className="left-item"
              data-aos="fade-right"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <form>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">
                    姓名:
                  </label>
                  <input
                    type="text"
                    className="form-control focus-ring"
                    id="name"
                    aria-describedby="emailHelp"
                    placeholder="請輸入姓名"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="tel" className="form-label">
                    電話:
                  </label>
                  <input
                    type="tel"
                    className="form-control focus-ring"
                    id="tel"
                    aria-describedby="emailHelp"
                    placeholder="請輸入電話"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email:
                  </label>
                  <input
                    type="email"
                    className="form-control focus-ring"
                    id="email"
                    aria-describedby="emailHelp"
                    placeholder="請輸入信箱"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="address" className="form-label">
                    地址:
                  </label>
                  <input
                    type="text"
                    className="form-control focus-ring"
                    id="address"
                    aria-describedby="emailHelp"
                    placeholder="請輸入地址"
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="message" className="form-label">
                    其他:
                  </label>
                  <textarea
                    type="text"
                    className="form-control focus-ring"
                    id="message"
                    aria-describedby="emailHelp"
                    placeholder="請輸入信箱"
                    rows={4}
                    cols={50}
                    defaultValue={""}
                  />
                </div>
                <button type="submit" className="submit btn btn-primary" 
                onClick={addQA}>
                  送出
                </button>
              </form>
            </div>
            <div
              className="right-item"
              data-aos="fade-left"
              data-aos-easing="linear"
              data-aos-duration={700}
            >
              <img src="/images/index/fa-bg.jpg" alt="img" />
            </div>
          </div>
        </section>
        </>
    )
}